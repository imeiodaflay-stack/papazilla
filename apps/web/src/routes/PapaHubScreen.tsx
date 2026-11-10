import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import zillaChef from '../assets/zilla-chef.webp';
import { listPets } from '../lib/petsStore.js';
import { buildPetPlan } from '../lib/recipeEngine.js';
import { displayRecipeTitle, formatGrams } from '../lib/recipeDisplay.js';
import { getRecipe, listRecipes } from '../lib/recipeRepository.js';
import { getSubscription, hasActiveAccess } from '../lib/subscription.js';
import { draftFromRecipe } from '../lib/fornalhaFlow.js';
import { joinPt } from '../lib/petLabel.js';
import {
  REMINDER_LEAD_DAYS, addDays, confirmPots, costOf, daysFromGrams, diffDays, discardFornalha, formatDay, formatMoney,
  formatKg, getInProgress, getPapaSelectedPets, getStock, parseMoney, previousWithCost, setPapaSelectedPets,
  stockStatus, todayIso, totalPotsPerDay, updateFornalha, type Fornalha, type FornalhaItem,
} from '../lib/fornalhaStore.js';
import { AtivarAvisos, RemindersOffer, useActivateReminders } from '../components/RemindersUi.js';
import { hasChosenReminders, offerSeen } from '../lib/reminders.js';
import { AlterarReceitaSheet, JarIcon, PencilIcon, PetPortrait, PlusIcon, RepeatIcon, Sheet, StockStrip } from '../components/FornalhaUi.js';

