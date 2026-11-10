import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DailyPlan, Recipe } from '@papazilla/nutrition-engine';
import zillaIcon from '../assets/icons/zilla.png';
import zillaChef from '../assets/zilla-chef.webp';
import type { StoredPet } from '../lib/petsStore.js';
import type { SavedRecipe } from '../lib/recipeRepository.js';
import { getRecipe } from '../lib/recipeRepository.js';
import { draftFromRecipe } from '../lib/fornalhaFlow.js';
import {
  buildItems, formatDay, formatKg, getInProgress, startFornalha, stockStatus,
  type Fornalha,
} from '../lib/fornalhaStore.js';
import '../fornalha.css';

// ---- ícones (traço, herdam a cor) ----

export function PencilIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function JarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="7" width="14" height="14" rx="3" />
      <path d="M7 3h10v4H7z" />
    </svg>
  );
}

export function RepeatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l3 3-3 3" />
      <path d="M4 11V9a4 4 0 0 1 4-4h12" />
      <path d="M7 22l-3-3 3-3" />
      <path d="M20 13v2a4 4 0 0 1-4 4H4" />
    </svg>
  );
}

export function PlusIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// ---- folha inferior ----

export function Sheet({ labelledBy, onClose, children }: { labelledBy: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fz-sheet-backdrop" onClick={onClose}>
      <section className="fz-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={(event) => event.stopPropagation()}>
        <span className="fz-sheet__handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}

// ---- faixa de estoque ----

export function StockStrip({ stock, onClick }: { stock: Fornalha; onClick?: () => void }) {
  const status = stockStatus(stock);
  const low = status.daysLeft <= 3;
  const text = status.late > 0
    ? `Passou ${status.late} ${status.late === 1 ? 'dia' : 'dias'} da previsão`
    : `Comida até ${formatDay(status.endDate)} · ${status.daysLeft === 1 ? 'último dia' : `faltam ${status.daysLeft} dias`}`;
  return (
    <button type="button" className={`fz-strip${low ? ' is-low' : ''}`} onClick={onClick} aria-label={`Estoque atual: ${text}`}>
      <span className="fz-strip__icon"><JarIcon size={18} /></span>
      <span className="fz-strip__body">
        <span className="fz-strip__text"><span>{text}</span></span>
        <span className="fz-bar"><span style={{ width: `${status.percent}%` }} /></span>
      </span>
    </button>
  );
}

// ---- retrato do pet (Pet Portrait Card) ----

export function PetPortrait({
  pet, meta, selectable, selected, single, onToggle,
}: {
  pet: Pick<StoredPet, 'id' | 'name' | 'photoPath'>;
  meta?: string;
  selectable?: boolean;
  selected?: boolean;
  single?: boolean;
  onToggle?: () => void;
}) {
  const content = (
    <>
      {pet.photoPath
        ? <img className="fz-portrait__photo" src={pet.photoPath} alt="" />
        : <img className="fz-portrait__fallback" src={zillaIcon} alt="" />}
      <span className="fz-portrait__shade" aria-hidden="true" />
      {selectable ? <span className="fz-portrait__check" aria-hidden="true">{selected ? <CheckIcon /> : null}</span> : null}
      <span className="fz-portrait__content">
        <strong>{pet.name}</strong>
        {meta ? <b>{meta}</b> : null}
      </span>
    </>
  );
  if (!selectable) {
    return <div className={`fz-portrait${single ? ' fz-portrait--single' : ''}`}>{content}</div>;
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={Boolean(selected)}
      aria-label={`Cozinhar para ${pet.name}`}
      className={`fz-portrait${selected ? ' is-selected' : ''}`}
      onClick={onToggle}
    >
      {content}
    </button>
  );
}

// ---- alterar receita ----

/**
 * "Alterar a receita?" — ajustar as respostas (wizard já preenchido) ou
 * escolher outra receita (volta para Planejar).
 */
export function AlterarReceitaSheet({ recipeId, petIds, onClose }: { recipeId: string; petIds?: string[]; onClose: () => void }) {
  const navigate = useNavigate();
  const recipe = getRecipe(recipeId);

  function adjust() {
    if (!recipe) {
      navigate('/papa/planejar');
      return;
    }
    draftFromRecipe(recipe, petIds);
    navigate('/receita', { state: { editing: true } });
  }

  return (
    <Sheet labelledBy="fz-alterar" onClose={onClose}>
      <div className="fz-stack" style={{ gap: '0.4rem' }}>
        <h2 id="fz-alterar" className="fz-h2">Alterar a receita?</h2>
        <p className="fz-muted">O que você já marcou na lista e os valores anotados continuam para os ingredientes que ficarem.</p>
      </div>
      <button type="button" className="fz-option is-primary" onClick={adjust}>
        <PencilIcon size={20} />
        <span><strong>Ajustar as respostas</strong><small>Volta ao wizard com tudo marcado: cães, proporção, ingredientes, suplemento e dias.</small></span>
      </button>
      <button type="button" className="fz-option" onClick={() => navigate('/papa/planejar')}>
        <span aria-hidden="true">⇄</span>
        <span><strong>Escolher outra receita</strong><small>Volta para Planejar: receita nova ou uma Original.</small></span>
      </button>
      <button type="button" className="fz-link fz-link--muted" onClick={onClose}>Manter como está</button>
    </Sheet>
  );
}

// ---- receita pronta: as três saídas ----

/**
 * Rodapé de toda receita pronta: lista de compras (principal), salvar e
 * começar a cozinhar. Lista e cozinhar salvam a receita e abrem a fornalha.
 */
export function RecipeNextActions({
  ensureSaved, recipe, petPlans, title, onSaveOnly, busy,
}: {
  ensureSaved: () => Promise<SavedRecipe | null>;
  recipe: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  title: string;
  onSaveOnly: () => void;
  busy?: boolean;
}) {
  const navigate = useNavigate();
  const [askHaveAll, setAskHaveAll] = useState<SavedRecipe | null>(null);
  const [working, setWorking] = useState(false);
  const disabled = busy || working;

  async function open(target: 'list' | 'cook') {
    if (disabled) return;
    setWorking(true);
    try {
      const saved = await ensureSaved();
      if (!saved) return;
      if (target === 'list') {
        startFornalha({ recipeId: saved.id, title, recipe, petPlans });
        navigate('/papa/compras', { state: { toast: 'Receita salva. Sua fornalha começou: agora é a lista.' } });
      } else {
        setAskHaveAll(saved);
      }
    } finally {
      setWorking(false);
    }
  }

  function haveAll(answer: boolean) {
    if (!askHaveAll) return;
    startFornalha({ recipeId: askHaveAll.id, title, recipe, petPlans, allChecked: answer });
    navigate(answer ? '/papa/cozinha' : '/papa/compras', answer ? undefined : { state: { toast: 'Sua fornalha começou: agora é a lista.' } });
  }

  const items = buildItems(recipe).filter((item) => !item.pantry);

  return (
    <>
      <footer className="fz-next-footer">
        <button type="button" className="pz-button pz-button--primary" disabled={disabled} onClick={() => { void open('list'); }}>
          Ir para a lista de compras <span aria-hidden="true">→</span>
        </button>
        <div className="fz-btn-row">
          <button type="button" className="pz-button pz-button--outline" disabled={disabled} onClick={onSaveOnly}>Salvar receita</button>
          <button type="button" className="pz-button pz-button--outline" disabled={disabled} onClick={() => { void open('cook'); }}>Começar a cozinhar</button>
        </div>
      </footer>
      {askHaveAll ? (
        <Sheet labelledBy="fz-tudo" onClose={() => setAskHaveAll(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={zillaChef} alt="" style={{ width: 72, height: 72, objectFit: 'contain', flex: 'none' }} />
            <div className="fz-stack" style={{ gap: '0.25rem' }}>
              <h2 id="fz-tudo" className="fz-h2">Já tem tudo em casa?</h2>
              <p className="fz-muted">Receita salva. Antes de acender o fogão, confere os ingredientes.</p>
            </div>
          </div>
          <ul className="fz-list">
            {items.map((item) => (
              <li key={item.id}><span>{item.label}</span><strong>{item.rawGrams !== undefined ? formatKg(item.rawGrams) : ''}</strong></li>
            ))}
            <li style={{ color: 'var(--pz-ink-muted)' }}><span>Suplemento e óleos</span><strong>da sua despensa</strong></li>
          </ul>
          <button type="button" className="pz-button pz-button--primary wide" onClick={() => haveAll(true)}>Tenho tudo, vamos cozinhar →</button>
          <button type="button" className="pz-button pz-button--outline wide" onClick={() => haveAll(false)}>Ainda falta comprar</button>
          <p className="fz-muted" style={{ textAlign: 'center', fontSize: '0.8125rem' }}>Quer saber quanto custou? Dá para anotar os valores depois, na lista.</p>
        </Sheet>
      ) : null}
    </>
  );
}

/** Banner do wizard em modo de edição. */
export function EditingBanner() {
  return (
    <p className="fz-edit-banner"><PencilIcon size={18} /> Suas respostas já estão marcadas. Mude só o que quiser e siga até a receita.</p>
  );
}

export function hasFornalhaInProgress(): boolean {
  return Boolean(getInProgress());
}
