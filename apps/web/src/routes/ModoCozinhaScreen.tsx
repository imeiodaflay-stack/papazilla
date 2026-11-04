import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import zillaChef from '../assets/zilla-chef.webp';
import { joinPt } from '../lib/petLabel.js';
import {
  daysFromGrams, formatDay, formatDuration, formatDurationShort, formatKg, getInProgress, getSupplementTiming,
  listFornalhas, setSupplementTiming, todayIso, updateFornalha, type Fornalha, type SupplementTiming,
} from '../lib/fornalhaStore.js';
import { AlterarReceitaSheet, CloseIcon, PencilIcon } from '../components/FornalhaUi.js';

interface CookStep {
  key: string;
  title: string;
  text: string;
  minutes?: number;
}

const GROUP_STEPS: Record<string, { title: string; text: string; minutes: number }> = {
  proteins: { title: 'Carnes', text: 'Corte em cubos de 2 a 3 cm e cozinhe em água ou no vapor, sem temperos, até não ficar rosado por dentro.', minutes: 20 },
  organs: { title: 'Vísceras', text: 'Corte em pedaços de 1,5 a 2 cm e cozinhe separado das carnes, sem temperos.', minutes: 12 },
  carbs: { title: 'Carboidratos', text: 'Cozinhe até ficar macio. Grãos em água; tubérculos em cubos de 1,5 a 2 cm.', minutes: 25 },
  vegetables: { title: 'Vegetais', text: 'Corte em cubos pequenos e cozinhe em água ou no vapor até ficar macio. Guarde o caldo.', minutes: 15 },
};

const LOSS_KINDS = ['Queimou', 'Sobrou cru', 'Virou petisco', 'Outro'];

/**
 * Modo Cozinha (tela cheia): abertura → etapas por grupo com cronômetro →
 * finalizar → guardar comida (segue para Montar estoque).
 */
