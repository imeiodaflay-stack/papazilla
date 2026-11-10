import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import zillaChef from '../assets/zilla-chef.webp';
import { joinPt } from '../lib/petLabel.js';
import { addCookLog, getRecipe } from '../lib/recipeRepository.js';
import { uploadPhoto } from '../lib/photoUpload.js';
import { recipeSnapshot } from '../lib/fornalhaFlow.js';
import {
  daysFromGrams, formatDay, formatDuration, formatDurationShort, formatKg, getInProgress, getSupplementTiming,
  listFornalhas, setSupplementTiming, todayIso, updateFornalha, type Fornalha, type SupplementTiming,
} from '../lib/fornalhaStore.js';
import { AlterarReceitaSheet, CloseIcon, PencilIcon } from '../components/FornalhaUi.js';
import { RecipeIngredientTable } from '../components/RecipeIngredientTable.js';
import { RecipeFinalizers } from '../components/RecipeFinalizers.js';
import { RecipePreparationSteps } from '../components/RecipePreparationSteps.js';

const LOSS_KINDS = ['Queimou', 'Sobrou cru', 'Virou petisco', 'Outro'];

const RATING_CAPTIONS: Record<number, string> = {
  1: 'Não foi a favorita desta vez.',
  2: 'Não foi a favorita desta vez.',
  3: 'Curtiram a fornalha.',
  4: 'Curtiram a fornalha.',
  5: 'Amaram! Essa vai voltar para o potinho.',
};

