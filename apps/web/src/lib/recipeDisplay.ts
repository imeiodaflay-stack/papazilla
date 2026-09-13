/**
 * Helpers de apresentação compartilhados entre o wizard da receita
 * (`ReceitaScreen`) e a tela de detalhe de uma receita salva
 * (`RecipeDetailScreen`) — formatação de gramas, rótulos de formulação e
 * suplemento, e a ordenação do disclaimer clínico.
 */
import type { DailyPlan, FormulationId, RecipeRow, SupplementId } from '@papazilla/nutrition-engine';
import { FORMULATIONS, SUPPLEMENTS, findItem } from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import { joinPt } from './petLabel.js';

export const FORMULATION_LABELS: Record<FormulationId, string> = {
  padrao: 'Padrão',
  'mais-proteina': 'Mais proteína',
  intermediaria: 'Intermediária',
  'mais-visceras': 'Mais vísceras',
};

export const FORMULATION_ORDER: FormulationId[] = ['padrao', 'mais-proteina', 'intermediaria', 'mais-visceras'];

export function formulationSummary(id: FormulationId): string {
  const f = FORMULATIONS[id];
  return `${f.meat}% carnes · ${f.organs}% vísceras · ${f.carb}% carboidratos · ${f.vegetables}% vegetais`;
}

export const SUPPLEMENT_ORDER: SupplementId[] = ['food-dog', 'nutroplus'];

export const SUPPLEMENT_LABELS: Record<SupplementId, string> = {
  'food-dog': 'Food Dog',
  nutroplus: 'Nutroplus Manutenção',
};

export function supplementReference(id: SupplementId): string {
  const s = SUPPLEMENTS[id];
  return `${s.adultFactor.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} g para cada 100 g de comida pronta (adulto)`;
}

export function mealsCount(plan: DailyPlan): number {
  const match = /\d+/.exec(plan.mealsPerDay);
  return match ? Number(match[0]) : 2;
}

export function mealSize(plan: DailyPlan): number {
  return Math.round(plan.totalGramsPerDay / mealsCount(plan));
}

export function formatGrams(value: number): string {
  return `${Math.round(value).toLocaleString('pt-BR')} g`;
}

export function formatRowAmount(row: RecipeRow, format: string): string {
  const cookedTxt = row.cookedGrams !== undefined ? formatGrams(row.cookedGrams) : '';
  const rawTxt = row.rawGrams !== undefined ? formatGrams(row.rawGrams) : '';
  if (format === 'Quantidade dos alimentos crus') return rawTxt ? `≈ ${rawTxt} cru` : '—';
  if (format === 'Quantidade dos alimentos prontos') return cookedTxt ? `≈ ${cookedTxt} pronto` : '—';
  if (rawTxt && cookedTxt) return `≈ ${rawTxt} cru · ${cookedTxt} pronto`;
  return rawTxt ? `≈ ${rawTxt}` : cookedTxt ? `≈ ${cookedTxt}` : '—';
}

export function prepPortionsText(petPlans: { pet: StoredPet; plan: DailyPlan }[], days: number): string {
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

/**
 * O primeiro pet da lista pode não ser o que tem condição de saúde — não dá
 * pra assumir que o alerta clínico cai no índice 0 do flatMap de disclaimers.
 * Acha o plano que exige revisão e coloca o disclaimer dele (sempre o
 * primeiro do próprio array, por convenção de `daily-plan.ts`) na frente.
 */
export function orderDisclaimers(petPlans: { pet: StoredPet; plan: DailyPlan }[]): {
  ordered: string[];
  clinicalRequired: boolean;
} {
  const clinicalPlanEntry = petPlans.find(({ plan }) => plan.clinicalReviewRequired);
  const flatDisclaimers = [...new Set(petPlans.flatMap(({ plan }) => plan.disclaimers))];
  const ordered = clinicalPlanEntry
    ? [clinicalPlanEntry.plan.disclaimers[0]!, ...flatDisclaimers.filter((d) => d !== clinicalPlanEntry.plan.disclaimers[0])]
    : flatDisclaimers;
  return { ordered, clinicalRequired: Boolean(clinicalPlanEntry) };
}

function resolveLabels(ids: string[]): string[] {
  return ids.map((id) => findItem(id)?.label).filter((label): label is string => Boolean(label));
}

/**
 * Título curto pra uma receita salva: "{Proteína} com {Carboidrato}", no
 * mesmo formato dos exemplos do protótipo ("Frango com batata-doce"). É
 * derivado de verdade da seleção de ingredientes — não é um nome inventado.
 */
export function recipeTitle(selection: { proteins: string[]; carbs: string[] }): string {
  const proteins = resolveLabels(selection.proteins);
  const carbs = resolveLabels(selection.carbs);
  if (proteins.length === 0 && carbs.length === 0) return 'Receita';
  if (carbs.length === 0) return joinPt(proteins);
  if (proteins.length === 0) return joinPt(carbs);
  return `${joinPt(proteins)} com ${joinPt(carbs)}`;
}

/** Lista curta de ingredientes pra subtítulo, na ordem proteína→carbo→vegetal→víscera. */
export function recipeIngredientSummary(selection: {
  proteins: string[];
  carbs: string[];
  vegetables: string[];
  organs: string[];
}): string {
  const all = [
    ...resolveLabels(selection.proteins),
    ...resolveLabels(selection.carbs),
    ...resolveLabels(selection.vegetables),
    ...resolveLabels(selection.organs),
  ];
  return all.length > 0 ? `${all.join(', ')}.` : '';
}

/** "há 6 dias" / "há 2 semanas" / "há 1 mês" — mesmo estilo do protótipo pros cards de receita salva. */
export function relativeTimeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.floor(diffMs / 86_400_000));
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}
