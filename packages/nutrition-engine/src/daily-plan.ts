import {
  ADULT_MEALS,
  ADULT_RANGES,
  FORMULATIONS,
  NEUTERED_ADJUST,
  PERCENT_MAX,
  PERCENT_MIN,
  PUPPY_MEALS,
  PUPPY_RANGES,
  SALT_GUIDANCE,
  SEASON_ADJUST,
  SENIOR_ADJUST,
  SUPPLEMENT_RAMP,
  SUPPLEMENTS,
  TREATS_MAX_RATIO,
  TREATS_MIN_RATIO,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
  fishOilDose,
  tendencyPercent,
  vegetableOilDose,
  vegetableOilNote,
} from './tables.js';
import type { DailyPlan, DailyPlanInput, DailyPlanValidationCode, FoodGroup } from './types.js';
import { ENGINE_VERSION } from './version.js';

const CLINICAL_DISCLAIMER =
  'Esta receita não contempla ajustes clínicos individualizados para as condições de saúde ' +
  'informadas. Compartilhe com o médico-veterinário que acompanha o cão para revisão.';

const GENERAL_DISCLAIMER =
  'Estimativa educacional baseada em metodologia pública de alimentação natural; não substitui ' +
  'avaliação de médico-veterinário. Reajuste a porção conforme o escore de condição corporal do cão.';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isValidWeight(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= WEIGHT_MIN_KG && n <= WEIGHT_MAX_KG;
}

function adultRange(weightKg: number): readonly [number, number] {
  const found = ADULT_RANGES.find((r) => weightKg <= r.maxKg) ?? ADULT_RANGES[ADULT_RANGES.length - 1]!;
  return [found.min, found.max];
}

/**
 * Calcula o plano diário de alimentação natural cozida.
 * Port fiel da função `calc()` de `calculadora-an-cozida.html`.
 */
export function calculateDailyPlan(input: DailyPlanInput): DailyPlan {
  const currentWeightKg = clamp(input.currentWeightKg || 0, WEIGHT_MIN_KG, WEIGHT_MAX_KG);
  const validationErrors: DailyPlanValidationCode[] = [];

  // "Emagrecer" usa o peso meta pra pesar MENOS que o atual; "Ganhar peso"
  // usa o mesmo peso meta, mas pra pesar MAIS — mesma alavanca (o total é
  // proporcional ao peso usado), sentido oposto.
  const usesIdealWeight = input.goal === 'lose' || input.goal === 'gain';
  if (usesIdealWeight && !isValidWeight(input.idealWeightKg)) {
    validationErrors.push('IDEAL_WEIGHT_REQUIRED');
  }

  const formulation = FORMULATIONS[input.formulation];
  const clinicalReviewRequired = input.healthConditionsPresent === true;
  const disclaimers = [GENERAL_DISCLAIMER];
  if (clinicalReviewRequired) disclaimers.unshift(CLINICAL_DISCLAIMER);

  if (validationErrors.length > 0) {
    return {
      engineVersion: ENGINE_VERSION,
      valid: false,
      validationErrors,
      weightUsedKg: currentWeightKg,
      currentWeightKg,
      goal: input.goal,
      percentOfWeight: 0,
      totalGramsPerDay: 0,
      mealsPerDay: input.lifeStage === 'puppy' ? '3' : ADULT_MEALS,
      groupsGramsPerDay: { meat: 0, organs: 0, carb: 0, vegetables: 0 },
      formulation,
      treatsGramsPerDay: { min: 0, max: 0 },
      supplement: { id: input.supplement, name: '', doseGramsPerDay: 0, ramp: SUPPLEMENT_RAMP },
      vegetableOil: { dose: '', note: '' },
      fishOil: { dose: '' },
      saltGuidance: SALT_GUIDANCE,
      clinicalReviewRequired,
      disclaimers,
    };
  }

  const weightUsedKg = usesIdealWeight ? (input.idealWeightKg as number) : currentWeightKg;

  let percent: number;
  let mealsPerDay: string;

  if (input.lifeStage === 'puppy') {
    const band = input.puppyAgeBand ?? '6-8';
    const size = input.expectedAdultSize ?? 'medium';
    percent = tendencyPercent(PUPPY_RANGES[band][size], input.weightTendency);
    mealsPerDay = PUPPY_MEALS[band];
  } else {
    percent = tendencyPercent(adultRange(weightUsedKg), input.weightTendency);
    if (input.neutered) percent += NEUTERED_ADJUST;
    if (input.senior) percent += SENIOR_ADJUST;
    mealsPerDay = ADULT_MEALS;
  }

  percent += SEASON_ADJUST[input.season];
  percent = clamp(percent, PERCENT_MIN, PERCENT_MAX);

  let totalGramsPerDay = weightUsedKg * (percent / 100) * 1000;
  totalGramsPerDay = Math.round(totalGramsPerDay / 5) * 5;

  const groupsGramsPerDay: Record<FoodGroup, number> = {
    meat: (totalGramsPerDay * formulation.meat) / 100,
    organs: (totalGramsPerDay * formulation.organs) / 100,
    carb: (totalGramsPerDay * formulation.carb) / 100,
    vegetables: (totalGramsPerDay * formulation.vegetables) / 100,
  };

  const supp = SUPPLEMENTS[input.supplement];
  const isPuppy = input.lifeStage === 'puppy';
  const supplement = {
    id: input.supplement,
    name: isPuppy ? supp.puppyName : supp.adultName,
    doseGramsPerDay: (totalGramsPerDay / 100) * (isPuppy ? supp.puppyFactor : supp.adultFactor),
    ramp: SUPPLEMENT_RAMP,
  };

  return {
    engineVersion: ENGINE_VERSION,
    valid: true,
    validationErrors,
    weightUsedKg,
    currentWeightKg,
    goal: input.goal,
    percentOfWeight: percent,
    totalGramsPerDay,
    mealsPerDay,
    groupsGramsPerDay,
    formulation,
    treatsGramsPerDay: {
      min: totalGramsPerDay * TREATS_MIN_RATIO,
      max: totalGramsPerDay * TREATS_MAX_RATIO,
    },
    supplement,
    // Óleos seguem faixas de peso e usam sempre o peso ATUAL, mesmo em emagrecimento.
    vegetableOil: {
      dose: vegetableOilDose(currentWeightKg),
      note: vegetableOilNote(input.predominantProtein),
    },
    fishOil: { dose: fishOilDose(currentWeightKg) },
    saltGuidance: SALT_GUIDANCE,
    clinicalReviewRequired,
    disclaimers,
  };
}
