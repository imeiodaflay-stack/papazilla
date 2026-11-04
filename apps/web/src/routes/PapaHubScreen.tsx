import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import zillaChef from '../assets/zilla-chef.webp';
import { listPets } from '../lib/petsStore.js';
import { buildPetPlan } from '../lib/recipeEngine.js';
import { formatGrams } from '../lib/recipeDisplay.js';
import { joinPt } from '../lib/petLabel.js';
import {
  REMINDER_LEAD_DAYS, addDays, confirmPots, costOf, diffDays, discardFornalha, formatDay, formatMoney,
  formatKg, getInProgress, getPapaSelectedPets, getStock, parseMoney, previousWithCost, setPapaSelectedPets,
  stockStatus, todayIso, totalPotsPerDay, updateFornalha, type Fornalha, type FornalhaItem,
} from '../lib/fornalhaStore.js';
import { AlterarReceitaSheet, JarIcon, PencilIcon, PetPortrait, Sheet, StockStrip } from '../components/FornalhaUi.js';

/**
 * Papá por estados (build de teste do ciclo da fornalha):
 * escolher cães → (Planejar) → comprando → custo → (Modo Cozinha) → acompanhando.
 */
export function PapaHubScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 3200);
  }

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      toast(state.toast);
      navigate('.', { replace: true, state: null });
    }
  }, []);

  const inProgress = getInProgress();
  const stock = getStock();

  let view;
  if (inProgress?.stage === 'cooking') {
    view = <CookingCard fornalha={inProgress} onContinue={() => navigate('/papa/cozinha')} />;
  } else if (inProgress) {
    view = <ShoppingFlow key={inProgress.id} fornalha={inProgress} onChange={refresh} onToast={toast} />;
  } else if (stock) {
    view = <StockView key={stock.id} fornalha={stock} onChange={refresh} />;
  } else {
    view = <ChoosePets />;
  }

  return (
    <div className="home-content fz-stack">
      {stock && inProgress ? <StockStrip stock={stock} /> : null}
      {view}
      {toastMsg ? <div className="pz-toast is-visible" role="status">{toastMsg}</div> : null}
    </div>
  );
}

// ---- 0b, 0c, 0d: para quem vamos cozinhar ----

function ChoosePets() {
  const navigate = useNavigate();
  const pets = listPets();
  const [selected, setSelected] = useState<Set<string>>(() => {
    const stored = getPapaSelectedPets()?.filter((id) => pets.some((p) => p.id === id));
    return new Set(stored && stored.length > 0 ? stored : pets.map((p) => p.id));
  });
  const grams = useMemo(() => {
    const map = new Map<string, number>();
    for (const pet of pets) {
      try {
        map.set(pet.id, buildPetPlan(pet, { formulation: 'padrao', supplement: 'food-dog', predominantProtein: 'chicken-pork' }).totalGramsPerDay);
      } catch {
        /* pet sem dados suficientes: sem gramas */
      }
    }
    return map;
  }, [pets.map((p) => `${p.id}:${p.updatedAt}`).join('|')]);

  const meta = (id: string) => (grams.get(id) ? `${formatGrams(grams.get(id)!)} por dia` : undefined);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else next.add(id);
      return next;
    });
  }

  function plan() {
    setPapaSelectedPets([...selected]);
    navigate('/papa/planejar');
  }

  if (pets.length === 1) {
    const pet = pets[0]!;
    return (
      <>
        <h1 className="fz-h1">Vamos planejar a comida {pet.sex === 'Fêmea' ? 'da' : 'do'} {pet.name}?</h1>
        <PetPortrait pet={pet} meta={meta(pet.id)} single />
        <button type="button" className="pz-button pz-button--primary wide" onClick={plan}>Planejar a fornalha <span aria-hidden="true">→</span></button>
        <button type="button" className="fz-link" onClick={() => navigate('/anamnese')}>+ Cadastrar outro cão</button>
      </>
    );
  }

  const count = selected.size;
  return (
    <>
      <div className="fz-stack" style={{ gap: '0.3rem' }}>
        <h1 className="fz-h1">{pets.length > 2 ? 'Para quem vamos cozinhar?' : 'Vamos planejar a comida da matilha?'}</h1>
        <p className="fz-muted">Toque nos cães para escolher para quem você vai cozinhar desta vez. Dá para marcar mais de um.</p>
      </div>
      <div className="fz-portrait-grid" role="group" aria-label="Cozinhar para">
        {pets.map((pet) => (
          <PetPortrait key={pet.id} pet={pet} meta={meta(pet.id)} selectable selected={selected.has(pet.id)} onToggle={() => toggle(pet.id)} />
        ))}
        {pets.length > 2 ? (
          <button type="button" className="fz-portrait fz-portrait--add" onClick={() => navigate('/anamnese')}>
            <span aria-hidden="true" style={{ fontSize: '1.6rem' }}>＋</span>
            Cadastrar outro cão
          </button>
        ) : null}
      </div>
      <button type="button" className="pz-button pz-button--primary wide" onClick={plan}>
        Planejar para {count} {count === 1 ? 'cão' : 'cães'} <span aria-hidden="true">→</span>
      </button>
      {pets.length <= 2 ? <button type="button" className="fz-link" onClick={() => navigate('/anamnese')}>+ Cadastrar outro cão</button> : null}
    </>
  );
}

