/**
 * Preferências alimentares (Anamnese, passos 15 e 17) → lembretes no wizard
 * da receita. Não pré-seleciona nem bloqueia nada — o tutor decide os
 * ingredientes; isso só evita que ele esqueça o que já contou sobre o cão.
 * Proteína/vegetal a evitar e intolerância são texto livre, então não dá pra
 * cruzar com o catálogo com segurança — aparecem como lembrete geral, não
 * por item (diferente dos favoritos de carboidrato/vegetal, que são
 * pré-selecionados por id em `engineMapping.ts`).
 */
import type { StoredPet } from './petsStore.js';

export interface PetReminder {
  pet: StoredPet;
  text: string;
}

function proteinReminderText(pet: StoredPet): string | null {
  const parts: string[] = [];
  if (pet.avoidProtein === 'Sim' && pet.avoidProteinName.trim()) parts.push(`prefere evitar ${pet.avoidProteinName.trim()}`);
  if (pet.intolerance === 'Sim' && pet.intoleranceName.trim()) parts.push(`não tolera bem ${pet.intoleranceName.trim()}`);
  return parts.length > 0 ? parts.join(' e ') : null;
}

export function proteinReminders(pets: StoredPet[]): PetReminder[] {
  return pets
    .map((pet) => {
      const text = proteinReminderText(pet);
      return text ? { pet, text } : null;
    })
    .filter((r): r is PetReminder => r !== null);
}

export function vegetableReminders(pets: StoredPet[]): PetReminder[] {
  return pets
    .map((pet) => {
      if (pet.avoidVegetable !== 'Sim' || !pet.avoidVegetableName.trim()) return null;
      return { pet, text: `evitar ${pet.avoidVegetableName.trim()}` };
    })
    .filter((r): r is PetReminder => r !== null);
}
