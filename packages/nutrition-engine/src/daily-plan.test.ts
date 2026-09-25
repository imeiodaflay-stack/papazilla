import { describe, expect, it } from 'vitest';
import { calculateDailyPlan } from './daily-plan.js';
import { ENGINE_VERSION } from './version.js';
import type { DailyPlanInput } from './types.js';

const base: DailyPlanInput = {
  currentWeightKg: 12,
  goal: 'quality',
  lifeStage: 'adult',
  weightTendency: 'normal',
  season: 'mild',
  formulation: 'padrao',
  supplement: 'food-dog',
  predominantProtein: 'chicken-pork',
};

describe('calculateDailyPlan — adulto padrão', () => {
  const plan = calculateDailyPlan(base);

  it('reporta a versão do motor', () => {
    expect(plan.engineVersion).toBe(ENGINE_VERSION);
    expect(ENGINE_VERSION).toBe('1.1.0');
  });

  it('12 kg adulto normal => 4,5% e 540 g/dia', () => {
    expect(plan.valid).toBe(true);
    expect(plan.percentOfWeight).toBe(4.5);
    expect(plan.totalGramsPerDay).toBe(540);
    expect(plan.weightUsedKg).toBe(12);
    expect(plan.mealsPerDay).toBe('2');
  });

  it('divide os grupos pela proporção padrão 35/5/35/25', () => {
    expect(plan.groupsGramsPerDay).toEqual({
      meat: 189,
      organs: 27,
      carb: 189,
      vegetables: 135,
    });
  });

  it('calcula petiscos entre 10% e 15% do total', () => {
    expect(plan.treatsGramsPerDay).toEqual({ min: 54, max: 81 });
  });

  it('dose de Food Dog Adulto = 0,8 g por 100 g de AN', () => {
    expect(plan.supplement.name).toBe('Food Dog Adulto');
    expect(plan.supplement.doseGramsPerDay).toBeCloseTo(4.32, 5);
  });

  it('óleos seguem a faixa de peso', () => {
    expect(plan.vegetableOil.dose).toBe('1 colher de sobremesa, 1x ao dia');
    expect(plan.vegetableOil.note).toContain('Azeite de oliva');
    expect(plan.fishOil.dose).toBe('1 cápsula de 1g, diária ou 3x/semana');
  });

  it('não exige revisão clínica sem condição de saúde informada', () => {
    expect(plan.clinicalReviewRequired).toBe(false);
    expect(plan.disclaimers.some((d) => d.includes('ajustes clínicos'))).toBe(false);
  });
});

describe('calculateDailyPlan — objetivo emagrecer', () => {
  it('sem peso ideal => inválido com IDEAL_WEIGHT_REQUIRED', () => {
    const plan = calculateDailyPlan({ ...base, goal: 'lose' });
    expect(plan.valid).toBe(false);
    expect(plan.validationErrors).toEqual(['IDEAL_WEIGHT_REQUIRED']);
    expect(plan.totalGramsPerDay).toBe(0);
  });

  it('usa o peso ideal na comida e o peso atual nos óleos', () => {
    const plan = calculateDailyPlan({
      ...base,
      goal: 'lose',
      currentWeightKg: 14,
      idealWeightKg: 10,
    });
    expect(plan.valid).toBe(true);
    expect(plan.weightUsedKg).toBe(10);
    // adultRange(10) => [4,6], mid 5% => 10 * 0.05 * 1000 = 500
    expect(plan.percentOfWeight).toBe(5);
    expect(plan.totalGramsPerDay).toBe(500);
    // óleos usam o peso atual (14 kg)
    expect(plan.vegetableOil.dose).toBe('1 colher de sobremesa, 1x ao dia');
    expect(plan.fishOil.dose).toBe('1 cápsula de 1g, diária ou 3x/semana');
  });
});

