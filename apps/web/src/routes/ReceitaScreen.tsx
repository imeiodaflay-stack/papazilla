import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { FormulationId, SupplementId } from '@papazilla/nutrition-engine';
import { CARBS, FORMULATIONS, ORGANS, PROTEINS, VEGETABLES, findItem } from '@papazilla/nutrition-engine';
import zillaIcon from '../assets/icons/zilla.png';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import { getActivePet, getActivePetId, listPets } from '../lib/petsStore.js';
import { describePet, joinPt } from '../lib/petLabel.js';
import { getSubscription } from '../lib/subscription.js';
import { derivePredominantProtein } from '../lib/engineMapping.js';
import { hasSignificantMuscleLoss } from '../lib/muscleCondition.js';
import { buildPetPlan, buildSharedRecipe } from '../lib/recipeEngine.js';
import { addRecipe } from '../lib/recipesStore.js';
import { clearRecipeDraft, peekRecipeDraft, saveRecipeDraft } from '../lib/recipeDraft.js';
import {
  FORMULATION_LABELS,
  FORMULATION_ORDER,
  SUPPLEMENT_LABELS,
  SUPPLEMENT_ORDER,
  formatGrams,
  formulationSummary,
  mealsCount,
  supplementReference,
} from '../lib/recipeDisplay.js';
import { IngredientPicker } from '../components/IngredientPicker.js';
import { RecipeResultCard } from '../components/RecipeResultCard.js';

/**
 * Wizard da receita — fiel à tela "recipe" de `papazilla-prototype` (9 etapas:
 * matilha → proporção → proteína → carboidrato → vegetal → víscera (opcional)
 * → suplemento → dias/formato → resultado), mas com números REAIS do
 * `@papazilla/nutrition-engine` no lugar dos valores ilustrativos do protótipo.
 *
 * Diferenças conscientes do protótipo:
 * - Sem etapa de ervas: o protótipo também não tinha; `selection.herbs` fica
 *   sempre vazio.
 * - Vísceras começam SEM pré-seleção (o protótipo pré-selecionava "Fígado" mas
 *   o botão "pular" não limpava a seleção — um comportamento inconsistente do
 *   protótipo). Aqui, pular de fato resulta em vísceras vazias (soma na
 *   proteína), e o tutor escolhe ativamente se quiser incluir alguma.
 * - O controle de formato (cru/pronto/os dois) é usado de verdade na tela de
 *   resultado — no protótipo ele existia mas não alterava o texto exibido.
 * - "Cadastrar outro Monstrinho" salva um rascunho do progresso do wizard
 *   (`recipeDraft.ts`, sessionStorage) antes de ir pra anamnese; ao concluir
 *   o cadastro, volta pra cá com o rascunho recarregado e o Monstrinho novo
 *   já incluído na seleção — fiel ao "recipeStep = 0; showScreen('recipe')"
 *   do protótipo.
 * - `season` não é coletado em lugar nenhum ainda; fixado em "mild" (ver
 *   `recipeEngine.ts`). `predominantProtein` é derivada da seleção de
 *   proteínas do próprio wizard, não é uma pergunta separada (mesma regra do
 *   protótipo).
 */

const FORMAT_OPTIONS = ['Quantidade dos alimentos crus', 'Quantidade dos alimentos prontos', 'Os dois'];

const BATCH_DAY_OPTIONS = [1, 3, 7];

