import { describe, expect, it } from 'vitest';
import { calculateDailyPlan } from './daily-plan.js';
import { buildRecipe } from './recipe.js';
import type { DailyPlanInput, RecipeSelection } from './types.js';

const planInput: DailyPlanInput = {
  currentWeightKg: 12,
  goal: 'quality',
  lifeStage: 'adult',
  weightTendency: 'normal',
  season: 'mild',
  formulation: 'padrao',
  supplement: 'food-dog',
  predominantProtein: 'chicken-pork',
};

const plan = calculateDailyPlan(planInput);
// plan: total 540/dia, meat 189, organs 27, carb 189, vegetables 135

const emptySel: RecipeSelection = {
  proteins: [],
  organs: [],
  carbs: [],
  vegetables: [],
  herbs: [],
};

describe('buildRecipe — sem vísceras glandulares', () => {
  const recipe = buildRecipe({
    plan,
    days: 1,
    selection: { ...emptySel, proteins: ['frango_peito'], carbs: ['batata_doce'], vegetables: ['cenoura'] },
  });

  it('soma a cota de vísceras à proteína', () => {
    const proteinGroup = recipe.groups.find((g) => g.key === 'proteins')!;
    expect(proteinGroup.title).toContain('inclui vísceras');
    // 189 + 27 = 216 g prontos
    expect(proteinGroup.rows[0]!.cookedGrams).toBe(216);
    // cru = 216 / 0,75
    expect(proteinGroup.rows[0]!.rawGrams).toBeCloseTo(288, 5);
  });

  it('não cria grupo de vísceras', () => {
    expect(recipe.groups.some((g) => g.key === 'organs')).toBe(false);
  });

  it('aplica fatores de rendimento por grupo cru', () => {
    const carb = recipe.groups.find((g) => g.key === 'carbs')!.rows[0]!;
    expect(carb.cookedGrams).toBe(189);
    expect(carb.rawGrams).toBeCloseTo(189 * 0.95, 5); // tubérculo

    const veg = recipe.groups.find((g) => g.key === 'vegetables')!.rows[0]!;
    expect(veg.rawGrams).toBeCloseTo(135 * 1.1, 5); // legume
  });

  it('totaliza pronto e cru', () => {
    expect(recipe.totalCookedGrams).toBe(540);
    expect(recipe.cookedGramsPerDay).toBe(540);
    expect(recipe.totalRawGrams).toBeCloseTo(288 + 189 * 0.95 + 135 * 1.1, 4);
  });
});

describe('buildRecipe — com vísceras glandulares e múltiplos dias', () => {
  const recipe = buildRecipe({
    plan,
    days: 3,
    selection: {
      ...emptySel,
      proteins: ['frango_peito', 'boi_musculo'],
      organs: ['figado_bovino'],
      carbs: ['arroz_branco'],
      vegetables: ['cenoura'],
    },
  });

  it('mantém a cota de vísceras separada e divide a proteína igualmente', () => {
    const proteinGroup = recipe.groups.find((g) => g.key === 'proteins')!;
    expect(proteinGroup.title).toBe('Proteína');
    // 189 / 2 * 3 dias = 283,5
    expect(proteinGroup.rows[0]!.cookedGrams).toBeCloseTo(283.5, 5);
    expect(proteinGroup.rows[1]!.cookedGrams).toBeCloseTo(283.5, 5);

    const organ = recipe.groups.find((g) => g.key === 'organs')!.rows[0]!;
    expect(organ.cookedGrams).toBeCloseTo(81, 5); // 27 * 3
    expect(organ.rawGrams).toBeCloseTo(81 / 0.77, 4); // víscera glandular
  });

  it('multiplica o total pelos dias', () => {
    expect(recipe.totalCookedGrams).toBe(1620);
    expect(recipe.cookedGramsPerDay).toBe(540);
    expect(recipe.days).toBe(3);
  });

  it('grão que incha usa fator 1/2,85', () => {
    const carb = recipe.groups.find((g) => g.key === 'carbs')!.rows[0]!;
    expect(carb.cookedGrams).toBe(189 * 3);
    expect(carb.rawGrams).toBeCloseTo((189 * 3) / 2.85, 4);
  });
});

describe('buildRecipe — ervas', () => {
  const recipe = buildRecipe({
    plan,
    days: 5,
    selection: {
      ...emptySel,
      proteins: ['frango_peito'],
      carbs: ['batata_doce'],
      vegetables: ['cenoura'],
      herbs: ['salsinha', 'canela'],
    },
  });

  const herbs = recipe.groups.find((g) => g.key === 'herbs')!;

  it('não entram em gramas nem multiplicam pelos dias', () => {
    expect(herbs.rows.every((r) => r.cookedGrams === undefined)).toBe(true);
    expect(herbs.subtitle).toBeTruthy();
  });

  it('erva com fonte recebe dose escalada pelo total diário', () => {
    const salsinha = herbs.rows.find((r) => r.id === 'salsinha')!;
    // ratio 540/750 = 0,72 => 3,6 g seca / 10,8 g fresca
    expect(salsinha.note).toBe('até 3.6 g desidratada ou 10.8 g fresca picada');
  });

  it('erva sem fonte recebe nota genérica', () => {
    const canela = herbs.rows.find((r) => r.id === 'canela')!;
    expect(canela.note).toContain('pitada pequena');
  });
});

describe('buildRecipe — alertas contextuais', () => {
  const recipe = buildRecipe({
    plan,
    days: 1,
    selection: {
      ...emptySel,
      proteins: ['frango_moela', 'boi_lingua'],
      carbs: ['batata_doce'],
      vegetables: ['espinafre', 'abobora'],
    },
  });

  it('emite as notas de víscera muscular, língua, espinafre e intestino', () => {
    const codes = recipe.notes.map((n) => n.code).sort();
    expect(codes).toEqual(
      ['LOOSENS_INTESTINE', 'MUSCULAR_ORGANS', 'SPINACH_OXALATE', 'TONGUE_HIGH_FAT'].sort(),
    );
  });
});

describe('buildRecipe — limites e disclaimers', () => {
  it('fixa os dias entre 1 e 30', () => {
    const sel = { ...emptySel, proteins: ['frango_peito'], carbs: ['batata_doce'], vegetables: ['cenoura'] };
    expect(buildRecipe({ plan, days: 50, selection: sel }).days).toBe(30);
    expect(buildRecipe({ plan, days: 0, selection: sel }).days).toBe(1);
  });

  it('propaga o disclaimer clínico do plano', () => {
    const flaggedPlan = calculateDailyPlan({ ...planInput, healthConditionsPresent: true });
    const recipe = buildRecipe({
      plan: flaggedPlan,
      days: 1,
      selection: { ...emptySel, proteins: ['frango_peito'], carbs: ['batata_doce'], vegetables: ['cenoura'] },
    });
    expect(recipe.disclaimers[0]).toContain('ajustes clínicos');
  });
});