describe('calculateDailyPlan — objetivo ganhar peso', () => {
  it('sem peso meta => inválido com IDEAL_WEIGHT_REQUIRED', () => {
    const plan = calculateDailyPlan({ ...base, goal: 'gain' });
    expect(plan.valid).toBe(false);
    expect(plan.validationErrors).toEqual(['IDEAL_WEIGHT_REQUIRED']);
  });

  it('usa o peso meta (maior que o atual) na comida e o peso atual nos óleos', () => {
    const plan = calculateDailyPlan({
      ...base,
      goal: 'gain',
      currentWeightKg: 10,
      idealWeightKg: 14,
    });
    expect(plan.valid).toBe(true);
    expect(plan.weightUsedKg).toBe(14);
    // adultRange(14) => [4,5], mid 4.5% => 14 * 0.045 * 1000 = 630
    expect(plan.percentOfWeight).toBe(4.5);
    expect(plan.totalGramsPerDay).toBe(630);
    // mais comida que se usasse o peso atual (630 > 450 = 10*0.045*1000)
    expect(plan.totalGramsPerDay).toBeGreaterThan(10 * 0.045 * 1000);
    // óleos usam o peso atual (10 kg)
    expect(plan.vegetableOil.dose).toBe('1 colher de sobremesa, 1x ao dia');
  });
});

describe('calculateDailyPlan — ajustes', () => {
  it('castrado (-0,5) e idoso (+0,5) se cancelam', () => {
    const plan = calculateDailyPlan({
      ...base,
      currentWeightKg: 20,
      goal: 'maintain',
      neutered: true,
      senior: true,
    });
    // adultRange(20) => [4,5] mid 4.5; -0.5 +0.5 => 4.5
    expect(plan.percentOfWeight).toBe(4.5);
    expect(plan.totalGramsPerDay).toBe(900);
  });

  it('inverno soma 0,25 ponto percentual', () => {
    const plan = calculateDailyPlan({ ...base, season: 'winter' });
    expect(plan.percentOfWeight).toBe(4.75);
    expect(plan.totalGramsPerDay).toBe(570);
  });

  it('verão subtrai 0,25 ponto percentual', () => {
    const plan = calculateDailyPlan({ ...base, season: 'summer' });
    expect(plan.percentOfWeight).toBe(4.25);
    // 12 * 0.0425 * 1000 = 510
    expect(plan.totalGramsPerDay).toBe(510);
  });
});

describe('calculateDailyPlan — filhote', () => {
  it('2–4 meses porte médio => 10% e 3–4 refeições', () => {
    const plan = calculateDailyPlan({
      ...base,
      currentWeightKg: 3,
      lifeStage: 'puppy',
      puppyAgeBand: '2-4',
      expectedAdultSize: 'medium',
      neutered: true, // ignorado para filhote
    });
    expect(plan.percentOfWeight).toBe(10);
    expect(plan.totalGramsPerDay).toBe(300);
    expect(plan.mealsPerDay).toBe('3–4');
  });

  it('usa a dose de suplemento de filhote', () => {
    const plan = calculateDailyPlan({
      ...base,
      currentWeightKg: 3,
      lifeStage: 'puppy',
      puppyAgeBand: '2-4',
      expectedAdultSize: 'medium',
    });
    expect(plan.supplement.name).toBe('Food Dog Filhotes');
    // (300 / 100) * 2.5
    expect(plan.supplement.doseGramsPerDay).toBeCloseTo(7.5, 5);
  });
});

describe('calculateDailyPlan — condição de saúde', () => {
  it('liga revisão clínica sem alterar a matemática', () => {
    const plain = calculateDailyPlan(base);
    const flagged = calculateDailyPlan({ ...base, healthConditionsPresent: true });
    expect(flagged.clinicalReviewRequired).toBe(true);
    expect(flagged.disclaimers[0]).toContain('ajustes clínicos');
    expect(flagged.totalGramsPerDay).toBe(plain.totalGramsPerDay);
    expect(flagged.groupsGramsPerDay).toEqual(plain.groupsGramsPerDay);
  });
});
