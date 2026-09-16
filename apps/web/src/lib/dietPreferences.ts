/**
 * Preferências alimentares (Passos 15, 16 e 17 da Anamnese) → avisos na receita.
 *
 * O motor escolhe os alimentos pela formulação/catálogo, sem saber o que o
 * tutor disse que o cão adora ou não tolera. Aqui só cruzamos os rótulos dos
 * itens que a receita efetivamente selecionou com o que foi informado na
 * Anamnese, pra avisar — nunca pra trocar a seleção do motor. Vegetais e
 * favoritos usam os mesmos rótulos do catálogo (`catalog.ts`), então dá pra
 * comparar direto; proteínas e carboidratos da Anamnese são categorias mais
 * largas ("Carne bovina", "Arroz") do que os itens do catálogo ("Músculo
 * bovino", "Arroz integral"), então usamos palavras-chave por categoria.
 * Evitar/intolerância são texto livre — comparamos por palavra normalizada
 * (sem acento, minúsculo) contra o rótulo do item.
 */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const PROTEIN_KEYWORDS: Record<string, string[]> = {
  Frango: ['frango'],
  'Carne bovina': ['bovin', 'boi '],
  'Carne suína': ['suin', 'porco'],
  Peixe: ['peixe', 'sardinha'],
  Ovo: ['ovo'],
  Peru: ['peru'],
};

const CARB_KEYWORDS: Record<string, string[]> = {
  Arroz: ['arroz'],
  'Batata-doce': ['batata-doce'],
  Mandioca: ['mandioca '],
  Inhame: ['inhame'],
  Aveia: ['aveia'],
};

function labelMatchesKeywords(label: string, keywords: string[]): boolean {
  const normalizedLabel = `${normalize(label)} `;
  return keywords.some((keyword) => normalizedLabel.includes(normalize(keyword)));
}

function matchByCategory(
  rowLabels: string[],
  selections: string[],
  keywordMap: Record<string, string[]>,
): string[] {
  const matched = new Set<string>();
  for (const selection of selections) {
    const keywords = keywordMap[selection];
    if (!keywords) continue;
    for (const label of rowLabels) {
      if (labelMatchesKeywords(label, keywords)) matched.add(label);
    }
  }
  return [...matched];
}

function matchByExactLabel(rowLabels: string[], favorites: string[]): string[] {
  const wanted = new Set(favorites.map(normalize));
  return rowLabels.filter((label) => wanted.has(normalize(label)));
}

/** Sinônimos do dia a dia que não aparecem literalmente nos rótulos do catálogo. */
const WORD_SYNONYMS: Record<string, string[]> = {
  porco: ['suin'],
  boi: ['bovin'],
  vaca: ['bovin'],
  peixe: ['sardinha'],
};

/** Texto livre (evitar/intolerância) contra rótulos — por palavra, não substring cega. */
function matchesFreeText(label: string, freeText: string): boolean {
  const words = normalize(freeText)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return false;
  const normalizedLabel = normalize(label);
  return words.some(
    (word) =>
      normalizedLabel.includes(word) ||
      (WORD_SYNONYMS[word]?.some((synonym) => normalizedLabel.includes(synonym)) ?? false),
  );
}

export interface DietPreferenceMatches {
  liked: string[];
  avoided: string[];
}

export function matchDietPreferences(
  pet: {
    proteins: string[];
    vegetableFavorites: string[];
    carbs: string[];
    avoidProteinName: string;
    avoidVegetableName: string;
    intoleranceName: string;
  },
  rowLabels: string[],
): DietPreferenceMatches {
  const liked = new Set<string>([
    ...matchByCategory(rowLabels, pet.proteins, PROTEIN_KEYWORDS),
    ...matchByExactLabel(rowLabels, pet.vegetableFavorites),
    ...matchByCategory(rowLabels, pet.carbs, CARB_KEYWORDS),
  ]);

  const avoided = new Set<string>();
  for (const freeText of [pet.avoidProteinName, pet.avoidVegetableName, pet.intoleranceName]) {
    if (!freeText.trim()) continue;
    for (const label of rowLabels) {
      if (matchesFreeText(label, freeText)) avoided.add(label);
    }
  }

  return { liked: [...liked], avoided: [...avoided] };
}