/**
 * Modo Cozinha (tela cheia, dentro do container mobile): abertura → preparo
 * numa tela só, com o cronômetro total e o mesmo modo de preparo da receita
 * pronta → guardar comida (segue para Montar estoque).
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

  if (!fornalha) return <Navigate to="/papa" replace />;

  const save = (patch: Partial<Fornalha>) => setFornalha(updateFornalha(fornalha.id, patch));
  const previousSeconds = listFornalhas().find((f) => f.id !== fornalha.id && f.cookSeconds)?.cookSeconds;
  const editSheet = editing
    ? <AlterarReceitaSheet recipeId={fornalha.recipeId} petIds={fornalha.pets.map((p) => p.id)} onClose={() => setEditing(false)} />
    : null;

  if (fornalha.stage === 'shopping' || !fornalha.cookStartedAt) {
    return (
      <>
        <Opening
          fornalha={fornalha}
          onClose={() => navigate('/papa')}
          onEdit={() => setEditing(true)}
          onStart={(cookDate) => save({ stage: 'cooking', cookStartedAt: new Date().toISOString(), cookDate })}
        />
        {editSheet}
      </>
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

  const stored = getRecipe(fornalha.recipeId);
  const snap = stored ? recipeSnapshot(stored) : null;
  const timing = getSupplementTiming() ?? 'serving';

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
        <p className="fz-kicker">{fornalha.title} · {joinPt(fornalha.pets.map((p) => p.name))} · {fornalha.days} dias</p>

        {snap ? (
          <div className="recipe-result-card">
            <RecipeIngredientTable groups={snap.recipe.groups} format="Os dois" />
            <RecipeFinalizers petPlans={snap.petPlans} defaultOpen />
            <RecipePreparationSteps petPlans={snap.petPlans} days={snap.recipe.days} defaultOpen />
          </div>
        ) : (
          <section className="fz-card fz-stack" aria-label="O que pesar">
            <table className="fz-table">
              <thead><tr><th scope="col">Ingrediente</th><th scope="col">Cru</th><th scope="col">Pronto</th></tr></thead>
              <tbody>
                {fornalha.items.filter((i) => !i.pantry).map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.label}</th>
                    <td>{row.rawGrams !== undefined ? formatKg(row.rawGrams) : ''}</td>
                    <td>{row.cookedGrams !== undefined ? formatKg(row.cookedGrams) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {timing === 'cooking' ? (
          <p className="fz-note fz-note--warn"><span><strong>Você escolheu: suplemento no preparo</strong>Espere a comida amornar e misture. Depois disso, não volte ao fogo. Com suplemento, nunca descongele no micro-ondas.</span></p>
        ) : null}
      </main>

      <footer className="fz-kitchen__foot">
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => { save({ cookSeconds: elapsed }); setFinishing(true); }}>Concluir preparo →</button>
      </footer>
      {editSheet}
    </div>
  );
}

function Opening({ fornalha, onClose, onEdit, onStart }: { fornalha: Fornalha; onClose: () => void; onEdit: () => void; onStart: (date: string) => void }) {
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
    </div>
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
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logError, setLogError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canLog = !fornalha.cookLogged && Boolean(getRecipe(fornalha.recipeId));
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

  /**
   * Com nota, o preparo entra na receita (galeria e histórico), com a foto da
   * panela se tiver. A nota é obrigatória no banco (1 a 5).
   */
  async function store() {
    if (saving) return;
    const patch: Partial<Fornalha> = {
      finalGrams,
      photo,
      cookSeconds: elapsed,
      losses: losses.map((kind) => ({ kind, grams: Number(lossGrams) || 0 })),
      cookDate: fornalha.cookDate ?? todayIso(),
    };
    if (canLog && rating > 0 && !logError) {
      setSaving(true);
      try {
        let photoPath = photo ?? '';
        if (photoPath.startsWith('data:')) {
          const blob = await (await fetch(photoPath)).blob();
          photoPath = await uploadPhoto('cook-photos', new File([blob], 'panela.jpg', { type: 'image/jpeg' }));
        }
        await addCookLog(fornalha.recipeId, {
          date: new Date().toISOString(),
          petIds: fornalha.pets.map((p) => p.id),
          rating,
          note: '',
          photoPath,
        });
        patch.photo = photoPath || undefined;
        patch.cookLogged = true;
      } catch {
        setSaving(false);
        setLogError(true);
        return;
      }
    }
    onStore(patch);
  }

  let ratingHelp: string | null = null;
  if (rating > 0) ratingHelp = RATING_CAPTIONS[rating] ?? null;
  else if (photo) ratingHelp = 'Dê uma nota para a foto ir para a galeria e para a receita.';

  return (
    <div className="fz-kitchen">
      <header className="fz-kitchen__head">
        <div className="fz-kitchen__bar">
          <button type="button" className="fz-kitchen__ghost" onClick={onBack}>← Preparo</button>
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
          {photo ? <img src={photo} alt="Foto da panela" /> : (
            <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: 'var(--pz-surface-soft)', color: 'var(--pz-accent-ink)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            </span>
          )}
          <span className="fz-stack" style={{ gap: '0.15rem' }}>
            <strong style={{ font: '700 1rem/1.2 var(--pz-font-support)' }}>{photo ? 'Trocar foto da panela' : 'Foto da panela'}</strong>
            <small className="fz-muted">{canLog ? 'Vai para a galeria com a sua nota' : 'Fica guardada neste aparelho'}</small>
          </span>
        </button>

        {canLog ? (
          <div className="fz-stack" style={{ gap: '0.4rem' }}>
            <p style={{ margin: 0, font: '700 0.9375rem/1.2 var(--pz-font-support)' }}>Os monstrinhos curtiram?</p>
            <div className="recipe-rating" role="group" aria-label="Avaliação da fornalha">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className={value <= rating ? 'is-on' : undefined} aria-label={`${value} de 5`} aria-pressed={value === rating} onClick={() => setRating(value === rating ? 0 : value)}>
                  ♥
                </button>
              ))}
            </div>
            {ratingHelp ? <p className="fz-muted" style={{ fontSize: '0.8125rem' }}>{ratingHelp}</p> : null}
          </div>
        ) : fornalha.cookLogged ? (
          <p className="fz-note fz-note--ok">Este preparo já está na galeria e no histórico da receita.</p>
        ) : null}

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
        {logError ? (
          <p className="fz-note fz-note--warn" role="alert">Não deu para mandar a foto e a nota para a galeria agora. Dá para guardar a comida assim mesmo e registrar o preparo depois, na receita.</p>
        ) : null}
        <button type="button" className="pz-button pz-button--primary wide" disabled={finalGrams <= 0 || saving} onClick={() => { void store(); }}>
          {saving ? 'Guardando…' : logError ? 'Guardar comida assim mesmo →' : 'Guardar comida →'}
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
