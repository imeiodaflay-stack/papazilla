/** Deriva nome de exibição, artigo e substantivo de um pet a partir do sexo informado. */
export interface PetLike {
  name?: string;
  sex?: string;
}

export function describePet(pet: PetLike | null | undefined) {
  const isFemale = pet?.sex === 'Fêmea';
  const noun = isFemale ? 'Monstrinha' : 'Monstrinho';
  const article = isFemale ? 'a' : 'o';
  const displayName = pet?.name || noun;
  return { isFemale, noun, article, displayName };
}
