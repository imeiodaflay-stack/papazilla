import type {
  DogSize,
  Formulation,
  FormulationId,
  IngredientRawGroup,
  PredominantProtein,
  PuppyAgeBand,
  SupplementId,
  WeightTendency,
} from './types.js';

/**
 * Todas as tabelas abaixo são port fiel de `calculadora-an-cozida.html`
 * (metodologia pública da Dra. Sylvia Angélico, cachorroverde.com.br).
 * Não alterar valores sem incrementar ENGINE_VERSION e registrar a fonte.
 */

/** Faixa percentual [min, max] do peso, por peso adulto (kg). Primeira faixa cujo `maxKg` >= peso. */
export const ADULT_RANGES: ReadonlyArray<{ maxKg: number; min: number; max: number }> = [
  { maxKg: 3, min: 7, max: 10 },
  { maxKg: 5, min: 5, max: 6 },
  { maxKg: 10, min: 4, max: 6 },
  { maxKg: 25, min: 4, max: 5 },
  { maxKg: 35, min: 4, max: 5 },
  { maxKg: 42, min: 3, max: 4 },
  { maxKg: Number.POSITIVE_INFINITY, min: 3, max: 4 },
];

/** Faixa percentual [min, max] do peso, por faixa etária do filhote × porte adulto esperado. */
export const PUPPY_RANGES: Record<PuppyAgeBand, Record<DogSize, readonly [number, number]>> = {
  '2-4': { small: [10, 10], medium: [10, 10], large: [8, 8], giant: [8, 8] },
  '4-6': { small: [8, 8], medium: [8, 8], large: [7, 7], giant: [7, 7] },
  '6-8': { small: [6, 7], medium: [6, 7], large: [6, 7], giant: [6, 6] },
  '8-10': { small: [5, 6], medium: [5, 6], large: [5, 6], giant: [5, 5] },
  '10-18': { small: [4, 6], medium: [4, 6], large: [4, 5], giant: [4, 5] },
  '18+': { small: [4, 6], medium: [4, 5], large: [4, 4.5], giant: [3, 4] },
};

/** Refeições por dia sugeridas por faixa etária do filhote. */
export const PUPPY_MEALS: Record<PuppyAgeBand, string> = {
  '2-4': '3–4',
  '4-6': '3',
  '6-8': '2',
  '8-10': '2',
  '10-18': '2',
  '18+': '2',
};

export const ADULT_MEALS = '2';

/** Ajuste no ponto da faixa: ponta baixa, meio ou ponta alta. */
export function tendencyPercent(range: readonly [number, number], tendency: WeightTendency): number {
  const [min, max] = range;
  if (tendency === 'gains-easily') return min;
  if (tendency === 'lean-active') return max;
  return (min + max) / 2;
}

/** Ajuste sazonal somado ao percentual (pontos percentuais). */
export const SEASON_ADJUST: Record<'mild' | 'summer' | 'winter', number> = {
  mild: 0,
  summer: -0.25,
  winter: 0.25,
};

/** Ajustes de adulto (pontos percentuais). */
export const NEUTERED_ADJUST = -0.5;
export const SENIOR_ADJUST = 0.5;

/** Limites do percentual final. */
export const PERCENT_MIN = 2;
export const PERCENT_MAX = 12;

/** Limites de peso aceitos (kg). */
export const WEIGHT_MIN_KG = 0.5;
export const WEIGHT_MAX_KG = 90;

/** Petiscos: faixa do total diário. */
export const TREATS_MIN_RATIO = 0.1;
export const TREATS_MAX_RATIO = 0.15;

export const FORMULATIONS: Record<FormulationId, Formulation> = {
  padrao: { id: 'padrao', meat: 35, organs: 5, carb: 35, vegetables: 25 },
  'mais-proteina': { id: 'mais-proteina', meat: 45, organs: 5, carb: 25, vegetables: 25 },
  intermediaria: { id: 'intermediaria', meat: 40, organs: 5, carb: 30, vegetables: 25 },
  'mais-visceras': { id: 'mais-visceras', meat: 40, organs: 10, carb: 25, vegetables: 25 },
};

