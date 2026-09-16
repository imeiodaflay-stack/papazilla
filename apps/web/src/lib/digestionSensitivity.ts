/**
 * Digestão (Passo 10 da Anamnese) → força os avisos de ingrediente que já
 * existem no motor (`RecipeNote` em `recipe.ts`). O motor não sabe nada sobre
 * o histórico digestivo do cão — só sinaliza o ingrediente em si (vísceras
 * musculares, vegetais que soltam o intestino). Aqui cruzamos esses códigos
 * com sinais de sensibilidade digestiva da Anamnese pra tornar o aviso mais
 * específico quando for relevante pro cão, sem inventar nenhum novo dado
 * nutricional — só reforça o texto que o motor já gera.
 */
import type { StoredPet } from './petsStore.js';
import type { RecipeNote } from '@papazilla/nutrition-engine';

const LOOSE_STOOL = new Set(['Muito moles', 'Líquidas']);
const SENSITIVE_SIGNS = new Set(['Diarreia recorrente', 'Muco nas fezes', 'Vômitos', 'Regurgitação ou refluxo']);

export function hasDigestiveSensitivity(pet: Pick<StoredPet, 'stool' | 'digestionSigns'>): boolean {
  return LOOSE_STOOL.has(pet.stool) || pet.digestionSigns.some((sign) => SENSITIVE_SIGNS.has(sign));
}

const STRENGTHENED_CODES = new Set<RecipeNote['code']>(['MUSCULAR_ORGANS', 'LOOSENS_INTESTINE', 'TONGUE_HIGH_FAT']);

export function digestionContextFor(note: RecipeNote, sensitivePetNames: string[]): string | null {
  if (sensitivePetNames.length === 0 || !STRENGTHENED_CODES.has(note.code)) return null;
  const names = sensitivePetNames.join(', ');
  return `Você contou na Anamnese que a digestão de ${names} já dá sinais de sensibilidade — vale introduzir esse item aos poucos, em pouca quantidade, e observar as fezes nos dias seguintes.`;
}