/**
 * Papá por estados (ciclo da fornalha):
 * escolher cães → (Planejar) → lista de compras com custo → (Modo Cozinha) → acompanhando.
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

  const [offer, setOffer] = useState(false);
  const activate = useActivateReminders();

  useEffect(() => {
    const state = location.state as { toast?: string; offerReminders?: boolean } | null;
    if (state?.toast) toast(state.toast);
    if (state?.offerReminders && !hasChosenReminders() && !offerSeen()) {
      window.setTimeout(() => setOffer(true), 900);
    }
    if (state) navigate('.', { replace: true, state: null });
  }, []);

  const inProgress = getInProgress();
  const stock = getStock();

  let view;
  if (stock) {
    view = <Overview key={stock.id} stock={stock} next={inProgress} onChange={refresh} />;
  } else if (inProgress?.stage === 'cooking') {
    view = <CookingCard fornalha={inProgress} onContinue={() => navigate('/papa/cozinha')} onChange={refresh} />;
  } else if (inProgress) {
    view = <ShoppingList key={inProgress.id} fornalha={inProgress} onChange={refresh} onToast={toast} />;
  } else {
    view = <ChoosePets />;
  }

  return (
    <div className="home-content fz-stack">
      {view}
      {offer ? <RemindersOffer onClose={() => setOffer(false)} onToast={toast} /> : null}
      {activate.show && !offer ? <AtivarAvisos onDone={activate.dismiss} onToast={toast} /> : null}
      {toastMsg ? <div className="pz-toast is-visible" role="status">{toastMsg}</div> : null}
    </div>
  );
}

/** Lista de compras aberta a partir da visão geral, quando ainda há estoque em casa. */
export function ComprasScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setVersion] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const inProgress = getInProgress();
  const stock = getStock();

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (!state?.toast) return;
    setToastMsg(state.toast);
    navigate('.', { replace: true, state: null });
    const timer = window.setTimeout(() => setToastMsg(null), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!inProgress || inProgress.stage !== 'shopping') return <Navigate to="/papa" replace />;

  return (
    <div className="home-content fz-stack">
      {stock ? <StockStrip stock={stock} onClick={() => navigate('/papa')} /> : null}
      <ShoppingList
        key={inProgress.id}
        fornalha={inProgress}
        onBack={() => navigate('/papa')}
        onChange={() => setVersion((v) => v + 1)}
        onToast={(message) => navigate('/papa', { replace: true, state: { toast: message } })}
      />
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

// ---- 2: lista de compras com custo na mesma tela ----

function ShoppingList({ fornalha, onBack, onChange, onToast }: { fornalha: Fornalha; onBack?: () => void; onChange: () => void; onToast: (m: string) => void }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const items = fornalha.items.filter((item) => !item.pantry);
  const allChecked = items.every((item) => item.checked);
  const done = items.filter((item) => item.checked).length;
  const groups = [...new Set(items.map((item) => item.groupTitle))];

  function setItem(id: string, patch: Partial<FornalhaItem>) {
    updateFornalha(fornalha.id, { items: fornalha.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
    onChange();
  }

  function checkAll() {
    updateFornalha(fornalha.id, { items: fornalha.items.map((item) => ({ ...item, checked: true })) });
    onChange();
  }

  return (
    <>
      {onBack ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <button type="button" className="fz-icon-btn" aria-label="Voltar para o Papá" onClick={onBack}>←</button>
          <button type="button" className="pz-button pz-button--outline" style={{ minHeight: 44, padding: '0 0.8rem', flex: 'none', fontSize: '0.8125rem' }} onClick={() => setEditing(true)}>
            <PencilIcon size={14} /> Alterar receita
          </button>
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div className="fz-stack" style={{ gap: '0.25rem', flex: 1, minWidth: 0 }}>
          <p className="fz-kicker">{joinPt(fornalha.pets.map((p) => p.name))} · {fornalha.days} dias</p>
          <h1 className="fz-h1">Lista de compras</h1>
        </div>
        {!onBack ? (
          <button type="button" className="pz-button pz-button--outline" style={{ minHeight: 44, padding: '0 0.8rem', flex: 'none', fontSize: '0.8125rem' }} onClick={() => setEditing(true)}>
            <PencilIcon size={14} /> Alterar receita
          </button>
        ) : null}
      </div>

      <div className="fz-progress">
        <div className="fz-progress__text"><span>{done} de {items.length} itens</span><span>Valores são opcionais</span></div>
        <span className="fz-bar" role="progressbar" aria-label="Itens comprados" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} style={{ height: 8 }}>
          <span style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
        </span>
      </div>

      {groups.map((title) => (
        <section key={title} className="fz-stack" style={{ gap: '0.4rem' }}>
          <h2 className="fz-section-title">{title}</h2>
          {items.filter((item) => item.groupTitle === title).map((item) => (
            <ShoppingItem key={item.id} item={item} onChange={(patch) => setItem(item.id, patch)} />
          ))}
        </section>
      ))}

      <CostCard fornalha={fornalha} />

      {!allChecked ? (
        <button type="button" className="pz-button pz-button--outline wide" onClick={checkAll}>Já tenho tudo</button>
      ) : null}
      <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/papa/cozinha')}>
        Preparar a fornalha <span aria-hidden="true">→</span>
      </button>
      <button type="button" className="fz-link fz-link--muted" onClick={() => setConfirmDiscard(true)}>Descartar este planejamento</button>

      {editing ? <AlterarReceitaSheet recipeId={fornalha.recipeId} petIds={fornalha.pets.map((p) => p.id)} onClose={() => setEditing(false)} /> : null}
      {confirmDiscard ? (
        <Sheet labelledBy="fz-descartar" onClose={() => setConfirmDiscard(false)}>
          <h2 id="fz-descartar" className="fz-h2">Descartar este planejamento?</h2>
          <p className="fz-muted">A lista e os valores anotados somem. A receita continua em Salvas.</p>
          <button type="button" className="pz-button pz-button--primary wide" onClick={() => { discardFornalha(fornalha.id); setConfirmDiscard(false); onToast('Planejamento descartado.'); onChange(); }}>Descartar</button>
          <button type="button" className="fz-link fz-link--muted" onClick={() => setConfirmDiscard(false)}>Manter</button>
        </Sheet>
      ) : null}
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
        <small>{item.rawGrams !== undefined ? `${formatKg(item.rawGrams)} cru` : ''}</small>
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

function CostCard({ fornalha }: { fornalha: Fornalha }) {
  const cost = costOf(fornalha);
  const totalGramsPerDay = fornalha.pets.reduce((sum, pet) => sum + pet.gramsPerDay, 0) || 1;
  const perDay = cost.total / Math.max(1, fornalha.days);
  const previous = previousWithCost(fornalha.id);
  const previousPerDay = previous ? costOf(previous).total / Math.max(1, previous.days) : null;

  if (cost.priced === 0) {
    return (
      <p className="fz-note">
        <span><strong>Custo da fornalha</strong>Anote o que pagou em cada item e o custo aparece aqui, por dia e por cão.</span>
      </p>
    );
  }

  return (
    <section className="fz-card fz-stack" aria-label="Custo da fornalha">
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
      {cost.missing.length > 0 ? (
        <p className="fz-muted" style={{ fontSize: '0.8125rem' }}>
          Estimado com {cost.priced} de {cost.count} itens. Falta o valor de {joinPt(cost.missing.map((item) => item.label.toLowerCase()))}.
        </p>
      ) : null}
      {previousPerDay !== null ? (
        <p className={`fz-note ${perDay <= previousPerDay ? 'fz-note--ok' : 'fz-note--warn'}`}>
          {perDay <= previousPerDay
            ? `${formatMoney(previousPerDay - perDay)} a menos por dia que a fornalha anterior.`
            : `${formatMoney(perDay - previousPerDay)} a mais por dia que a fornalha anterior.`}
        </p>
      ) : null}
    </section>
  );
}

// ---- fornalha no fogo ----

function CookingCard({ fornalha, onContinue, onChange }: { fornalha: Fornalha; onContinue: () => void; onChange: () => void }) {
  const navigate = useNavigate();
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  function backToList() {
    updateFornalha(fornalha.id, { stage: 'shopping', cookStartedAt: undefined, cookSeconds: undefined, cookStep: undefined, cookDate: undefined });
    navigate('/papa/compras');
  }

  function abandon() {
    discardFornalha(fornalha.id);
    setConfirmAbandon(false);
    onChange();
  }

  return (
    <section className="fz-card fz-card--soft fz-stack">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src={zillaChef} alt="" style={{ width: 80, height: 80, objectFit: 'contain', flex: 'none' }} />
        <div className="fz-stack" style={{ gap: '0.25rem' }}>
          <h3 className="fz-h2">Fornalha no fogo</h3>
          <p className="fz-muted">{fornalha.title} · {joinPt(fornalha.pets.map((p) => p.name))}</p>
        </div>
      </div>
      <button type="button" className="pz-button pz-button--primary wide" onClick={onContinue}>Continuar cozinhando <span aria-hidden="true">→</span></button>
      <div className="fz-btn-row">
        <button type="button" className="fz-link" onClick={backToList}>Voltar para a lista</button>
        <button type="button" className="fz-link fz-link--muted" onClick={() => setConfirmAbandon(true)}>Abandonar fornalha</button>
      </div>

      {confirmAbandon ? (
        <Sheet labelledBy="fz-abandonar" onClose={() => setConfirmAbandon(false)}>
          <h2 id="fz-abandonar" className="fz-h2">Abandonar esta fornalha?</h2>
          <p className="fz-muted">O preparo, a lista e os valores anotados somem. A receita continua em Salvas, e você pode começar outra fornalha na hora.</p>
          <button type="button" className="pz-button pz-button--primary wide" onClick={abandon}>Abandonar</button>
          <button type="button" className="fz-link fz-link--muted" onClick={() => setConfirmAbandon(false)}>Continuar com ela</button>
        </Sheet>
      ) : null}
    </section>
  );
}

// ---- 6 e 6b: visão geral com estoque em casa ----
// Duas áreas: a fornalha que está sendo servida e a próxima.

function Overview({ stock, next, onChange }: { stock: Fornalha; next?: Fornalha; onChange: () => void }) {
  const navigate = useNavigate();
  const status = stockStatus(stock);
  const [checking, setChecking] = useState(false);
  const [pots, setPots] = useState(status.potsLeft);
  const cost = costOf(stock);
  const late = status.late > 0;
  const low = status.daysLeft <= 2;
  const reminder = addDays(status.endDate, -REMINDER_LEAD_DAYS);
  const reminderPassed = diffDays(todayIso(), reminder) <= 0;
  const realDays = stock.finalGrams ? Math.max(1, daysFromGrams(stock.finalGrams, stock.cookedGramsPerDay)) : stock.days;
  const names = joinPt(stock.pets.map((p) => p.name));
  const dayNumber = status.totalDays - status.daysLeft + 1;

  function save(value: number) {
    confirmPots(stock, value);
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
          Com {pots} {pots === 1 ? 'potinho' : 'potinhos'}, dá até {formatDay(addDays(todayIso(), Math.max(1, Math.ceil(pots / Math.max(1, totalPotsPerDay(stock)))) - 1))}.
        </p>
      ) : null}
    </>
  );

  let nextHint: string | null = null;
  if (!next) {
    nextHint = late || reminderPassed
      ? 'Já é hora: planeje agora para não faltar comida.'
      : `Planeje até ${formatDay(reminder)} para ter tempo de comprar e cozinhar.`;
  }

  return (
    <>
      <section className="fz-section" aria-labelledby="fz-atual">
        <h2 id="fz-atual" className="fz-section__title">Fornalha atual</h2>

        {late ? (
          <div className="fz-card fz-stack">
            <span className="fz-badge">Previsão era {formatDay(status.endDate)}</span>
            <h3 className="fz-h2">Passou {status.late} {status.late === 1 ? 'dia' : 'dias'}. Ainda tem potinho?</h3>
            <p className="fz-muted">Conta pra gente e o Papazilla ajusta a data.</p>
            {stepper}
            <div className="fz-btn-row">
              <button type="button" className="pz-button pz-button--outline" onClick={() => save(0)}>Acabou tudo</button>
              <button type="button" className="pz-button pz-button--primary" onClick={() => save(pots)}>Confirmar</button>
            </div>
          </div>
        ) : (
          <div className={`fz-card fz-current${low ? ' is-low' : ''}`}>
            <p className="fz-kicker">{names}</p>
            <div className="fz-current__hero">
              <strong className="fz-current__num">{status.daysLeft}</strong>
              <span>
                <b>{status.daysLeft === 1 ? 'dia de comida' : 'dias de comida'}</b>
                <small>{status.daysLeft === 1 ? 'Hoje é o último dia' : `Dia ${dayNumber} de ${status.totalDays}`}</small>
              </span>
            </div>
            <DaysBar total={status.totalDays} left={status.daysLeft} />
            <div className="fz-days__legend">
              <span>Feita {stock.cookDate ? formatDay(stock.cookDate) : 'hoje'}</span>
              <span>Acaba {formatDay(status.endDate)}</span>
            </div>
            <div className="fz-lines">
              <div className="fz-line">
                <span><strong>{status.potsLeft} {status.potsLeft === 1 ? 'potinho' : 'potinhos'}</strong><small>na geladeira e no freezer</small></span>
                <button type="button" className="pz-button pz-button--outline" style={{ minHeight: 44, padding: '0 0.9rem', fontSize: '0.875rem' }} onClick={() => { setPots(status.potsLeft); setChecking(true); }}>Conferir</button>
              </div>
              {cost.priced > 0 ? (
                <div className="fz-line">
                  <span><strong>{formatMoney(cost.total)}</strong><small>custo da fornalha{stock.finalGrams ? ` · ${formatKg(stock.finalGrams)} prontos` : ''}</small></span>
                  <span className="fz-line__value">{formatMoney(cost.total / realDays)}<small>por dia</small></span>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="fz-section" aria-labelledby="fz-proxima">
        <div className="fz-stack" style={{ gap: '0.2rem' }}>
          <h2 id="fz-proxima" className="fz-section__title">Próxima fornalha</h2>
          {nextHint ? <p className="fz-muted">{nextHint}</p> : null}
        </div>
        {next?.stage === 'cooking' ? (
          <CookingCard fornalha={next} onContinue={() => navigate('/papa/cozinha')} onChange={onChange} />
        ) : next ? (
          <NextInProgress fornalha={next} />
        ) : (
          <NextOptions stock={stock} />
        )}
      </section>

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

/** Um segmento por dia: os que já passaram ficam apagados. */
function DaysBar({ total, left }: { total: number; left: number }) {
  const label = `${left} de ${total} dias restantes`;
  if (total > 31) {
    return (
      <span className="fz-bar" role="img" aria-label={label} style={{ height: 10 }}>
        <span style={{ width: `${Math.round((left / total) * 100)}%` }} />
      </span>
    );
  }
  return (
    <div className="fz-days" role="img" aria-label={label} style={{ '--fz-days': total } as CSSProperties}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index >= total - left ? 'is-left' : undefined} />
      ))}
    </div>
  );
}

function NextInProgress({ fornalha }: { fornalha: Fornalha }) {
  const navigate = useNavigate();
  const items = fornalha.items.filter((item) => !item.pantry);
  const done = items.filter((item) => item.checked).length;
  const allDone = items.length > 0 && done === items.length;
  const cost = costOf(fornalha);
  return (
    <div className="fz-card fz-stack" style={{ gap: '0.85rem' }}>
      <div className="fz-stack" style={{ gap: '0.25rem' }}>
        <p className="fz-kicker">{joinPt(fornalha.pets.map((p) => p.name))} · {fornalha.days} dias</p>
        <h3 className="fz-h2">{fornalha.title}</h3>
      </div>
      <div className="fz-progress">
        <div className="fz-progress__text">
          <span>{allDone ? 'Tudo comprado' : `${done} de ${items.length} itens comprados`}</span>
          {cost.priced > 0 ? <span>{formatMoney(cost.total)} até agora</span> : null}
        </div>
        <span className="fz-bar" role="progressbar" aria-label="Itens comprados" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} style={{ height: 8 }}>
          <span style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
        </span>
      </div>
      {allDone ? (
        <>
          <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/papa/cozinha')}>Preparar a fornalha <span aria-hidden="true">→</span></button>
          <button type="button" className="fz-link" onClick={() => navigate('/papa/compras')}>Ver lista e custo</button>
        </>
      ) : (
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/papa/compras')}>Continuar a lista de compras <span aria-hidden="true">→</span></button>
      )}
    </div>
  );
}

function NextOptions({ stock }: { stock: Fornalha }) {
  const navigate = useNavigate();
  const petIds = stock.pets.map((p) => p.id);
  const last = getRecipe(stock.recipeId) ?? listRecipes()[0];
  const hasSubscription = hasActiveAccess(getSubscription());

  function gate(path: string, returnTo: string, state?: unknown) {
    setPapaSelectedPets(petIds);
    if (hasSubscription) navigate(path, state ? { state } : undefined);
    else navigate(`/assinatura?returnTo=${encodeURIComponent(returnTo)}`);
  }

  function repeat() {
    if (!last) return;
    draftFromRecipe(last, petIds);
    gate('/receita', 'recipe', { editing: true });
  }

  return (
    <div className="fz-stack" style={{ gap: '0.6rem' }}>
      {last ? (
        <button type="button" className="fz-option is-primary" onClick={repeat}>
          <span className="fz-option__icon"><RepeatIcon /></span>
          <span className="fz-option__body">
            <strong>Repetir a receita</strong>
            <small>{displayRecipeTitle(last)}. Dá para ajustar antes de comprar.</small>
          </span>
          <span className="fz-option__arrow" aria-hidden="true">→</span>
        </button>
      ) : null}
      <button type="button" className="fz-option" onClick={() => gate('/receita', 'recipe', { petIds })}>
        <span className="fz-option__icon"><PlusIcon /></span>
        <span className="fz-option__body">
          <strong>Criar receita nova</strong>
          <small>Você escolhe os ingredientes e o Papazilla calcula as porções.</small>
        </span>
        <span className="fz-option__arrow" aria-hidden="true">→</span>
      </button>
      <button type="button" className="fz-link" onClick={() => { setPapaSelectedPets(petIds); navigate('/papa/planejar'); }}>Ver Papazilla Originals e outras opções</button>
    </div>
  );
}
