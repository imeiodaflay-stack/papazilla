/**
 * Codifica/decodifica a configuração de uma Original (pets, dias, refeições
 * por pet) na query string da própria URL do resultado — em vez de só
 * `location.state`, que se perde ao recarregar a página ou abrir o link
 * direto (ver handover 2026-09-23 do Codex, "Limitações técnicas").
 */
export function buildResultParams(selectedPetIds: Set<string>, days: number, mealOverrides: Record<string, number>): string {
  const params = new URLSearchParams();
  params.set('pets', [...selectedPetIds].join(','));
  params.set('days', String(days));
  const mealsEntries = Object.entries(mealOverrides);
  if (mealsEntries.length > 0) params.set('meals', mealsEntries.map(([id, count]) => `${id}:${count}`).join(','));
  return params.toString();
}

export interface ParsedResultParams {
  selectedPetIds: string[];
  days: number | null;
  mealOverrides: Record<string, number>;
}

export function parseResultParams(searchParams: URLSearchParams): ParsedResultParams {
  const petsParam = searchParams.get('pets');
  const selectedPetIds = petsParam ? petsParam.split(',').filter(Boolean) : [];

  const daysParam = searchParams.get('days');
  const daysNumber = daysParam ? Number(daysParam) : NaN;
  const days = Number.isFinite(daysNumber) && daysNumber > 0 ? daysNumber : null;

  const mealOverrides: Record<string, number> = {};
  const mealsParam = searchParams.get('meals');
  if (mealsParam) {
    for (const pair of mealsParam.split(',')) {
      const [id, countText] = pair.split(':');
      const count = Number(countText);
      if (id && Number.isFinite(count) && count > 0) mealOverrides[id] = count;
    }
  }

  return { selectedPetIds, days, mealOverrides };
}
