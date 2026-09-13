import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { DailyPlan, FormulationId, RecipeRow, SupplementId } from '@papazilla/nutrition-engine';
import { CARBS, FORMULATIONS, ORGANS, PROTEINS, SUPPLEMENTS, VEGETABLES, findItem } from '@papazilla/nutrition-engine';
import zillaIcon from '../assets/icons/zilla.png';
import potinhoIcon from '../assets/icons/potinho.png';
import addIcon from '../assets/icons/adicionar.png';
import infoIcon from '../assets/icons/info.png';
import receitaIcon from '../assets/icons/receita.png';
import { getActivePet, listPets, type StoredPet } from '../lib/petsStore.js';
import { describePet, joinPt } from '../lib/petLabel.js';
import { getSubscription } from '../lib/subscription.js';
import { derivePredominantProtein } from '../lib/engineMapping.js';
import { buildPetPlan, buildSharedRecipe } from '../lib/recipeEngine.js';
import { addRecipe } from '../lib/recipesStore.js';
import { IngredientPicker } from '../components/IngredientPicker.js';

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
 * - "Cadastrar outro Monstrinho" leva para a anamnese normal (termina em
 *   /sucesso) em vez de voltar direto para o wizard — o retorno automático ao
 *   wizard após o cadastro é o fluxo do protótipo, mas fica para outra fatia.
 * - `season` não é coletado em lugar nenhum ainda; fixado em "mild" (ver
 *   `recipeEngine.ts`). `predominantProtein` é derivada da seleção de
 *   proteínas do próprio wizard, não é uma pergunta separada (mesma regra do
 *   protótipo).
 */

const FORMULATION_LABELS: Record<FormulationId, string> = {
  padrao: 'Padrão',
  'mais-proteina': 'Mais proteína',
  intermediaria: 'Intermediária',
  'mais-visceras': 'Mais vísceras',
};

const FORMULATION_ORDER: FormulationId[] = ['padrao', 'mais-proteina', 'intermediaria', 'mais-visceras'];

function formulationSummary(id: FormulationId): string {
  const f = FORMULATIONS[id];
  return `${f.meat}% carnes · ${f.organs}% vísceras · ${f.carb}% carboidratos · ${f.vegetables}% vegetais`;
}

const SUPPLEMENT_ORDER: SupplementId[] = ['food-dog', 'nutroplus'];

const SUPPLEMENT_LABELS: Record<SupplementId, string> = {
  'food-dog': 'Food Dog',
  nutroplus: 'Nutroplus Manutenção',
};

function supplementReference(id: SupplementId): string {
  const s = SUPPLEMENTS[id];
  return `${s.adultFactor.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} g para cada 100 g de comida pronta (adulto)`;
}

const FORMAT_OPTIONS = ['Quantidade dos alimentos crus', 'Quantidade dos alimentos prontos', 'Os dois'];

const BATCH_DAY_OPTIONS = [1, 3, 7];

function mealsCount(plan: DailyPlan): number {
  const match = /\d+/.exec(plan.mealsPerDay);
  return match ? Number(match[0]) : 2;
}

function mealSize(plan: DailyPlan): number {
  return Math.round(plan.totalGramsPerDay / mealsCount(plan));
}

function formatGrams(value: number): string {
  return `${Math.round(value).toLocaleString('pt-BR')} g`;
}

function formatRowAmount(row: RecipeRow, format: string): string {
  const cookedTxt = row.cookedGrams !== undefined ? formatGrams(row.cookedGrams) : '';
  const rawTxt = row.rawGrams !== undefined ? formatGrams(row.rawGrams) : '';
  if (format === 'Quantidade dos alimentos crus') return rawTxt ? `≈ ${rawTxt} cru` : '—';
  if (format === 'Quantidade dos alimentos prontos') return cookedTxt ? `≈ ${cookedTxt} pronto` : '—';
  if (rawTxt && cookedTxt) return `≈ ${rawTxt} cru · ${cookedTxt} pronto`;
  return rawTxt ? `≈ ${rawTxt}` : cookedTxt ? `≈ ${cookedTxt}` : '—';
}