/** Fator de dose do suplemento (g por 100 g de AN), por produto e fase. */
export const SUPPLEMENTS: Record<
  SupplementId,
  { adultFactor: number; puppyFactor: number; adultName: string; puppyName: string }
> = {
  'food-dog': {
    adultFactor: 0.8,
    puppyFactor: 2.5,
    adultName: 'Food Dog Adulto',
    puppyName: 'Food Dog Filhotes',
  },
  nutroplus: {
    adultFactor: 0.6,
    puppyFactor: 2,
    adultName: 'Nutroplus Manutenção',
    puppyName: 'Nutroplus Crescimento',
  },
};

export const SUPPLEMENT_RAMP =
  'Introduza aos poucos: 1/4 da dose a cada 3 dias, até a dose cheia em 12 dias.';

export const SALT_GUIDANCE =
  'Pode entrar na receita, mas em quantidade bem pequena: excesso de sódio faz mal para o cão. ' +
  'A dose certa varia de cão para cão (peso, idade, doenças renais ou cardíacas) — procure orientação ' +
  'de um médico-veterinário antes de definir quanto usar.';

/** Óleo vegetal, por faixa de peso ATUAL (kg). */
export function vegetableOilDose(currentWeightKg: number): string {
  if (currentWeightKg <= 2) return '1 colherinha de café, 1x ao dia';
  if (currentWeightKg <= 7) return '1/2 colher de chá, 2x ao dia';
  if (currentWeightKg <= 15) return '1 colher de sobremesa, 1x ao dia';
  if (currentWeightKg <= 25) return '1 colher de sopa, 1x ao dia';
  return '1 colher de sopa, 2x ao dia';
}

export function vegetableOilNote(protein: PredominantProtein): string {
  return protein === 'beef-lean-fish'
    ? 'Óleo de girassol ou de gergelim (dieta já é pobre em ômega-6).'
    : 'Azeite de oliva extra virgem, óleo de coco ou linhaça dourada.';
}

/** Óleo de peixe/krill, por faixa de peso ATUAL (kg). */
export function fishOilDose(currentWeightKg: number): string {
  if (currentWeightKg <= 5) return '1 cápsula de 500mg, diária ou 3x/semana';
  if (currentWeightKg <= 20) return '1 cápsula de 1g, diária ou 3x/semana';
  return '2 cápsulas de 1g (2g no total), diária ou 3x/semana';
}

/**
 * Fatores de rendimento culinário: cru = pronto × fator.
 *   carne: perde ~25% -> ÷ 0,75
 *   ovo cozido: ~1
 *   víscera glandular: perde ~23% -> ÷ 0,77
 *   tubérculo: varia pouco -> × 0,95
 *   grão que incha: -> ÷ 2,85 (arroz confirmado na fonte; demais por analogia)
 *   legume: -> × 1,10
 *   folhosa: reduz bastante -> × 1,40
 */
export const RAW_FACTOR: Record<IngredientRawGroup, number> = {
  carne: 1 / 0.75,
  ovo: 1,
  viscera: 1 / 0.77,
  tuberculo: 0.95,
  grao: 1 / 2.85,
  legume: 1.1,
  folhosa: 1.4,
};

export function rawFromCooked(cookedGrams: number, rawGroup: IngredientRawGroup | undefined): number {
  if (!rawGroup) return cookedGrams;
  return cookedGrams * RAW_FACTOR[rawGroup];
}

/**
 * Dose de ervas: até 1 colher de chá (5 g) seca ou 3 colheres de sopa (~15 g)
 * fresca picada por 500 g–1 kg de alimento pronto (cachorroverde.com.br/ervas).
 * Escalado para o total diário usando 750 g como referência.
 */
export function herbDoseNote(totalGramsPerDay: number): string {
  const ratio = totalGramsPerDay / 750;
  const dried = 5 * ratio;
  const fresh = 15 * ratio;
  return `até ${round1(dried)} g desidratada ou ${round1(fresh)} g fresca picada`;
}

export const HERB_UNSOURCED_NOTE =
  'sem dose definida nessa fonte; use só uma pitada pequena, com moderação';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