// ---- 2 e 3: comprando e custo ----

function ShoppingFlow({ fornalha, onChange, onToast }: { fornalha: Fornalha; onChange: () => void; onToast: (m: string) => void }) {
  const navigate = useNavigate();
  const [showList, setShowList] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const shoppingItems = fornalha.items.filter((item) => !item.pantry);
  const allChecked = shoppingItems.every((item) => item.checked);

  function setItem(id: string, patch: Partial<FornalhaItem>) {
    updateFornalha(fornalha.id, { items: fornalha.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
    onChange();
  }

  function checkAll() {
    updateFornalha(fornalha.id, { items: fornalha.items.map((item) => ({ ...item, checked: item.pantry ? item.checked : true })) });
    setShowList(false);
    onChange();
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
      <div className="fz-stack" style={{ gap: '0.25rem' }}>
        <p className="fz-kicker">{joinPt(fornalha.pets.map((p) => p.name))} · {fornalha.days} dias</p>
        <h1 className="fz-h1">{allChecked && !showList ? 'Tudo pronto para a fornalha' : 'Lista de compras'}</h1>
      </div>
      <button type="button" className="pz-button pz-button--outline" style={{ minHeight: 44, padding: '0 0.8rem', flex: 'none', fontSize: '0.8125rem' }} onClick={() => setEditing(true)}>
        <PencilIcon size={14} /> Alterar receita
      </button>
    </div>
  );

  const sheets = (
    <>
      {editing ? <AlterarReceitaSheet recipeId={fornalha.recipeId} petIds={fornalha.pets.map((p) => p.id)} onClose={() => setEditing(false)} /> : null}
      {confirmDiscard ? (
        <Sheet labelledBy="fz-descartar" onClose={() => setConfirmDiscard(false)}>
          <h2 id="fz-descartar" className="fz-h2">Descartar este planejamento?</h2>
          <p className="fz-muted">A lista e os valores anotados somem. A receita continua em Salvas.</p>
          <button type="button" className="pz-button pz-button--primary wide" onClick={() => { discardFornalha(fornalha.id); setConfirmDiscard(false); onChange(); onToast('Planejamento descartado.'); }}>Descartar</button>
          <button type="button" className="fz-link fz-link--muted" onClick={() => setConfirmDiscard(false)}>Manter</button>
        </Sheet>
      ) : null}
    </>
  );

  if (allChecked && !showList) {
    return (
      <>
        {header}
        <CostCard fornalha={fornalha} onAddPrice={() => setShowList(true)} />
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/papa/cozinha')}>Preparar nova fornalha <span aria-hidden="true">→</span></button>
        <button type="button" className="fz-link" onClick={() => setShowList(true)}>Voltar à lista de compras</button>
        {sheets}
      </>
    );
  }

  const done = shoppingItems.filter((item) => item.checked).length;
  const cost = costOf(fornalha);
  const groups = [...new Set(fornalha.items.map((item) => item.groupTitle))];

  return (
    <>
      {header}
      <div className="fz-progress">
        <div className="fz-progress__text"><span>{done} de {shoppingItems.length} itens</span><span>Valores são opcionais</span></div>
        <span className="fz-bar" role="progressbar" aria-label="Itens comprados" aria-valuenow={done} aria-valuemin={0} aria-valuemax={shoppingItems.length} style={{ height: 8 }}>
          <span style={{ width: `${shoppingItems.length ? (done / shoppingItems.length) * 100 : 0}%` }} />
        </span>
      </div>
      {groups.map((title) => (
        <section key={title} className="fz-stack" style={{ gap: '0.4rem' }}>
          <h2 className="fz-section-title">{title}</h2>
          {fornalha.items.filter((item) => item.groupTitle === title).map((item) => (
            <ShoppingItem key={item.id} item={item} onChange={(patch) => setItem(item.id, patch)} />
          ))}
        </section>
      ))}
      <div className="fz-summary">
        <div>
          <strong>{cost.priced > 0 ? formatMoney(cost.total) : 'Sem valores ainda'}</strong>
          <small>{cost.priced > 0 ? `${cost.priced} ${cost.priced === 1 ? 'item' : 'itens'} com valor` : 'Checou tudo? O custo aparece aqui.'}</small>
        </div>
        <button type="button" className="pz-button pz-button--outline" style={{ minHeight: 44, padding: '0 0.9rem', fontSize: '0.875rem' }} onClick={checkAll}>
          {allChecked ? 'Ver custo' : 'Já tenho tudo'}
        </button>
      </div>
      <button type="button" className="fz-link fz-link--muted" onClick={() => setConfirmDiscard(true)}>Descartar este planejamento</button>
      {sheets}
    </>
  );
}

function ShoppingItem({ item, onChange }: { item: FornalhaItem; onChange: (patch: Partial<FornalhaItem>) => void }) {
  const [text, setText] = useState(item.price !== undefined ? formatMoney(item.price) : '');
  const id = `fz-item-${item.id}`;
  return (
    <div className={`fz-item${item.checked ? ' is-checked' : ''}`}>
      <input id={id} type="checkbox" checked={item.checked} onChange={(event) => onChange({ checked: event.target.checked })} />
      <label htmlFor={id}>
        <strong>{item.label}</strong>
        <small>{item.pantry ? 'Se acabou em casa' : item.rawGrams !== undefined ? `${formatKg(item.rawGrams)} cru` : ''}</small>
      </label>
      <input
        className={`fz-price${item.price !== undefined ? ' has-value' : ''}`}
        type="text"
        inputMode="decimal"
        placeholder="+ R$"
        aria-label={`Valor pago em ${item.label}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          const value = parseMoney(text);
          setText(value !== undefined ? formatMoney(value) : '');
          onChange({ price: value, checked: value !== undefined ? true : item.checked });
        }}
      />
    </div>
  );
}

function CostCard({ fornalha, onAddPrice }: { fornalha: Fornalha; onAddPrice: () => void }) {
  const cost = costOf(fornalha);
  const totalGramsPerDay = fornalha.pets.reduce((sum, pet) => sum + pet.gramsPerDay, 0) || 1;
  const perDay = cost.total / Math.max(1, fornalha.days);
  const previous = previousWithCost(fornalha.id);
  const previousPerDay = previous ? costOf(previous).total / Math.max(1, previous.days) : null;

  if (cost.priced === 0) {
    return (
      <section className="fz-card fz-stack">
        <h2 className="fz-h2">Quanto custou?</h2>
        <p className="fz-muted">Anote o que você pagou e o Papazilla calcula o custo da fornalha, por dia e por cão.</p>
        <button type="button" className="pz-button pz-button--outline wide" onClick={onAddPrice}>Anotar valores</button>
      </section>
    );
  }

  return (
    <>
      <section className="fz-card fz-stack">
        <div>
          <p className="fz-kicker">Sua fornalha vai custar</p>
          <p className="fz-money">{formatMoney(cost.total)}</p>
        </div>
        <div className="fz-tiles">
          <div className="fz-tile"><strong>{formatMoney(perDay)}</strong><span>por dia</span></div>
          <div className="fz-tile"><strong>{formatMoney(perDay / Math.max(1, fornalha.pets.length))}</strong><span>por cão por dia (média)</span></div>
        </div>
        {fornalha.pets.length > 1 ? (
          <div className="fz-stack" style={{ gap: '0.4rem' }}>
            {fornalha.pets.map((pet) => (
              <div key={pet.id} className="fz-row">
                <span>{pet.name} · {formatGrams(pet.gramsPerDay)}/dia</span>
                <strong>{formatMoney((perDay * pet.gramsPerDay) / totalGramsPerDay)}/dia</strong>
              </div>
            ))}
          </div>
        ) : null}
      </section>
      {previousPerDay !== null ? (
        <p className={`fz-note ${perDay <= previousPerDay ? 'fz-note--ok' : 'fz-note--warn'}`}>
          {perDay <= previousPerDay
            ? `${formatMoney(previousPerDay - perDay)} a menos por dia que a fornalha anterior.`
            : `${formatMoney(perDay - previousPerDay)} a mais por dia que a fornalha anterior.`}
        </p>
      ) : null}
      {cost.missing.length > 0 ? (
        <div className="fz-card fz-card--line" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem' }}>
          <p className="fz-muted" style={{ flex: 1 }}>
            <strong style={{ color: 'var(--pz-chocolate)' }}>Estimado com {cost.priced} de {cost.count} itens.</strong> Falta o valor de {joinPt(cost.missing.map((item) => item.label.toLowerCase()))}.
          </p>
          <button type="button" className="fz-link" onClick={onAddPrice}>Adicionar</button>
        </div>
      ) : null}
    </>
  );
}

// ---- fornalha no fogo ----

function CookingCard({ fornalha, onContinue }: { fornalha: Fornalha; onContinue: () => void }) {
  return (
    <section className="fz-card fz-card--soft fz-stack">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src={zillaChef} alt="" style={{ width: 80, height: 80, objectFit: 'contain', flex: 'none' }} />
        <div className="fz-stack" style={{ gap: '0.25rem' }}>
          <h1 className="fz-h2">Fornalha no fogo</h1>
          <p className="fz-muted">{fornalha.title} · {joinPt(fornalha.pets.map((p) => p.name))}</p>
        </div>
      </div>
      <button type="button" className="pz-button pz-button--primary wide" onClick={onContinue}>Continuar cozinhando <span aria-hidden="true">→</span></button>
    </section>
  );
}

// ---- 6 e 6b: acompanhando o estoque ----

function StockView({ fornalha, onChange }: { fornalha: Fornalha; onChange: () => void }) {
  const navigate = useNavigate();
  const status = stockStatus(fornalha);
  const [checking, setChecking] = useState(false);
  const [pots, setPots] = useState(status.potsLeft);
  const cost = costOf(fornalha);
  const reminder = addDays(status.endDate, -REMINDER_LEAD_DAYS);
  const reminderPassed = diffDays(todayIso(), reminder) <= 0;
  const late = status.late > 0;
  const circumference = 2 * Math.PI * 52;

  function save(value: number) {
    confirmPots(fornalha, value);
    setChecking(false);
    onChange();
  }

  const stepper = (
    <>
      <div className="fz-stepper">
        <button type="button" aria-label="Menos um potinho" onClick={() => setPots((v) => Math.max(0, v - 1))}>−</button>
        <output aria-live="polite">{pots}<small>{pots === 1 ? 'potinho' : 'potinhos'}</small></output>
        <button type="button" aria-label="Mais um potinho" onClick={() => setPots((v) => v + 1)}>+</button>
      </div>
      {pots > 0 ? (
        <p className="fz-muted" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--pz-success-ink)' }}>
          Com {pots} {pots === 1 ? 'potinho' : 'potinhos'}, dá até {formatDay(addDays(todayIso(), Math.max(1, Math.ceil(pots / Math.max(1, totalPotsPerDay(fornalha)))) - 1))}.
        </p>
      ) : null}
    </>
  );

  return (
    <>
      {late ? (
        <section className="fz-card fz-stack">
          <span className="fz-badge">Previsão era {formatDay(status.endDate)}</span>
          <h1 className="fz-h2">Passou {status.late} {status.late === 1 ? 'dia' : 'dias'}. Ainda tem potinho?</h1>
          <p className="fz-muted">Conta pra gente e o Papazilla ajusta a data.</p>
          {stepper}
          <div className="fz-btn-row">
            <button type="button" className="pz-button pz-button--outline" onClick={() => save(0)}>Acabou tudo</button>
            <button type="button" className="pz-button pz-button--primary" onClick={() => save(pots)}>Confirmar</button>
          </div>
        </section>
      ) : (
        <section className="fz-card fz-stack">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            <div className="fz-ring">
              <svg role="img" aria-label={`${status.percent}% da fornalha restante`} width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--pz-surface-sunken)" strokeWidth="12" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--pz-verde-strong)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(status.percent / 100) * circumference} ${circumference}`} transform="rotate(-90 60 60)" />
              </svg>
              <span className="fz-ring__label" aria-hidden="true">{status.percent}%<small>restante</small></span>
            </div>
            <div className="fz-stack" style={{ gap: '0.35rem' }}>
              <p className="fz-kicker">Fornalha de {fornalha.cookDate ? formatDay(fornalha.cookDate) : 'hoje'}</p>
              <h1 className="fz-h2">Comida até {formatDay(status.endDate)}</h1>
              <p style={{ margin: 0, color: 'var(--pz-success-ink)', font: '700 0.9375rem/1.2 var(--pz-font-support)' }}>
                {status.daysLeft === 1 ? 'Último dia' : `Faltam ${status.daysLeft} dias`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.9rem', borderTop: '1px solid var(--pz-border)' }}>
            <p className="fz-muted" style={{ flex: 1 }}><strong style={{ color: 'var(--pz-chocolate)' }}>{status.potsLeft} potinhos</strong> devem estar na geladeira e no freezer.</p>
            <button type="button" className="pz-button pz-button--outline" style={{ minHeight: 44, padding: '0 0.9rem', fontSize: '0.875rem' }} onClick={() => { setPots(status.potsLeft); setChecking(true); }}>Conferir</button>
          </div>
        </section>
      )}

      <section className="fz-card fz-card--soft fz-stack">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={zillaChef} alt="" style={{ width: 72, height: 72, objectFit: 'contain', flex: 'none' }} />
          <div className="fz-stack" style={{ gap: '0.25rem' }}>
            <h2 className="fz-h2">{late || reminderPassed ? 'Hora da próxima fornalha' : 'Próxima fornalha'}</h2>
            <p className="fz-muted">
              {late || reminderPassed
                ? 'Repetir a última leva poucos toques.'
                : <>O ideal é planejar até <strong style={{ color: 'var(--pz-chocolate)' }}>{formatDay(reminder)}</strong>, com tempo para comprar e cozinhar.</>}
            </p>
          </div>
        </div>
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/papa/planejar')}>Planejar próxima fornalha <span aria-hidden="true">→</span></button>
      </section>

      {cost.priced > 0 && fornalha.finalGrams ? (
        <div className="fz-card fz-card--line fz-row" style={{ padding: '0.9rem 1rem', alignItems: 'center' }}>
          <span>Custo desta fornalha<br /><small className="fz-muted">{formatKg(fornalha.finalGrams)} prontos</small></span>
          <strong>{formatMoney(cost.total / Math.max(1, fornalha.days))}/dia</strong>
        </div>
      ) : null}

      {checking ? (
        <Sheet labelledBy="fz-conferir" onClose={() => setChecking(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><JarIcon /><h2 id="fz-conferir" className="fz-h2">Quantos potinhos ainda tem?</h2></div>
          <p className="fz-muted">Conte geladeira e freezer. A data de fim se ajusta à sua contagem.</p>
          {stepper}
          <button type="button" className="pz-button pz-button--primary wide" onClick={() => save(pots)}>Confirmar</button>
          <button type="button" className="fz-link fz-link--muted" onClick={() => save(0)}>Acabou tudo</button>
        </Sheet>
      ) : null}
    </>
  );
}