function prepPortionsText(petPlans: { pet: StoredPet; plan: DailyPlan }[], days: number): string {
  if (petPlans.length > 1) {
    const parts = petPlans.map(
      ({ pet, plan }) => `${days} ${days === 1 ? 'porção' : 'porções'} de ${formatGrams(plan.totalGramsPerDay)} para ${pet.name}`,
    );
    return `Depois de misturar, separe ${joinPt(parts)}. Identifique os recipientes com nome e data.`;
  }
  const plan = petPlans[0]!.plan;
  const totalMeals = days * mealsCount(plan);
  return `Monte ${days} ${days === 1 ? 'porção diária' : 'porções diárias'} de ${formatGrams(plan.totalGramsPerDay)} ou ${totalMeals} refeições de ${formatGrams(mealSize(plan))}. Use recipientes rasos, limpos e identificados com a data.`;
}

export function ReceitaScreen() {
  const navigate = useNavigate();
  const subscription = getSubscription();
  const pets = listPets();

  const [step, setStep] = useState(0);
  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(() => {
    const active = getActivePet();
    return new Set(active ? [active.id] : pets[0] ? [pets[0].id] : []);
  });
  const [formulation, setFormulation] = useState<FormulationId>('padrao');
  const [proteins, setProteins] = useState<Set<string>>(new Set(['frango_peito']));
  const [carbs, setCarbs] = useState<Set<string>>(new Set(['batata_doce']));
  const [vegetables, setVegetables] = useState<Set<string>>(new Set(['cenoura']));
  const [organs, setOrgans] = useState<Set<string>>(new Set());
  const [supplement, setSupplement] = useState<SupplementId>('food-dog');
  const [days, setDays] = useState(7);
  const [customDaysText, setCustomDaysText] = useState('');
  const [customSelected, setCustomSelected] = useState(false);
  const [format, setFormat] = useState('Os dois');
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const bodyRef = useRef<HTMLDivElement>(null);

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const predominantProtein = useMemo(
    () => derivePredominantProtein([...proteins].map((id) => findItem(id)).filter((it): it is NonNullable<typeof it> => Boolean(it))),
    [proteins],
  );
  const choices = useMemo(
    () => ({ formulation, supplement, predominantProtein }),
    [formulation, supplement, predominantProtein],
  );

  const selectedPets = pets.filter((p) => selectedPetIds.has(p.id));
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

  /**
   * O primeiro pet da lista pode não ser o que tem condição de saúde — não dá
   * pra assumir que o alerta clínico cai no índice 0 do flatMap. Achamos o
   * plano que exige revisão e colocamos o disclaimer dele (sempre o primeiro
   * do próprio array, por convenção de `daily-plan.ts`) na frente.
   */
  const clinicalPlanEntry = petPlans.find(({ plan }) => plan.clinicalReviewRequired);
  const flatDisclaimers = [...new Set(petPlans.flatMap(({ plan }) => plan.disclaimers))];
  const orderedDisclaimers = clinicalPlanEntry
    ? [clinicalPlanEntry.plan.disclaimers[0]!, ...flatDisclaimers.filter((d) => d !== clinicalPlanEntry.plan.disclaimers[0])]
    : flatDisclaimers;

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
        : `Receita para ${days} ${days === 1 ? 'dia' : 'dias'} · ${formatGrams(sharedTotal)} prontos por dia · divididos em ${mealsCount(petPlans[0]!.plan)} refeições.`;
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
                        {formatGrams(plan.totalGramsPerDay)} por dia · {mealsCount(plan)} refeições
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
            <button type="button" className="add-recipe-pet" onClick={() => navigate('/anamnese')}>
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
          <div className="recipe-result-card">
            <div className="recipe-result-card__total">
              <span>
                <small>Total da receita</small>
                <strong>{formatGrams(recipe.totalCookedGrams)}</strong>
                <small>prontos</small>
              </span>
              <img src={potinhoIcon} alt="" />
            </div>
            <div className="recipe-preset-result">
              <small>Proporção escolhida</small>
              <strong>{FORMULATION_LABELS[formulation]}</strong>
              <span>{formulationSummary(formulation)}</span>
            </div>
            {selectedPets.length > 1 ? (
              <div className="pet-portion-breakdown">
                <div>
                  <small>Uma base para</small>
                  <strong>{joinPt(selectedPets.map((p) => p.name))}</strong>
                </div>
                {petPlans.map(({ pet, plan }) => (
                  <span key={pet.id}>
                    <b>{pet.name}</b>
                    <small>
                      {formatGrams(plan.totalGramsPerDay)}/dia · {formatGrams(mealSize(plan))}/ref.
                    </small>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="result-group">
              <h3>O que pesar</h3>
              {recipe.groups
                .filter((g) => g.key !== 'herbs')
                .map((group) => (
                  <div key={group.key}>
                    <span>{group.rows.map((r) => r.label).join(', ')}</span>
                    <strong>{group.rows.map((r) => formatRowAmount(r, format)).join(' + ')}</strong>
                  </div>
                ))}
            </div>
            {recipe.notes.length > 0 ? (
              <div className="result-group">
                <h3>Vale saber</h3>
                {recipe.notes.map((note) => (
                  <div key={note.code} className="shared-recipe-note">
                    <img src={infoIcon} alt="" />
                    <p>{note.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="supplement-result">
              <div className="supplement-result__title">
                <img src={addIcon} alt="" />
                <span>
                  <small>Também entra no potinho</small>
                  <h3>Suplementos e finalização</h3>
                </span>
              </div>
              <p className="supplement-context">
                {selectedPets.length > 1
                  ? 'A base é compartilhada; as doses continuam separadas por pet.'
                  : `Dose calculada sobre a porção pronta de ${selectedPets[0]?.name ?? 'o Monstrinho'}.`}
              </p>
              <div className="pet-finalizers">
                {petPlans.map(({ pet, plan }, index) => (
                  <details key={pet.id} className="pet-finalizer-card" open={petPlans.length === 1 || index === 0}>
                    <summary>
                      <span className="pet-finalizer-card__pet">
                        <i className="recipe-pet-avatar">
                          <img src={zillaIcon} alt="" />
                        </i>
                        <span>
                          <strong>{pet.name}</strong>
                          <small>
                            {formatGrams(plan.totalGramsPerDay)}/dia · {formatGrams(mealSize(plan))} por refeição
                          </small>
                        </span>
                      </span>
                      <b aria-hidden="true">⌄</b>
                    </summary>
                    <div className="pet-finalizer-card__doses">
                      <p>
                        <span>
                          <strong>{plan.supplement.name}</strong>
                          <small>{plan.supplement.ramp}</small>
                        </span>
                        <b>{plan.supplement.doseGramsPerDay.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g/dia</b>
                      </p>
                      <p>
                        <span>
                          <strong>Óleo vegetal</strong>
                          <small>{plan.vegetableOil.note}</small>
                        </span>
                        <b>{plan.vegetableOil.dose}</b>
                      </p>
                      <p>
                        <span>
                          <strong>Óleo de peixe ou krill</strong>
                          <small>Diário ou 3× por semana</small>
                        </span>
                        <b>{plan.fishOil.dose}</b>
                      </p>
                      <p className="pet-finalizer-card__salt">
                        <span>
                          <strong>Sal integral</strong>
                          <small>{plan.saltGuidance}</small>
                        </span>
                        <b>Opcional</b>
                      </p>
                    </div>
                  </details>
                ))}
              </div>
              {petPlans.length > 1 ? (
                <aside className="shared-finalizer-warning">
                  <img src={infoIcon} alt="" />
                  <span>Separe as porções de cada pet antes de adicionar suplementos, óleos e doses individuais.</span>
                </aside>
              ) : null}
            </div>
            <details className="recipe-preparation" open>
              <summary>
                <span>
                  <img src={receitaIcon} alt="" />
                  Modo de preparo
                </span>
                <b aria-hidden="true">⌄</b>
              </summary>
              <div className="recipe-preparation__body">
                <p className="recipe-preparation__intro">
                  Passo a passo para esta combinação. Os tempos consideram cortes pequenos e são aproximados.
                </p>
                <ol className="prep-steps">
                  <li>
                    <span>1</span>
                    <div>
                      <strong>Organize uma bancada limpa</strong>
                      <p>
                        Lave as mãos por 20 segundos. Separe tábua e faca usadas na carne crua, não lave o frango e pese todos
                        os ingredientes ainda crus.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>Faça cortes uniformes</strong>
                      <p>
                        Corte carnes em cubos de 2–3 cm; vísceras em pedaços de 1,5–2 cm; tubérculos e vegetais em cubos de
                        1,5–2 cm. Tamanhos parecidos cozinham por igual.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Cozinhe sem temperos</strong>
                      <p>Cozinhe cada grupo separadamente, em água ou no vapor. Não use cebola, alho, molhos ou temperos prontos.</p>
                    </div>
                  </li>
                  <li className="prep-step--temperature">
                    <span>
                      <img src={infoIcon} alt="" />
                    </span>
                    <div>
                      <strong>Confirme 74&nbsp;°C nas carnes e vísceras</strong>
                      <p>Meça no centro da parte mais espessa. Cor e tempo sozinhos não confirmam um cozimento seguro.</p>
                    </div>
                  </li>
                  <li>
                    <span>4</span>
                    <div>
                      <strong>Escorra, espere amornar e misture</strong>
                      <p>Desfie ou pique depois de cozido. Misture tudo até os ingredientes ficarem bem distribuídos; não ofereça a comida quente.</p>
                    </div>
                  </li>
                  <li>
                    <span>5</span>
                    <div>
                      <strong>Divida a fornalha</strong>
                      <p>{prepPortionsText(petPlans, days)}</p>
                    </div>
                  </li>
                  <li>
                    <span>6</span>
                    <div>
                      <strong>Finalize somente na hora de servir</strong>
                      <p>Adicione suplemento, óleos e qualquer dose individual indicada à porção já fria ou morna. Não tempere a receita por conta própria.</p>
                    </div>
                  </li>
                  <li>
                    <span>7</span>
                    <div>
                      <strong>Guarde com segurança</strong>
                      <p>Refrigere em até 2 horas e use as porções refrigeradas em 3–4 dias. Congele o restante e descongele dentro da geladeira.</p>
                    </div>
                  </li>
                </ol>
                <p className="prep-footnote">
                  *Estimativa para cubos de 2–3 cm em fervura suave. Quantidade, panela e fogão alteram o tempo; o termômetro
                  define o ponto seguro.
                </p>
                <div className="prep-sources">
                  <span>Segurança alimentar</span>
                  <a
                    href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart"
                    target="_blank"
                    rel="noopener"
                  >
                    Temperatura ↗
                  </a>
                  <a href="https://ask.fsis.usda.gov/article/Is-it-necessary-to-rinse-soak-or-brine-chicken-to-make-it-safe" target="_blank" rel="noopener">
                    Frango ↗
                  </a>
                  <a href="https://www.fda.gov/animal-veterinary/animal-health-literacy/tips-safe-handling-pet-food-and-treats" target="_blank" rel="noopener">
                    Higiene ↗
                  </a>
                </div>
              </div>
            </details>
            {selectedPets.length > 1 ? (
              <div className="portion-row">
                {petPlans.map(({ pet, plan }) => (
                  <span key={pet.id}>
                    <small>{pet.name}</small>
                    <strong>{formatGrams(plan.totalGramsPerDay)}/dia</strong>
                    <b>{formatGrams(mealSize(plan))}/refeição</b>
                  </span>
                ))}
              </div>
            ) : (
              <div className="portion-row">
                <span>
                  <small>Por dia</small>
                  <strong>{formatGrams(petPlans[0]!.plan.totalGramsPerDay)}</strong>
                </span>
                <span>
                  <small>Por refeição</small>
                  <strong>{formatGrams(mealSize(petPlans[0]!.plan))}</strong>
                </span>
              </div>
            )}
            {orderedDisclaimers.map((text, i) => (
              <div key={i} className={i === 0 && clinicalPlanEntry ? 'clinical-warning' : 'shared-recipe-note'}>
                <img src={infoIcon} alt="" />
                <p>{text}</p>
              </div>
            ))}
          </div>
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
