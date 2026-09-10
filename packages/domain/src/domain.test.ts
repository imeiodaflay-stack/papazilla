import { describe, expect, it } from 'vitest';
import { hasClinicalReviewCondition } from './anamnesis.js';
import { draftDailyPlanInput } from './anamnesis-to-plan.js';
import type { AnamnesisAnswers } from './anamnesis.js';

const answers: AnamnesisAnswers = {
  sex: 'female',
  neutered: true,
  birthDateOrAge: '4 anos',
  currentWeightKg: 12,
  goal: 'quality',
  bodyShapeTopView: 'proportional',
  ribFeel: 'easy',
  bellyProfile: 'slightly-tucked',
  muscleChanges: ['none'],
  recentWeightChange: 'stable',
  activityDuration: '40-60',
  activityIntensity: 'walks',
  appetite: 'normal',
  currentDiet: 'dry-kibble',
  currentMealsPerDay: '2',
  treatFrequency: '1-2-day',
  tableFood: 'sometimes',
  stoolConsistency: 'firm',
  stoolFrequency: '2-day',
  digestiveIssues: ['none'],
  healthConditions: ['none'],
  supplementsInUse: [],
  lastVetVisit: 'lt6m',
  bloodwork: 'normal',
  proteinsEatenWell: ['chicken', 'beef'],
  carbPreferences: ['rice'],
  vegetableFavorites: ['carrot'],
  cookingMethod: 'boiling',
  recipeFormatPreference: 'both',
  preferredMeals: 'recommend',
  disclaimerAcceptedAt: '2026-09-09T00:00:00.000Z',
};

describe('hasClinicalReviewCondition', () => {
  it('é falso para "none"', () => {
    expect(hasClinicalReviewCondition(['none'])).toBe(false);
  });
  it('é verdadeiro para condição clínica relevante', () => {
    expect(hasClinicalReviewCondition(['none', 'pancreatitis'])).toBe(true);
  });
});

describe('draftDailyPlanInput', () => {
  it('deriva só o que é inequívoco e lista o que falta resolver', () => {
    const draft = draftDailyPlanInput(answers);
    expect(draft.known.currentWeightKg).toBe(12);
    expect(draft.known.goal).toBe('quality');
    expect(draft.known.healthConditionsPresent).toBe(false);
    expect(draft.unresolved).toContain('lifeStage');
    expect(draft.unresolved).toContain('weightTendency');
  });

  it('passa o peso ideal só quando o objetivo é emagrecer', () => {
    const semIdeal = draftDailyPlanInput({ ...answers, goal: 'lose' });
    expect(semIdeal.known.idealWeightKg).toBeUndefined();

    const comIdeal = draftDailyPlanInput({ ...answers, goal: 'lose', idealWeightKg: 10 });
    expect(comIdeal.known.idealWeightKg).toBe(10);
  });
});