export function ModoCozinhaScreen() {
  const navigate = useNavigate();
  const [fornalha, setFornalha] = useState<Fornalha | undefined>(() => getInProgress());
  const [editing, setEditing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Tela acesa enquanto cozinha (onde o navegador permitir).
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } };
    if (fornalha?.stage === 'cooking' && nav.wakeLock) {
      nav.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => undefined);
    }
    return () => { void lock?.release().catch(() => undefined); };
  }, [fornalha?.stage]);

  const steps: CookStep[] = useMemo(() => {
    if (!fornalha) return [];
    const groups = [...new Set(fornalha.items.filter((i) => !i.pantry).map((i) => i.group))];
    return [
      ...groups.filter((g) => GROUP_STEPS[g]).map((g) => ({ key: g, ...GROUP_STEPS[g]! })),
      { key: 'finalizar', title: 'Finalizar', text: '' },
    ];
  }, [fornalha?.id]);

  if (!fornalha) return <Navigate to="/papa" replace />;

  const save = (patch: Partial<Fornalha>) => setFornalha(updateFornalha(fornalha.id, patch));
  const previousSeconds = listFornalhas().find((f) => f.id !== fornalha.id && f.cookSeconds)?.cookSeconds;

  if (fornalha.stage === 'shopping' || !fornalha.cookStartedAt) {
    return (
      <Opening
        fornalha={fornalha}
        onClose={() => navigate('/papa')}
        onEdit={() => setEditing(true)}
        onStart={(cookDate) => save({ stage: 'cooking', cookStartedAt: new Date().toISOString(), cookDate, cookStep: 0 })}
        editing={editing}
        onCloseEdit={() => setEditing(false)}
      />
    );
  }

  const elapsed = fornalha.cookSeconds ?? Math.floor((now - new Date(fornalha.cookStartedAt).getTime()) / 1000);

  if (finishing || fornalha.cookSeconds !== undefined) {
    return (
      <Finish
        fornalha={fornalha}
        elapsed={elapsed}
        previousSeconds={previousSeconds}
        onBack={() => { setFinishing(false); save({ cookSeconds: undefined }); }}
        onStore={(patch) => { save(patch); navigate('/papa/estoque'); }}
      />
    );
  }

  const index = Math.min(fornalha.cookStep ?? 0, steps.length - 1);
  const step = steps[index]!;
  const isLast = index === steps.length - 1;

  return (
    <div className="fz-kitchen">
      <header className="fz-kitchen__head">
        <div className="fz-kitchen__bar">
          <button type="button" className="fz-kitchen__ghost" aria-label="Pausar e sair do Modo Cozinha" onClick={() => navigate('/papa')}><CloseIcon /></button>
          <strong>Modo Cozinha</strong>
          <button type="button" className="fz-kitchen__ghost" onClick={() => setEditing(true)}><PencilIcon size={14} /> Receita</button>
        </div>
        <div className="fz-kitchen__clock" role="timer" aria-label={`Tempo de preparo ${formatDuration(elapsed)}`}>
          <span>{formatDuration(elapsed)}</span>
          <small>{previousSeconds ? `Última fornalha: ${formatDurationShort(previousSeconds)}` : `Cozinhando em ${fornalha.cookDate ? formatDay(fornalha.cookDate) : 'hoje'}`}</small>
        </div>
      </header>

      <main className="fz-kitchen__body">
        <div className="fz-stack" style={{ gap: '0.5rem' }}>
          <div className="fz-row" style={{ color: 'var(--pz-ink-muted)', fontWeight: 700 }}>
            <span>Etapa {index + 1} de {steps.length}</span>
            <span>{isLast ? 'Última etapa' : `Depois: ${steps[index + 1]!.title.toLowerCase()}`}</span>
          </div>
          <div className="fz-steps" aria-hidden="true" style={{ ['--fz-steps' as string]: steps.length }}>
            {steps.map((s, i) => <span key={s.key} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} />)}
          </div>
        </div>

        {isLast ? <FinalStep fornalha={fornalha} /> : <GroupStep key={step.key} fornalha={fornalha} step={step} now={now} />}

        {!isLast && fornalha.saltGuidance ? (
          <p className="fz-note fz-note--warn"><span><strong>Sal</strong>{fornalha.saltGuidance}</span></p>
        ) : null}
      </main>

      <footer className="fz-kitchen__foot">
        <div className="fz-btn-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <button type="button" className="pz-button pz-button--outline" disabled={index === 0} onClick={() => save({ cookStep: index - 1 })}>Voltar</button>
          {isLast ? (
            <button type="button" className="pz-button pz-button--primary" onClick={() => { save({ cookSeconds: elapsed }); setFinishing(true); }}>Concluir preparo →</button>
          ) : (
            <button type="button" className="pz-button pz-button--primary" onClick={() => save({ cookStep: index + 1 })}>Próxima etapa →</button>
          )}
        </div>
      </footer>
      {editing ? <AlterarReceitaSheet recipeId={fornalha.recipeId} petIds={fornalha.pets.map((p) => p.id)} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

function Opening({
  fornalha, onClose, onEdit, onStart, editing, onCloseEdit,
}: {
  fornalha: Fornalha; onClose: () => void; onEdit: () => void; onStart: (date: string) => void; editing: boolean; onCloseEdit: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [timing, setTiming] = useState<SupplementTiming>(() => getSupplementTiming() ?? 'serving');
  const today = todayIso();
  const items = fornalha.items.filter((i) => !i.pantry).length;

  function pick(value: SupplementTiming) {
    setTiming(value);
    setSupplementTiming(value);
  }

  return (
    <div className="fz-kitchen">
      <header className="fz-kitchen__head">
        <div className="fz-kitchen__bar">
          <button type="button" className="fz-kitchen__ghost" aria-label="Fechar e voltar" onClick={onClose}><CloseIcon /></button>
          <strong>Modo Cozinha</strong>
          <button type="button" className="fz-kitchen__ghost" aria-label="Alterar receita" onClick={onEdit}><PencilIcon size={16} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <img src={zillaChef} alt="" style={{ width: 86, height: 86, objectFit: 'contain', flex: 'none' }} />
          <div className="fz-stack" style={{ gap: '0.25rem' }}>
            <h1 style={{ margin: 0, font: '600 1.75rem/1.05 var(--pz-font-display)' }}>Hora da fornalha!</h1>
            <p style={{ margin: 0, color: 'var(--pz-pessego)', font: '600 0.875rem/1.35 var(--pz-font-support)' }}>
              {fornalha.title} · {joinPt(fornalha.pets.map((p) => p.name))} · {fornalha.days} dias
            </p>
          </div>
        </div>
      </header>

      <main className="fz-kitchen__body">
        <div className="fz-card fz-card--line fz-field">
          <label htmlFor="fz-cook-date">Dia do preparo</label>
          <input id="fz-cook-date" type="date" value={date} max={today} onChange={(event) => setDate(event.target.value || today)} />
          <small className="fz-muted">{date === today ? `Hoje, ${formatDay(today)}` : formatDay(date)}</small>
        </div>

        <section className="fz-card fz-stack" style={{ gap: '0.5rem' }} aria-labelledby="fz-separe">
          <h2 id="fz-separe" style={{ margin: 0, font: '800 0.9375rem/1.2 var(--pz-font-support)' }}>Separe antes de começar</h2>
          {[`Ingredientes da lista (${items} itens)`, 'Balança de cozinha', 'Panelas adequadas à quantidade da receita', 'Potes limpos', 'Tábua só para a carne crua'].map((label) => (
            <label key={label} className="fz-check"><input type="checkbox" />{label}</label>
          ))}
        </section>

        <fieldset className="fz-card fz-card--line fz-stack" style={{ gap: '0.6rem', margin: 0 }}>
          <legend style={{ padding: '0 0.25rem', font: '800 0.9375rem/1.2 var(--pz-font-support)' }}>O suplemento vai</legend>
          <div className="fz-segmented" role="radiogroup">
            <button type="button" role="radio" aria-checked={timing === 'cooking'} onClick={() => pick('cooking')}>No preparo</button>
            <button type="button" role="radio" aria-checked={timing === 'serving'} onClick={() => pick('serving')}>Na hora de servir</button>
          </div>
          <small className="fz-muted">Fica salvo para as próximas fornalhas.</small>
        </fieldset>
      </main>

      <footer className="fz-kitchen__foot">
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => onStart(date)}>Começar e ligar o cronômetro</button>
      </footer>
      {editing ? <AlterarReceitaSheet recipeId={fornalha.recipeId} petIds={fornalha.pets.map((p) => p.id)} onClose={onCloseEdit} /> : null}
    </div>
  );
}

function GroupStep({ fornalha, step, now }: { fornalha: Fornalha; step: CookStep; now: number }) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const rows = fornalha.items.filter((i) => i.group === step.key);
  const remaining = endsAt ? Math.max(0, Math.round((endsAt - now) / 1000)) : (step.minutes ?? 0) * 60;
  const finished = endsAt !== null && remaining === 0;

  useEffect(() => {
    if (finished) {
      try { navigator.vibrate?.([300, 150, 300]); } catch { /* sem vibração */ }
    }
  }, [finished]);

  return (
    <section className="fz-card fz-stack" style={{ gap: '0.75rem' }} aria-labelledby="fz-etapa">
      <h1 id="fz-etapa" className="fz-h2">{step.title}</h1>
      <p style={{ margin: 0, fontSize: '1.0625rem', lineHeight: 1.5 }}>{step.text}</p>
      <table className="fz-table">
        <thead><tr><th scope="col">Ingrediente</th><th scope="col">Cru</th><th scope="col">Cozido</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              <td>{row.rawGrams !== undefined ? formatKg(row.rawGrams) : ''}</td>
              <td>{row.cookedGrams !== undefined ? formatKg(row.cookedGrams) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {step.minutes ? (
        <button type="button" className={`fz-timer${endsAt ? ' is-running' : ''}`} aria-live="polite" onClick={() => setEndsAt(endsAt ? null : Date.now() + (step.minutes ?? 0) * 60_000)}>
          <span>{finished ? 'Tempo da etapa terminou' : `Cronômetro da etapa · ${formatDuration(remaining).slice(2)}`}</span>
          <b>{endsAt ? (finished ? 'Ok' : 'Parar') : 'Iniciar'}</b>
        </button>
      ) : null}
    </section>
  );
}

function FinalStep({ fornalha }: { fornalha: Fornalha }) {
  const timing = getSupplementTiming() ?? 'serving';
  return (
    <section className="fz-card fz-stack" style={{ gap: '0.75rem' }} aria-labelledby="fz-final">
      <h1 id="fz-final" className="fz-h2">Escorra, espere amornar e misture</h1>
      <p style={{ margin: 0, fontSize: '1.0625rem', lineHeight: 1.5 }}>Desfie ou pique depois de cozido e misture tudo até ficar bem distribuído. Não ofereça a comida quente.</p>
      {timing === 'cooking' ? (
        <p className="fz-note fz-note--warn"><span><strong>{fornalha.supplementName} e óleos, agora</strong>Espere a comida amornar e misture. Depois disso, não volte ao fogo. Com suplemento, nunca descongele no micro-ondas.</span></p>
      ) : (
        <p className="fz-note"><span><strong>{fornalha.supplementName} na hora de servir</strong>Não vai na panela. Adicione à porção já fria ou morna, na hora de servir.</span></p>
      )}
    </section>
  );
}

function Finish({
  fornalha, elapsed, previousSeconds, onBack, onStore,
}: {
  fornalha: Fornalha; elapsed: number; previousSeconds?: number; onBack: () => void; onStore: (patch: Partial<Fornalha>) => void;
}) {
  const [grams, setGrams] = useState(() => String(Math.round(fornalha.finalGrams ?? fornalha.totalCookedGrams)));
  const [losses, setLosses] = useState<string[]>(() => fornalha.losses.map((l) => l.kind));
  const [lossGrams, setLossGrams] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(fornalha.photo);
  const fileRef = useRef<HTMLInputElement>(null);
  const finalGrams = Math.max(0, Number(grams.replace(',', '.')) || 0);
  const days = daysFromGrams(finalGrams, fornalha.cookedGramsPerDay);
  const diff = fornalha.totalCookedGrams > 0 ? Math.round(((finalGrams - fornalha.totalCookedGrams) / fornalha.totalCookedGrams) * 100) : 0;
  const delta = previousSeconds ? previousSeconds - elapsed : 0;

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhoto(await shrinkPhoto(file));
  }

  return (
    <div className="fz-kitchen">
      <header className="fz-kitchen__head">
        <div className="fz-kitchen__bar">
          <button type="button" className="fz-kitchen__ghost" onClick={onBack}>← Etapas</button>
          <strong>Guardar comida</strong>
          <span style={{ width: 44 }} />
        </div>
        <div className="fz-kitchen__clock">
          <span style={{ fontSize: '2.5rem' }}>{formatDuration(elapsed)}</span>
          <small>
            {previousSeconds
              ? delta >= 0 ? `${formatDurationShort(delta)} mais rápido que a última` : `${formatDurationShort(-delta)} a mais que a última`
              : 'Primeira fornalha cronometrada'}
          </small>
        </div>
      </header>

      <main className="fz-kitchen__body">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => { void onPhoto(event); }} />
        <button type="button" className="fz-photo" onClick={() => fileRef.current?.click()}>
          {photo ? <img src={photo} alt="Foto da panela" /> : <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: 'var(--pz-surface-soft)', color: 'var(--pz-accent-ink)' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>}
          <span className="fz-stack" style={{ gap: '0.15rem' }}>
            <strong style={{ font: '700 1rem/1.2 var(--pz-font-support)' }}>{photo ? 'Trocar foto da panela' : 'Foto da panela'}</strong>
            <small className="fz-muted">Fica guardada neste aparelho</small>
          </span>
        </button>

        <div className="fz-field">
          <label htmlFor="fz-final">Peso final da comida pronta (g)</label>
          <input id="fz-final" type="text" inputMode="numeric" value={grams} onChange={(event) => setGrams(event.target.value)} aria-describedby="fz-final-help" />
          <p id="fz-final-help" className="fz-muted">
            Previsto: {formatKg(fornalha.totalCookedGrams)}.{' '}
            {diff === 0
              ? `Dá para ${days} dias.`
              : `Rendeu ${Math.abs(diff)}% ${diff < 0 ? 'menos' : 'mais'}. A porção de cada cão continua a mesma, então a fornalha dura ${days} ${days === 1 ? 'dia' : 'dias'}${days !== fornalha.days ? ` em vez de ${fornalha.days}` : ''}.`}
          </p>
        </div>

        <fieldset style={{ margin: 0, padding: 0, border: 0 }} className="fz-stack">
          <legend style={{ padding: 0, marginBottom: '0.5rem', font: '700 0.9375rem/1.2 var(--pz-font-support)' }}>Perdas e sobras</legend>
          <div className="fz-chips">
            {LOSS_KINDS.map((kind) => (
              <button key={kind} type="button" className="fz-chip" aria-pressed={losses.includes(kind)} onClick={() => setLosses((l) => (l.includes(kind) ? l.filter((k) => k !== kind) : [...l, kind]))}>
                {kind}
              </button>
            ))}
          </div>
          {losses.length > 0 ? (
            <div className="fz-field">
              <label htmlFor="fz-loss">Quanto, mais ou menos (g)</label>
              <input id="fz-loss" type="text" inputMode="numeric" value={lossGrams} onChange={(event) => setLossGrams(event.target.value)} placeholder="Ex.: 60" />
            </div>
          ) : null}
        </fieldset>
      </main>

      <footer className="fz-kitchen__foot">
        <button
          type="button"
          className="pz-button pz-button--primary wide"
          disabled={finalGrams <= 0}
          onClick={() => onStore({
            finalGrams,
            photo,
            cookSeconds: elapsed,
            losses: losses.map((kind) => ({ kind, grams: Number(lossGrams) || 0 })),
            cookDate: fornalha.cookDate ?? todayIso(),
          })}
        >
          Guardar comida →
        </button>
      </footer>
    </div>
  );
}

/** Reduz a foto para caber no armazenamento do aparelho (~640 px, JPEG). */
async function shrinkPhoto(file: File): Promise<string | undefined> {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, 640 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return undefined;
  }
}
