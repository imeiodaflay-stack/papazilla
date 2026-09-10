import { describe, expect, it } from 'vitest';
import { calculateRecipeRequestSchema, dailyPlanInputSchema } from './index.js';

const validPlan = {
  currentWeightKg: 12,
  goal: 'quality',
  lifeStage: 'adult',
  weightTendency: 'normal',
  season: 'mild',
  formulation: 'padrao',
  supplement: 'food-dog',
  predominantProtein: 'chicken-pork',
};

describe('dailyPlanInputSchema', () => {
  it('aceita um plano adulto completo', () => {
    expect(dailyPlanInputSchema.safeParse(validPlan).success).toBe(true);
  });

  it('exige peso ideal quando o objetivo é emagrecer', () => {
    const r = dailyPlanInputSchema.safeParse({ ...validPlan, goal: 'lose' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'idealWeightKg')).toBe(true);
    }
  });

  it('exige faixa etária e porte para filhote', () => {
    const r = dailyPlanInputSchema.safeParse({ ...validPlan, lifeStage: 'puppy' });
    expect(r.success).toBe(false);
  });

  it('rejeita peso fora de faixa', () => {
    expect(dailyPlanInputSchema.safeParse({ ...validPlan, currentWeightKg: 0.1 }).success).toBe(false);
    expect(dailyPlanInputSchema.safeParse({ ...validPlan, currentWeightKg: 120 }).success).toBe(false);
  });
});

describe('calculateRecipeRequestSchema', () => {
  it('exige pelo menos uma proteína, um carbo e um vegetal, e dias entre 1 e 30', () => {
    const base = {
      planInput: validPlan,
      selection: { proteins: ['frango_peito'], organs: [], carbs: ['batata_doce'], vegetables: ['cenoura'], herbs: [] },
      days: 7,
    };
    expect(calculateRecipeRequestSchema.safeParse(base).success).toBe(true);
    expect(calculateRecipeRequestSchema.safeParse({ ...base, days: 40 }).success).toBe(false);
    expect(
      calculateRecipeRequestSchema.safeParse({ ...base, selection: { ...base.selection, proteins: [] } }).success,
    ).toBe(false);
  });
});
