import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import receitaIcon from '../assets/icons/receita.png';
import calendarioIcon from '../assets/icons/calendario.png';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import zillaIcon from '../assets/icons/zilla.png';
import { findOriginalRecipe } from '../lib/originalRecipes.js';
import { getActivePet, listPets } from '../lib/petsStore.js';
import { buildPetPlan, buildSharedRecipe } from '../lib/recipeEngine.js';
import { formatGrams, mealsCount } from '../lib/recipeDisplay.js';
import { getSubscription, hasActiveAccess } from '../lib/subscription.js';
import { joinPt } from '../lib/petLabel.js';
import { parseResultParams } from '../lib/originalRecipeParams.js';
import { RecipeIngredientTable } from '../components/RecipeIngredientTable.js';
import { RecipeFinalizers } from '../components/RecipeFinalizers.js';
import { RecipePreparationSteps } from '../components/RecipePreparationSteps.js';
import { useScrollAwareFooter } from '../hooks/useScrollAwareFooter.js';

export function OriginalRecipeResultScreen() {
  const { slug } = useParams();
  const original = findOriginalRecipe(slug);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pets = listPets();
  const activePet = getActivePet();
  const { selectedPetIds, days: daysParam, mealOverrides } = parseResultParams(searchParams);
  const selectedIds = new Set(selectedPetIds.length ? selectedPetIds : activePet ? [activePet.id] : pets[0] ? [pets[0].id] : []);
  const selectedPets = pets.filter((pet) => selectedIds.has(pet.id));
  const days = Math.max(1, Math.min(30, daysParam ?? (original?.kind === 'treat' ? 15 : 7)));
  const planChoices = {
    formulation: original?.formula?.formulation ?? 'padrao',
    supplement: 'food-dog',
    predominantProtein: 'chicken-pork',
  } as const;
  const plans = selectedPets.map((pet) => ({ pet, plan: buildPetPlan(pet, planChoices) }));
  const recipe =
    original?.formula && plans.length > 0
      ? buildSharedRecipe(plans.map(({ plan }) => plan), { ...original.formula.selection, herbs: [] }, days)
      : null;
  const { bodyRef, dividerVisible, onBodyScroll } = useScrollAwareFooter();

  if (!original) return <Navigate to="/papa" replace />;
  if (pets.length === 0 || selectedPets.length === 0) return <Navigate to="/zilla" replace />;
  if (!hasActiveAccess(getSubscription())) return <Navigate to="/assinatura" state={{ returnTo: 'papa' }} replace />;

  const isTreat = original.kind === 'treat';
  const isPack = selectedPets.length > 1;
  const petNames = joinPt(selectedPets.map((pet) => pet.name));
  const totalMealGrams = plans.reduce((sum, { plan }) => sum + plan.totalGramsPerDay, 0) * days;
  const totalTreatLimit = plans.reduce((sum, { plan }) => sum + plan.treatsGramsPerDay.max, 0) * days;
  const singlePlan = plans[0]!;
  const singleMealCount = mealOverrides[singlePlan.pet.id] ?? mealsCount(singlePlan.plan, singlePlan.pet);
  const totalValue = formatGrams(isTreat ? totalTreatLimit : totalMealGrams);
  const title = isTreat
    ? isPack ? 'Os petiscos da matilha estão prontos!' : `Os petiscos de ${selectedPets[0]!.name} estão prontos!`
    : isPack ? `O ${original.title} da matilha está pronto!` : `O ${original.title} de ${selectedPets[0]!.name} está pronto!`;
  const intro = isTreat
    ? isPack ? `Um lote para ${days} dias · limites individuais para ${petNames}.` : `Lote para ${days} dias · limite diário calculado para ${petNames}.`
    : isPack ? `Uma base para ${days} dias · porções separadas para ${petNames}.` : `Receita para ${days} dias · porções calculadas para o perfil de ${petNames}.`;

  return (
    <div className="flow-screen original-result-flow">
      <header className="flow-header recipe-config-header">
        <button type="button" className="flow-header__back" aria-label="Voltar" onClick={() => navigate(`/papa/original/${original.slug}`)}>←</button>
        <div><span className="flow-header__eyebrow">Papazilla Originals</span><strong>Receita pronta</strong></div>
        <span className="flow-header__avatar"><img src={receitaIcon} alt="" /></span>
      </header>
      <div className="flow-progress"><span style={{ width: '100%' }} /></div>

      <div className="flow-body" ref={bodyRef} onScroll={onBodyScroll}>
        <div className="flow-intro original-result-intro">
          <p className="eyebrow">Porção na medida</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>

        <article className="recipe-result-card original-result-card">
          <div className="recipe-result-card__total original-result-total">
            <div className="recipe-result-card__total-text">
              <small className="recipe-result-card__pet">Para {petNames}</small>
              <span className="recipe-result-card__label">{isTreat ? 'Teto do período' : 'Total da receita'}</span>
              <strong>{totalValue}</strong>
              <small className="recipe-result-card__ready">{isTreat ? 'limite total' : 'prontos'}</small>
              <p className="recipe-result-card__tagline">{isTreat ? 'Carinho na medida certa!' : 'Comida boa faz histórias felizes!'} <span aria-hidden="true">♥</span></p>
            </div>
            <img className="original-result-food" src={original.image} alt={`${original.title} pronto`} />
          </div>

          <div className="recipe-share-image">
            <button type="button" className="pz-button pz-button--outline wide" disabled>Compartilhar após validação</button>
            <small>A imagem para stories será liberada junto com a fórmula final.</small>
          </div>

          <div className="recipe-preset-result original-result-summary">
            <span className="original-result-summary__photo"><img src={original.image} alt="" /></span>
            <div><small>Original escolhida</small><strong>{original.title}</strong><span>{original.subtitle}</span></div>
          </div>

          {isPack ? (
            <section className="original-result-pack">
              <div><small>Uma receita para</small><strong>{petNames}</strong></div>
              {plans.map(({ pet, plan }) => {
                const mealCount = mealOverrides[pet.id] ?? mealsCount(plan, pet);
                return (
                  <span key={pet.id}>
                    <img src={pet.photoPath || zillaIcon} alt={pet.photoPath ? `Foto de ${pet.name}` : ''} />
                    <span><b>{pet.name}</b><small>{isTreat ? `até ${formatGrams(plan.treatsGramsPerDay.max)}/dia` : `${formatGrams(plan.totalGramsPerDay)}/dia · ${formatGrams(Math.round(plan.totalGramsPerDay / mealCount))}/ref.`}</small></span>
                  </span>
                );
              })}
            </section>
          ) : null}

          {recipe ? (
            <RecipeIngredientTable groups={recipe.groups} format="Os dois" />
          ) : (
            <section className="original-formula-pending">
              <img src={infoIcon} alt="" />
              <div>
                <small>Fórmula em validação</small>
                <h2>{isTreat ? 'Ingredientes e rendimento' : 'Ingredientes e quantidades'}</h2>
                <p>Esta estrutura visual já está pronta. Os dados completos serão liberados quando a fórmula desta Original passar pela revisão nutricional.</p>
              </div>
            </section>
          )}

          {!isPack ? (
            <section className="portion-stats original-result-stats">
              <div className="portion-stats__card"><span className="portion-stats__icon"><img src={isTreat ? potinhoIcon : calendarioIcon} alt="" /></span><small>{isTreat ? 'Limite por dia' : 'Por dia'}</small><strong>{formatGrams(isTreat ? singlePlan.plan.treatsGramsPerDay.max : singlePlan.plan.totalGramsPerDay)}</strong></div>
              <div className="portion-stats__card"><span className="portion-stats__icon"><img src={potinhoIcon} alt="" /></span><small>{isTreat ? `Em ${days} dias` : 'Por refeição'}</small><strong>{formatGrams(isTreat ? singlePlan.plan.treatsGramsPerDay.max * days : Math.round(singlePlan.plan.totalGramsPerDay / singleMealCount))}</strong></div>
            </section>
          ) : null}

          {recipe ? (
            <>
              <RecipeFinalizers petPlans={plans} />
              <RecipePreparationSteps petPlans={plans} days={days} />
            </>
          ) : (
            <>
              <details className="recipe-preparation">
                <summary><span><img src={potinhoIcon} alt="" /><b>{isTreat ? 'Tamanho e conservação' : 'Suplementos e finalização'}</b></span><b aria-hidden="true">⌄</b></summary>
                <div className="recipe-preparation__body"><p className="recipe-preparation__intro">Disponível depois da validação da fórmula.</p></div>
              </details>
              <details className="recipe-preparation">
                <summary><span><img src={receitaIcon} alt="" /><b>Modo de preparo</b></span><b aria-hidden="true">⌄</b></summary>
                <div className="recipe-preparation__body"><p className="recipe-preparation__intro">Disponível depois da validação da fórmula.</p></div>
              </details>
            </>
          )}
          <details className="recipe-preparation">
            <summary><span><img src={infoIcon} alt="" /><b>{isTreat ? 'Limites e cuidados' : 'Mais sobre esta receita'}</b></span><b aria-hidden="true">⌄</b></summary>
            <div className="recipe-preparation__body"><p className="recipe-preparation__intro">Disponível depois da validação da fórmula.</p></div>
          </details>
        </article>
      </div>

      <footer className={`flow-footer scroll-aware-footer${dividerVisible ? ' is-divider-visible' : ''}`}>
        <button type="button" className="pz-button pz-button--outline" onClick={() => navigate(`/papa/original/${original.slug}`)}>Voltar</button>
        <button type="button" className="pz-button pz-button--primary" disabled>Salvar receita</button>
      </footer>
    </div>
  );
}
