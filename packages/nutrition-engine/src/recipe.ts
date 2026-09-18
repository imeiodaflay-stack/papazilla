import { findItem } from './catalog.js';
import { HERB_UNSOURCED_NOTE, herbDoseNote, rawFromCooked } from './tables.js';
import type {
  CatalogItem,
  Recipe,
  RecipeGroup,
  RecipeInput,
  RecipeNote,
  RecipeRow,
} from './types.js';
import { ENGINE_VERSION } from './version.js';

export const RECIPE_DAYS_MIN = 1;
export const RECIPE_DAYS_MAX = 30;

const HERBS_SUBTITLE =
  'Passo opcional: a receita continua completa sem nenhuma erva. Não entram no total de gramas ' +
  'nem são multiplicadas pelos dias — é uma dose por dia de comida, para temperar a porção na hora de servir.';

function clampDays(days: number): number {
  const d = Math.round(days || 1);
  return Math.max(RECIPE_DAYS_MIN, Math.min(RECIPE_DAYS_MAX, d));
}

function resolve(ids: string[]): CatalogItem[] {
  return ids.map((id) => findItem(id)).filter((it): it is CatalogItem => Boolean(it));
}

function portionRows(items: CatalogItem[], cookedEach: number, days: number): RecipeRow[] {
  return items.map((it) => {
    const cookedGrams = cookedEach * days;
    return {
      id: it.id,
      label: it.label,
      cookedGrams,
      rawGrams: rawFromCooked(cookedGrams, it.rawGroup),
    };
  });
}

function buildNotes(proteins: CatalogItem[], vegetables: CatalogItem[]): RecipeNote[] {
  const notes: RecipeNote[] = [];

  if (proteins.some((it) => it.muscularOrgan)) {
    notes.push({
      code: 'MUSCULAR_ORGANS',
      text:
        'Vísceras musculares na receita (moela, coração, pulmão, bucho). Enriquecem a dieta e a ' +
        'maioria dos cães adora. Referência: até 1/3 da porção diária de carne nelas, 3x por semana ' +
        'ou até diariamente se o cão tolerar bem. Aumente aos poucos e observe fezes e vômitos.',
    });
  }
  if (proteins.some((it) => it.highFat)) {
    notes.push({
      code: 'TONGUE_HIGH_FAT',
      text:
        'Atenção com a língua: é víscera muscular, mas com teor de gordura muito alto. Não ultrapasse ' +
        '1/3 do total de carne da dieta com língua e sirva com pouca frequência.',
    });
  }
  if (vegetables.some((it) => it.vegAlert)) {
    notes.push({
      code: 'SPINACH_OXALATE',
      text:
        'Espinafre: ofereça até 2x por semana, cortado bem fino e cozido em água com a panela ' +
        'destampada, para reduzir a formação de cristais de ácido oxálico em cães predispostos.',
    });
  }
  if (vegetables.some((it) => it.vegLoosens)) {
    notes.push({
      code: 'LOOSENS_INTESTINE',
      text:
        'Abóbora e quiabo ajudam a soltar o intestino: use no máximo 5% da porção ' +
        'diária de vegetais com esses itens.',
    });
  }
  return notes;
}

/**
 * Monta a receita a partir de um plano diário e das seleções de ingredientes.
 * Port fiel de `computeRecipeResult()` de `calculadora-an-cozida.html`.
 *
 * Regras preservadas:
 * - Sem vísceras glandulares selecionadas, a cota de vísceras é somada à proteína.
 * - Cada grupo é dividido em partes iguais entre os ingredientes escolhidos.
 * - Ervas não entram em gramas nem são multiplicadas pelos dias.
 */
export function buildRecipe(input: RecipeInput): Recipe {
  const { plan, selection } = input;
  const days = clampDays(input.days);

  const proteins = resolve(selection.proteins);
  const organs = resolve(selection.organs);
  const carbs = resolve(selection.carbs);
  const vegetables = resolve(selection.vegetables);
  const herbs = resolve(selection.herbs);

  const groups: RecipeGroup[] = [];

  const organsMergedIntoProtein = organs.length === 0;
  const proteinPool =
    plan.groupsGramsPerDay.meat + (organsMergedIntoProtein ? plan.groupsGramsPerDay.organs : 0);

  if (proteins.length > 0) {
    groups.push({
      key: 'proteins',
      title: organsMergedIntoProtein ? 'Proteína (inclui vísceras de hoje)' : 'Proteína',
      rows: portionRows(proteins, proteinPool / proteins.length, days),
    });
  }

  if (organs.length > 0) {
    groups.push({
      key: 'organs',
      title: 'Vísceras',
      rows: portionRows(organs, plan.groupsGramsPerDay.organs / organs.length, days),
    });
  }

  if (carbs.length > 0) {
    groups.push({
      key: 'carbs',
      title: 'Carboidratos',
      rows: portionRows(carbs, plan.groupsGramsPerDay.carb / carbs.length, days),
    });
  }

  if (vegetables.length > 0) {
    groups.push({
      key: 'vegetables',
      title: 'Vegetais',
      rows: portionRows(vegetables, plan.groupsGramsPerDay.vegetables / vegetables.length, days),
    });
  }

  if (herbs.length > 0) {
    groups.push({
      key: 'herbs',
      title: 'Ervas e especiarias (100% opcional)',
      subtitle: HERBS_SUBTITLE,
      rows: herbs.map((it) => ({
        id: it.id,
        label: it.label,
        note: it.sourced ? herbDoseNote(plan.totalGramsPerDay) : HERB_UNSOURCED_NOTE,
      })),
    });
  }

  const totalRawGrams = groups.reduce(
    (sum, g) => sum + g.rows.reduce((s, row) => s + (row.rawGrams ?? 0), 0),
    0,
  );

  return {
    engineVersion: ENGINE_VERSION,
    days,
    mealsPerDay: plan.mealsPerDay,
    groups,
    totalCookedGrams: plan.totalGramsPerDay * days,
    cookedGramsPerDay: plan.totalGramsPerDay,
    totalRawGrams,
    notes: buildNotes(proteins, vegetables),
    disclaimers: plan.disclaimers,
  };
}
