/** Deriva nome de exibição, artigo e substantivo de um pet a partir do sexo informado. */
export interface PetLike {
  name?: string;
  sex?: string;
}

export function describePet(pet: PetLike | null | undefined) {
  const isFemale = pet?.sex === 'Fêmea';
  const noun = isFemale ? 'Monstrinha' : 'Monstrinho';
  const article = isFemale ? 'a' : 'o';
  const preposition = isFemale ? 'da' : 'do';
  const displayName = pet?.name || noun;
  return { isFemale, noun, article, preposition, displayName };
}

/** "Castrada"/"Castrado" (ou a negativa) concordando com o sexo informado. */
export function neuteredLabel(sex: string | undefined, neutered: string | undefined): string {
  const isFemale = sex === 'Fêmea';
  const affirmative = isFemale ? 'Castrada' : 'Castrado';
  const negative = isFemale ? 'Não castrada' : 'Não castrado';
  return neutered === 'Sim' ? affirmative : negative;
}

/** Versão curta do objetivo, para espaços apertados (cards de lista). */
const GOAL_SHORT: Record<string, string> = {
  'Manter o peso atual': 'Manter peso',
  Emagrecer: 'Emagrecer',
  'Ganhar peso': 'Ganhar peso',
  'Melhorar a qualidade da alimentação': 'Qualidade',
  'Ajudar a preservar músculos e disposição com a idade': 'Idade',
  'Apoiar uma condição de saúde': 'Saúde',
};

export function shortGoal(goal: string | undefined): string {
  if (!goal) return '—';
  return GOAL_SHORT[goal] ?? goal;
}

/** Junta uma lista em português: "a, b e c". */
export function joinPt(items: string[]): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0]!;
  return `${clean.slice(0, -1).join(', ')} e ${clean[clean.length - 1]}`;
}