export function ReceitaScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = getSubscription();
  const pets = listPets();
  const draft = peekRecipeDraft();

  const [step, setStep] = useState(0);
  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(() => {
    if (draft) {
      const ids = new Set(draft.selectedPetIds);
      const activeId = getActivePetId();
      if (activeId) ids.add(activeId);
      return ids;
    }
    const active = getActivePet();
    return new Set(active ? [active.id] : pets[0] ? [pets[0].id] : []);
  });
  const [formulation, setFormulation] = useState<FormulationId>(() => draft?.formulation ?? 'padrao');
  const [proteins, setProteins] = useState<Set<string>>(() => new Set(draft?.proteins ?? ['frango_peito']));
  const [carbs, setCarbs] = useState<Set<string>>(() => new Set(draft?.carbs ?? ['batata_doce']));
  const [vegetables, setVegetables] = useState<Set<string>>(() => new Set(draft?.vegetables ?? ['cenoura']));
  const [organs, setOrgans] = useState<Set<string>>(() => new Set(draft?.organs ?? []));
  const [supplement, setSupplement] = useState<SupplementId>(() => draft?.supplement ?? 'food-dog');
  const [days, setDays] = useState(() => draft?.days ?? 7);
  const [customDaysText, setCustomDaysText] = useState('');
  const [customSelected, setCustomSelected] = useState(false);
  const [format, setFormat] = useState(() => draft?.format ?? 'Os dois');
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const bodyRef = useRef<HTMLDivElement>(null);

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  useEffect(() => {
    clearRecipeDraft();
  }, []);

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      toast(state.toast);
      navigate('.', { replace: true, state: null });
    }
  }, []);

  const predominantProtein = useMemo(
    () => derivePredominantProtein([...proteins].map((id) => findItem(id)).filter((it): it is NonNullable<typeof it> => Boolean(it))),
    [proteins],
  );
  const choices = useMemo(
    () => ({ formulation, supplement, predominantProtein }),
    [formulation, supplement, predominantProtein],
  );

  const selectedPets = pets.filter((p) => selectedPetIds.has(p.id));
  const petsWithMuscleLoss = selectedPets.filter(hasSignificantMuscleLoss);
  const petPlans = useMemo(
    () => selectedPets.map((pet) => ({ pet, plan: buildPetPlan(pet, choices) })),
    [selectedPets.map((p) => p.id).join(','), choices],
  );

  if (pets.length === 0) return <Navigate to="/zilla" replace />;
  if (!subscription) return <Navigate to="/assinatura" state={{ returnTo: 'recipe' }} replace />;

  const STEPS_COUNT = 9;
  const isResultStep = step === STEPS_COUNT - 1;

  function goToStep(index: number) {
    setStep(Math.max(0, Math.min(STEPS_COUNT - 1, index)));
    bodyRef.current?.scrollTo({ top: 0 });
  }

  function togglePet(id: string) {
    setSelectedPetIds((prev) => {
      if (prev.has(id) && prev.size === 1) {
        toast('Escolha pelo menos um Monstrinho para continuar.');
        return prev;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleInSet(setter: (fn: (prev: Set<string>) => Set<string>) => void, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickBatchDays(value: number) {
    setDays(value);
    setCustomSelected(false);
    setCustomDaysText('');
  }

  function onCustomDaysChange(raw: string) {
    setCustomDaysText(raw);
    setCustomSelected(true);
    const n = Math.max(1, Math.min(30, Number(raw) || 1));
    setDays(n);
  }

  function goRegisterAnotherPet() {
    saveRecipeDraft({
      selectedPetIds: [...selectedPetIds],
      formulation,
      proteins: [...proteins],
      carbs: [...carbs],
      vegetables: [...vegetables],
      organs: [...organs],
      supplement,
      days,
      format,
    });
    navigate('/anamnese', { state: { returnTo: 'recipe' } });
  }

  const nextDisabled =
    (step === 0 && selectedPetIds.size === 0) ||
    (step === 2 && proteins.size === 0) ||
    (step === 3 && carbs.size === 0) ||
    (step === 4 && vegetables.size === 0);

  function onNext() {
    if (isResultStep) {
      addRecipe({
        petIds: [...selectedPetIds],
        formulation,
        supplement,
        selection: { proteins: [...proteins], organs: [...organs], carbs: [...carbs], vegetables: [...vegetables], herbs: [] },
        days,
        format,
      });
      setSaved(true);
      toast('Receita salva para futuras fornalhas!');
      window.setTimeout(() => navigate('/receitas'), 900);
      return;
    }
    goToStep(step + 1);
  }

  function onBack() {
    if (step > 0) goToStep(step - 1);
    else navigate('/papa');
  }

  const recipe = petPlans.length > 0
    ? buildSharedRecipe(
        petPlans.map((p) => p.plan),
        { proteins: [...proteins], organs: [...organs], carbs: [...carbs], vegetables: [...vegetables], herbs: [] },
        days,
      )
    : null;

  const contextLabel =
    selectedPets.length > 1
      ? `Receita de ${joinPt(selectedPets.map((p) => p.name))}`
      : selectedPets[0]
        ? `Receita ${describePet(selectedPets[0]).preposition} ${describePet(selectedPets[0]).displayName}`
        : 'Receita';

  const stepLabel = isResultStep ? 'Receita pronta' : `Etapa ${step + 1} de ${STEPS_COUNT - 1}`;

  const eyebrowByStep = [
    'A matilha à mesa',
    'Composição do potinho',
    'Base da receita',
    'Energia',
    'Cores no potinho',
    'Parte pequena, papel importante',
    'Finalização individual',
    'Sua fornalha',
    'Porção na medida',
  ];
  const titleByStep = [
    'Para quem vamos cozinhar?',
    'Qual proporção você prefere?',
    'Escolha a proteína',
    'Escolha os carboidratos',
    'Escolha os vegetais',
    'Escolha as vísceras',
    'Qual suplemento você vai usar?',
    'Para quantos dias é a receita?',
    'A fornalha está pronta!',
  ];
  const introByStep = [
    'Escolha um ou mais Monstrinhos. A base pode ser preparada junta; porções e finalizadores continuam individuais.',
    'Escolha como dividir a quantidade diária entre carnes, vísceras, carboidratos e vegetais.',
    'Primeiro a proteína: é o que mais importa para alergias e digestão. Pode escolher mais de uma; a gente divide em partes iguais.',
    'Pode escolher mais de um; a gente divide em partes iguais.',
    'Pode escolher mais de um; a gente divide em partes iguais.',
    'Pode pular esta etapa. Se não usar vísceras hoje, o valor delas é somado à proteína escolhida.',
    'Escolha o vitamínico-mineral que entrará nesta receita. A dose final muda conforme o produto.',
    'Quanto você vai preparar de uma vez? Se cozinha porções para a semana toda, por exemplo, escolha 7 dias — a gente multiplica as quantidades pra você.',
    'Receita pronta para a matilha.',
  ];

  let resultTitle = titleByStep[8]!;
  let recipeIntro = introByStep[step]!;
  if (isResultStep && selectedPets.length > 0) {
    resultTitle =
      selectedPets.length > 1
        ? 'A fornalha da matilha está pronta!'
        : `A fornalha ${describePet(selectedPets[0]!).preposition} ${describePet(selectedPets[0]!).displayName} está pronta!`;
    const sharedTotal = recipe ? recipe.cookedGramsPerDay : 0;
    recipeIntro =
      selectedPets.length > 1
        ? `Receita compartilhada para ${joinPt(selectedPets.map((p) => p.name))} · ${days} ${days === 1 ? 'dia' : 'dias'} · ${formatGrams(sharedTotal)} prontos por dia.`
        : `Receita para ${days} ${days === 1 ? 'dia' : 'dias'} · ${formatGrams(sharedTotal)} prontos por dia · divididos em ${mealsCount(petPlans[0]!.plan, petPlans[0]!.pet)} refeições.`;
  }

  return (
    <div className="flow-screen recipe-flow">
      <header className="flow-header">
        <button type="button" className="flow-header__back" aria-label="Fechar receita" onClick={() => navigate('/papa')}>
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">{contextLabel}</span>
          <strong>{stepLabel}</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={potinhoIcon} alt="" />
        </span>
      </header>

      <div className="flow-progress">
        <span style={{ width: `${((step + 1) / STEPS_COUNT) * 100}%` }} />
      </div>

      <div className="flow-body" ref={bodyRef}>
        <div className="flow-intro">
          <p className="eyebrow">{eyebrowByStep[step]}</p>
          <h1>{isResultStep ? resultTitle : titleByStep[step]}</h1>
          <p>{recipeIntro}</p>
        </div>

        {step === 0 ? (
          <>
            <div className="recipe-pet-list">
              {pets.map((pet) => {
                const isSelected = selectedPetIds.has(pet.id);
                const plan = buildPetPlan(pet, choices);
                return (
                  <button
                    key={pet.id}
                    type="button"
                    className={`recipe-pet-choice${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => togglePet(pet.id)}
                  >
                    <span className="recipe-pet-avatar">
                      <img src={zillaIcon} alt="" />
                    </span>
                    <span>
                      <strong>{pet.name}</strong>
                      <small>
                        {pet.weight ? `${pet.weight} kg · ` : ''}
                        {pet.lifeStage === 'Filhote' ? 'filhote' : 'adulto'}
                      </small>
                      <b>
                        {formatGrams(plan.totalGramsPerDay)} por dia · {mealsCount(plan, pet)} refeições
                      </b>
                    </span>
                    <i aria-hidden="true">✓</i>
                  </button>
                );
              })}
            </div>
            <div className="shared-recipe-note">
              <img src={infoIcon} alt="" />
              <p>
                {selectedPets.length > 1 ? (
                  <>
                    <strong>Uma base, porções separadas</strong>Vamos somar os ingredientes e marcar quanto pertence a{' '}
                    {joinPt(selectedPets.map((p) => p.name))}.
                  </>
                ) : (
                  <>
                    <strong>Uma receita para {selectedPets[0]?.name ?? 'o Monstrinho'}</strong>Você também pode incluir outro
                    Monstrinho nesta fornalha.
                  </>
                )}
              </p>
            </div>
            <button type="button" className="add-recipe-pet" onClick={goRegisterAnotherPet}>
              <span>＋</span>
              <div>
                <strong>Cadastrar outro Monstrinho</strong>
                <small>Ele aparecerá aqui nas próximas receitas</small>
              </div>
            </button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            {petsWithMuscleLoss.length > 0 ? (
              <div className="shared-recipe-note">
                <img src={infoIcon} alt="" />
                <p>
                  <strong>Musculatura pede mais proteína</strong>
                  {joinPt(petsWithMuscleLoss.map((p) => p.name))} {petsWithMuscleLoss.length > 1 ? 'mostraram' : 'mostrou'} perda de músculo moderada ou bem
                  evidente na Anamnese. "Mais proteína" ajuda a preservar massa muscular — você decide se quer usar.
                </p>
              </div>
            ) : null}
            <div className="recipe-preset-list">
              {FORMULATION_ORDER.map((id) => {
                const f = FORMULATIONS[id];
                const isSelected = formulation === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`recipe-preset-card${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setFormulation(id)}
                  >
                    <span>
                      {id === 'mais-proteina' && petsWithMuscleLoss.length > 0 ? (
                        <em className="pz-badge pz-badge--success">Recomendado pela musculatura</em>
                      ) : null}
                      <strong>{FORMULATION_LABELS[id]}</strong>
                      <small>{formulationSummary(id)}</small>
                    </span>
                    <i>
                      <b style={{ ['--preset-size' as string]: `${f.meat}%`, ['--preset-color' as string]: 'var(--pz-coral)' }} />
                      <b style={{ ['--preset-size' as string]: `${f.organs}%`, ['--preset-color' as string]: 'var(--pz-chocolate)' }} />
                      <b style={{ ['--preset-size' as string]: `${f.carb}%`, ['--preset-color' as string]: '#d3a038' }} />
                      <b style={{ ['--preset-size' as string]: `${f.vegetables}%`, ['--preset-color' as string]: 'var(--pz-verde)' }} />
                    </i>
                  </button>
                );
              })}
            </div>
            <div className="preset-legend">
              <span>
                <i className="is-meat" />
                Carnes
              </span>
              <span>
                <i className="is-organ" />
                Vísceras
              </span>
              <span>
                <i className="is-carb" />
                Carboidratos
              </span>
              <span>
                <i className="is-veg" />
                Vegetais
              </span>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <IngredientPicker items={PROTEINS} selected={proteins} onToggle={(id) => toggleInSet(setProteins, id)} />
        ) : null}
        {step === 3 ? <IngredientPicker items={CARBS} selected={carbs} onToggle={(id) => toggleInSet(setCarbs, id)} /> : null}
        {step === 4 ? (
          <IngredientPicker items={VEGETABLES} selected={vegetables} onToggle={(id) => toggleInSet(setVegetables, id)} />
        ) : null}
        {step === 5 ? (
          <>
            <IngredientPicker items={ORGANS} selected={organs} onToggle={(id) => toggleInSet(setOrgans, id)} />
            <button type="button" className="skip-card" onClick={() => { setOrgans(new Set()); goToStep(step + 1); }}>
              <span>Hoje não vou usar vísceras</span>
              <small>A porção será somada à proteína</small>
            </button>
          </>
        ) : null}

        {step === 6 ? (
          <div className="recipe-preset-list supplement-choice-list">
            {SUPPLEMENT_ORDER.map((id) => {
              const isSelected = supplement === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`recipe-preset-card supplement-choice-card${isSelected ? ' is-selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setSupplement(id)}
                >
                  <span>
                    <strong>{SUPPLEMENT_LABELS[id]}</strong>
                    <small>{supplementReference(id)}</small>
                  </span>
                </button>
              );
            })}
            <div className="shared-recipe-note supplement-choice-note">
              <img src={infoIcon} alt="" />
              <p>
                <strong>Dose calculada por pet</strong>A fase de vida de cada Monstrinho (adulto ou filhote) muda a dose final
                deste produto.
              </p>
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <>
            <div className="batch-choices">
              {BATCH_DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`batch-card${!customSelected && days === d ? ' is-selected' : ''}`}
                  onClick={() => pickBatchDays(d)}
                >
                  <strong>{d}</strong>
                  <span>{d === 1 ? '1 dia' : `${d} dias`}</span>
                </button>
              ))}
            </div>
            <label className={`custom-days-field${customSelected ? ' is-selected' : ''}`}>
              <span>
                <strong>Outro período</strong>
                <small>Escolha de 1 a 30 dias</small>
              </span>
              <span className="custom-days-input">
                <input
                  type="number"
                  min={1}
                  max={30}
                  inputMode="numeric"
                  placeholder="Ex.: 14"
                  value={customDaysText}
                  onChange={(e) => onCustomDaysChange(e.target.value)}
                />
                <b>dias</b>
              </span>
            </label>
            <div className="profile-question">
              <h3>Como você gostaria de receber sua receita?</h3>
              <div className="option-stack compact-options">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`select-card${format === opt ? ' is-selected' : ''}`}
                    onClick={() => setFormat(opt)}
                  >
                    <span className="select-card__radio" />
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {isResultStep && recipe ? (
          <RecipeResultCard recipe={recipe} petPlans={petPlans} formulation={formulation} days={days} format={format} />
        ) : null}
      </div>

      <footer className="flow-footer">
        <button type="button" className="pz-button pz-button--outline" onClick={onBack}>
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </button>
        <button type="button" className="pz-button pz-button--primary" disabled={nextDisabled || saved} onClick={onNext}>
          {isResultStep ? 'Salvar receita' : step === STEPS_COUNT - 2 ? 'Ver receita →' : 'Continuar →'}
        </button>
      </footer>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
