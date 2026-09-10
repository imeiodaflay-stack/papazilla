/** Grupos de alimento da formulação. */
export type FoodGroup = 'meat' | 'organs' | 'carb' | 'vegetables';

/** Objetivo da alimentação. Só `lose` muda a matemática (usa o peso ideal). */
export type FeedingGoal =
  | 'maintain'
  | 'lose'
  | 'gain'
  | 'quality'
  | 'aging'
  | 'health';

export type LifeStage = 'adult' | 'puppy';

/** Faixa etária do filhote (meses), conforme a tabela original. */
export type PuppyAgeBand = '2-4' | '4-6' | '6-8' | '8-10' | '10-18' | '18+';

/** Porte adulto esperado. */
export type DogSize = 'small' | 'medium' | 'large' | 'giant';

/**
 * Tendência de peso / atividade — define onde cair dentro da faixa percentual.
 * `gains-easily` = ponta baixa, `lean-active` = ponta alta.
 */
export type WeightTendency = 'gains-easily' | 'normal' | 'lean-active';

export type Season = 'mild' | 'summer' | 'winter';

/** As quatro proporções da calculadora original. */
export type FormulationId =
  | 'padrao'
  | 'mais-proteina'
  | 'intermediaria'
  | 'mais-visceras';

export type SupplementId = 'food-dog' | 'nutroplus';

/** Proteína predominante — define o óleo vegetal recomendado. */
export type PredominantProtein = 'chicken-pork' | 'beef-lean-fish';

export interface Formulation {
  id: FormulationId;
  /** Percentuais por grupo. Somam 100. */
  meat: number;
  organs: number;
  carb: number;
  vegetables: number;
}

export type DailyPlanValidationCode = 'IDEAL_WEIGHT_REQUIRED';

export interface DailyPlanInput {
  /** Peso medido atualmente, em kg. Fixado em [0,5; 90]. */
  currentWeightKg: number;
  goal: FeedingGoal;
  /** Obrigatório e usado no cálculo quando `goal === 'lose'`. */
  idealWeightKg?: number;
  lifeStage: LifeStage;
  /** Obrigatório quando `lifeStage === 'puppy'`. */
  puppyAgeBand?: PuppyAgeBand;
  /** Obrigatório quando `lifeStage === 'puppy'`. */
  expectedAdultSize?: DogSize;
  weightTendency: WeightTendency;
  /** Só afeta adultos (ignorado para filhote), como no motor original. */
  neutered?: boolean;
  /** Só afeta adultos (ignorado para filhote), como no motor original. */
  senior?: boolean;
  season: Season;
  formulation: FormulationId;
  supplement: SupplementId;
  predominantProtein: PredominantProtein;
  /**
   * Sinaliza que a anamnese registrou condição(ões) de saúde relevantes.
   * O motor NÃO cria dieta terapêutica nem ajusta a receita: apenas liga
   * `clinicalReviewRequired` e o disclaimer, conforme `escopo-mvp.md`.
   */
  healthConditionsPresent?: boolean;
}

export interface DailyPlan {
  engineVersion: string;
  valid: boolean;
  validationErrors: DailyPlanValidationCode[];
  /** Peso efetivamente usado no cálculo (ideal em emagrecimento, senão o atual). */
  weightUsedKg: number;
  currentWeightKg: number;
  goal: FeedingGoal;
  /** Percentual do peso usado como base da porção diária. */
  percentOfWeight: number;
  /** Total de alimento PRONTO por dia, em gramas (arredondado a múltiplo de 5). */
  totalGramsPerDay: number;
  /** Número de refeições sugerido ("2", "3", "3–4"). */
  mealsPerDay: string;
  /** Gramas PRONTAS por dia de cada grupo, antes da divisão por ingredientes. */
  groupsGramsPerDay: Record<FoodGroup, number>;
  formulation: Formulation;
  /** Faixa diária de petiscos (10%–15% do total), em gramas. */
  treatsGramsPerDay: { min: number; max: number };
  supplement: {
    id: SupplementId;
    name: string;
    doseGramsPerDay: number;
    /** Orientação de introdução gradual. */
    ramp: string;
  };
  vegetableOil: { dose: string; note: string };
  fishOil: { dose: string };
  saltGuidance: string;
  /** True quando há condição de saúde informada. Não bloqueia a receita. */
  clinicalReviewRequired: boolean;
  disclaimers: string[];
}

export type IngredientRawGroup =
  | 'carne'
  | 'ovo'
  | 'viscera'
  | 'tuberculo'
  | 'grao'
  | 'legume'
  | 'folhosa';

export type IngredientGroupKey = 'proteins' | 'organs' | 'carbs' | 'vegetables' | 'herbs';

export interface CatalogItem {
  id: string;
  label: string;
  /** `false` = item "extra" (fora da lista curta). */
  common: boolean;
  rawGroup?: IngredientRawGroup;
  /** Víscera muscular (moela, coração, pulmão, bucho, língua). */
  muscularOrgan?: boolean;
  /** Teor de gordura muito alto (língua). */
  highFat?: boolean;
  /** Vegetal com alerta específico (espinafre / ácido oxálico). */
  vegAlert?: boolean;
  /** Vegetal que solta o intestino (abóbora, quiabo, berinjela, jiló). */
  vegLoosens?: boolean;
  /** Erva com dose de referência na fonte. */
  sourced?: boolean;
}

export interface RecipeSelection {
  proteins: string[];
  organs: string[];
  carbs: string[];
  vegetables: string[];
  herbs: string[];
}

export interface RecipeInput {
  plan: DailyPlan;
  selection: RecipeSelection;
  /** Dias de fornalha. Fixado em [1; 30]. */
  days: number;
}

export interface RecipeRow {
  id: string;
  label: string;
  /** Gramas PRONTAS para o período todo da receita. */
  cookedGrams?: number;
  /** Estimativa de gramas CRUS para render as gramas prontas. */
  rawGrams?: number;
  /** Texto de dose (ervas, que não entram em gramas). */
  note?: string;
}

export interface RecipeGroup {
  key: IngredientGroupKey;
  title: string;
  subtitle?: string;
  rows: RecipeRow[];
}

export interface RecipeNote {
  code:
    | 'MUSCULAR_ORGANS'
    | 'TONGUE_HIGH_FAT'
    | 'SPINACH_OXALATE'
    | 'LOOSENS_INTESTINE';
  text: string;
}

export interface Recipe {
  engineVersion: string;
  days: number;
  mealsPerDay: string;
  groups: RecipeGroup[];
  /** Total PRONTO do período (totalGramsPerDay × days). */
  totalCookedGrams: number;
  /** Total PRONTO de um dia. */
  cookedGramsPerDay: number;
  /** Soma das estimativas de peso cru. */
  totalRawGrams: number;
  notes: RecipeNote[];
  disclaimers: string[];
}
