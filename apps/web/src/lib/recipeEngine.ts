/**
 * Ponte entre o wizard da receita e `@papazilla/nutrition-engine`. Monta o
 * `DailyPlanInput` de cada pet a partir do que já foi salvo na Anamnese
 * (`engineMapping.ts`) e das escolhas feitas no próprio wizard (formulação,
 * suplemento, proteína predominante), e monta a base sintética compartilhada
 * quando a fornalha é para mais de um Monstrinho.
 */
import { buildRecipe, calculateDailyPlan } from '@papazilla/nutrition-engine';
import type {
  DailyPlan,
  DailyPlanInput,
  FoodGroup,
  FormulationId,
  PredominantProtein,
  Recipe,
  RecipeSelection,
  SupplementId,
} from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import {
  mapExpectedAdultSize,
  mapGoal,
  mapLifeStage,
  mapPuppyAgeBand,
  mapWeightTendency,
} from './engineMapping.js';

/** Converte "10", "10.5" ou "10,5" em número. `undefined` se não der pra interpretar. */
export function parseWeightKg(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export interface RecipeChoices {
  formulation: FormulationId;
  supplement: SupplementId;
  predominantProtein: PredominantProtein;
}

/**
 * `season` não é coletado em lugar nenhum hoje (gap documentado em
 * `auditoria-calculadora-original-vs-app.md`); fixado em "mild" (sem ajuste),
 * igual ao meio da faixa da calculadora original.
 */
const SEASON_DEFAULT = 'mild' as const;

export function buildDailyPlanInput(pet: StoredPet, choices: RecipeChoices): DailyPlanInput {
  const isPuppy = pet.lifeStage === 'Filhote';
  return {
    currentWeightKg: parseWeightKg(pet.weight) ?? 0,
    goal: mapGoal(pet.goal),
    idealWeightKg: pet.goal === 'Emagrecer' ? parseWeightKg(pet.idealWeight) : undefined,
    lifeStage: mapLifeStage(pet),
    puppyAgeBand: isPuppy ? mapPuppyAgeBand(pet) : undefined,
    expectedAdultSize: isPuppy ? mapExpectedAdultSize(pet) : undefined,
    weightTendency: mapWeightTendency(pet),
    neutered: pet.neutered === 'Sim',
    senior: pet.senior === 'Sim',
    season: SEASON_DEFAULT,
    formulation: choices.formulation,
    supplement: choices.supplement,
    predominantProtein: choices.predominantProtein,
    healthConditionsPresent: pet.healthConditions.length > 0,
  };
}

export function buildPetPlan(pet: StoredPet, choices: RecipeChoices): DailyPlan {
  return calculateDailyPlan(buildDailyPlanInput(pet, choices));
}

const FOOD_GROUPS: FoodGroup[] = ['meat', 'organs', 'carb', 'vegetables'];

/**
 * Base sintética pra fornalha compartilhada entre vários pets: soma os
 * grupos de gramas e o total diário de cada plano individual.
 * `buildRecipe` só lê `groupsGramsPerDay`, `totalGramsPerDay`, `mealsPerDay`
 * e `disclaimers` do plano (ver `recipe.ts`) — os demais campos aqui vêm do
 * primeiro pet só pra satisfazer o tipo `DailyPlan` e não são usados.
 */
export function buildSharedPlan(plans: DailyPlan[]): DailyPlan {
  const [first, ...rest] = plans;
  if (!first) throw new Error('buildSharedPlan requer ao menos um plano diário.');
  if (rest.length === 0) return first;

  const groupsGramsPerDay = FOOD_GROUPS.reduce<Record<FoodGroup, number>>(
    (acc, group) => {
      acc[group] = plans.reduce((sum, p) => sum + p.groupsGramsPerDay[group], 0);
      return acc;
    },
    { meat: 0, organs: 0, carb: 0, vegetables: 0 },
  );

  return {
    ...first,
    totalGramsPerDay: plans.reduce((sum, p) => sum + p.totalGramsPerDay, 0),
    groupsGramsPerDay,
    treatsGramsPerDay: {
      min: plans.reduce((sum, p) => sum + p.treatsGramsPerDay.min, 0),
      max: plans.reduce((sum, p) => sum + p.treatsGramsPerDay.max, 0),
    },
    clinicalReviewRequired: plans.some((p) => p.clinicalReviewRequired),
    disclaimers: [...new Set(plans.flatMap((p) => p.disclaimers))],
  };
}

export function buildSharedRecipe(plans: DailyPlan[], selection: RecipeSelection, days: number): Recipe {
  return buildRecipe({ plan: buildSharedPlan(plans), selection, days });
}
