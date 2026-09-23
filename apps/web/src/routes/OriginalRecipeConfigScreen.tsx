import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import receitaIcon from '../assets/icons/receita.png';
import calculatorIcon from '../assets/icons/calculator.webp';
import infoIcon from '../assets/icons/info.png';
import { RecipePetSelector } from '../components/RecipePetSelector.js';
import { getActivePet, listPets } from '../lib/petsStore.js';
import { findOriginalRecipe } from '../lib/originalRecipes.js';
import { buildPetPlan } from '../lib/recipeEngine.js';
import { formatGrams, mealsCount } from '../lib/recipeDisplay.js';
import { getSubscription, hasActiveAccess } from '../lib/subscription.js';
import { useScrollAwareFooter } from '../hooks/useScrollAwareFooter.js';

const PLAN_CHOICES = {
  formulation: 'padrao',
  supplement: 'food-dog',
  predominantProtein: 'chicken-pork',
} as const;

const MEAL_DAY_OPTIONS = [1, 3, 7];
const TREAT_DAY_OPTIONS = [7, 15, 30];

export function OriginalRecipeConfigScreen() {
  const { slug } = useParams();
  const original = findOriginalRecipe(slug);
  const navigate = useNavigate();
  const pets = listPets();
  const activePet = getActivePet();
  const isTreat = original?.kind === 'treat';
  const options = isTreat ? TREAT_DAY_OPTIONS : MEAL_DAY_OPTIONS;
  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(
    () => new Set(activePet ? [activePet.id] : pets[0] ? [pets[0].id] : []),
  );
  const [days, setDays] = useState(isTreat ? 15 : 7);
  const [customDays, setCustomDays] = useState('');
  const [mealOverrides, setMealOverrides] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const { bodyRef, dividerVisible, onBodyScroll } = useScrollAwareFooter();

  const plans = useMemo(
    () => pets.map((pet) => ({ pet, plan: buildPetPlan(pet, PLAN_CHOICES) })),
    [pets.map((pet) => `${pet.id}:${pet.updatedAt}`).join('|')],
  );

  if (!original) return <Navigate to="/papa" replace />;
  if (pets.length === 0) return <Navigate to="/zilla" replace />;
  if (!hasActiveAccess(getSubscription())) return <Navigate to="/assinatura" state={{ returnTo: 'papa' }} replace />;

  const selectedPlans = plans.filter(({ pet }) => selectedPetIds.has(pet.id));
  const petEntries = plans.map(({ pet, plan }) => ({
    pet,
    detail: `${pet.weight ? `${pet.weight} kg · ` : ''}${pet.goal || (pet.lifeStage === 'Filhote' ? 'Filhote' : 'Adulto')}`,
    amount: isTreat
      ? `até ${formatGrams(plan.treatsGramsPerDay.max)} por dia`
      : `${formatGrams(plan.totalGramsPerDay)} por dia · ${mealOverrides[pet.id] ?? mealsCount(plan, pet)} refeições`,
  }));

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 2800);
  }

  function togglePet(id: string) {
    setSelectedPetIds((current) => {
      if (current.has(id) && current.size === 1) {
        toast('Escolha pelo menos um Monstrinho para continuar.');
        return current;
      }
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function chooseDays(value: number) {
    setDays(value);
    setCustomDays('');
  }

  function changeCustomDays(raw: string) {
    setCustomDays(raw);
    setDays(Math.max(1, Math.min(30, Number(raw) || 1)));
  }

  function cycleMeals(petId: string, current: number) {
    setMealOverrides((values) => ({ ...values, [petId]: current >= 4 ? 1 : current + 1 }));
  }

  return (
    <div className="flow-screen original-config-flow">
      <header className="flow-header recipe-config-header">
        <button type="button" className="flow-header__back" aria-label="Voltar" onClick={() => navigate('/papa')}>←</button>
        <div>
          <span className="flow-header__eyebrow">Papazilla Originals</span>
          <strong>Configurar receita</strong>
        </div>
        <span className="flow-header__avatar"><img src={receitaIcon} alt="" /></span>
      </header>

      <div className="flow-progress"><span style={{ width: '50%' }} /></div>

      <div className="flow-body" ref={bodyRef} onScroll={onBodyScroll}>
        <article className="original-config-hero">
          <img src={original.image} alt="" />
          <div>
            <span>PAPAZILLA ORIGINAL</span>
            <h1>{original.title}</h1>
            <p>{original.subtitle}</p>
          </div>
        </article>

        <section className="recipe-config-section">
          <div className="recipe-config-section__title">
            <span>1</span>
            <div>
              <h2>{isTreat ? 'Para quem são os petiscos?' : 'Para quem vamos cozinhar?'}</h2>
              <p>{isTreat ? 'O limite diário é calculado para cada Monstrinho.' : 'A base pode ser preparada junta. As porções continuam individuais.'}</p>
            </div>
          </div>
          <RecipePetSelector entries={petEntries} selectedIds={selectedPetIds} onToggle={togglePet} amountLabel={isTreat ? 'Limite calculado por perfil' : undefined} />
        </section>

        <section className="recipe-config-section">
          <div className="recipe-config-section__title">
            <span>2</span>
            <div>
              <h2>{isTreat ? 'Para quantos dias?' : 'Quantos dias de comida?'}</h2>
              <p>{isTreat ? 'Escolha o tamanho do lote que quer preparar.' : 'Vamos multiplicar a receita na medida da sua fornalha.'}</p>
            </div>
          </div>
          <div className="recipe-config-days">
            {options.map((option) => (
              <button type="button" className={!customDays && days === option ? 'is-selected' : ''} onClick={() => chooseDays(option)} key={option}>
                <strong>{option}</strong><span>{option === 1 ? 'dia' : 'dias'}</span>
              </button>
            ))}
          </div>
          <label className={`recipe-config-custom-days${customDays ? ' is-selected' : ''}`}>
            <span><strong>Outro período</strong><small>De 1 a 30 dias</small></span>
            <span><input type="number" min={1} max={30} inputMode="numeric" placeholder="Ex.: 10" value={customDays} onChange={(event) => changeCustomDays(event.target.value)} /><b>dias</b></span>
          </label>
        </section>

        <section className="recipe-config-section">
          <div className="recipe-config-section__title">
            <span>3</span>
            <div>
              <h2>{isTreat ? 'Limite recomendado' : 'Refeições por dia'}</h2>
              <p>{isTreat ? 'Petisco complementa a rotina e não substitui uma refeição.' : 'Usamos o perfil de cada pet e separamos tudo na receita pronta.'}</p>
            </div>
          </div>
          <div className={`recipe-config-profile-list${isTreat ? ' is-treat' : ''}`}>
            {selectedPlans.map(({ pet, plan }) => {
              const count = mealOverrides[pet.id] ?? mealsCount(plan, pet);
              return (
                <div key={pet.id}>
                  <img src={pet.photoPath || receitaIcon} alt={pet.photoPath ? `Foto de ${pet.name}` : ''} />
                  <span><strong>{pet.name}</strong><small>{isTreat ? `até ${formatGrams(plan.treatsGramsPerDay.max)} por dia` : `${count} ${count === 1 ? 'refeição' : 'refeições'} por dia`}</small></span>
                  {!isTreat ? <button type="button" onClick={() => cycleMeals(pet.id, count)}>Alterar</button> : null}
                </div>
              );
            })}
          </div>
        </section>

        <div className={`recipe-config-note ${isTreat ? 'is-green' : 'is-blue'}`}>
          <img src={isTreat ? infoIcon : calculatorIcon} alt="" />
          <p>
            <strong>{isTreat ? '“Por dia” é um limite' : 'Cada focinho, uma medida'}</strong>
            {isTreat
              ? 'Na receita pronta, você verá o rendimento, o tamanho de cada unidade e quanto oferecer a cada pet.'
              : selectedPlans.length === 1
                ? `O cálculo usa o perfil de ${selectedPlans[0]!.pet.name} e separa as porções na receita pronta.`
                : 'A receita pronta separa a quantidade diária e cada refeição de todos os Monstrinhos escolhidos.'}
          </p>
        </div>
      </div>

      <footer className={`flow-footer scroll-aware-footer${dividerVisible ? ' is-divider-visible' : ''}`}>
        <button type="button" className="pz-button pz-button--outline" onClick={() => navigate('/papa')}>Voltar</button>
        <button type="button" className="pz-button pz-button--primary" onClick={() => navigate(`/papa/original/${original.slug}/resultado`, { state: { selectedPetIds: [...selectedPetIds], days, mealOverrides } })}>{isTreat ? 'Calcular petiscos →' : 'Calcular receita →'}</button>
      </footer>

      {toastMessage ? <div className="pz-toast is-visible" role="status">{toastMessage}</div> : null}
    </div>
  );
}
