import { hasPet } from '../lib/session.js';
import { listPets } from '../lib/petsStore.js';
import { ZillaScreen } from './ZillaScreen.js';
import { PetsListScreen } from './PetsListScreen.js';
import { PetDetailScreen } from './PetDetailScreen.js';

/**
 * `/zilla` abre diretamente o perfil quando existe um único pet. Com dois ou
 * mais, mostra a matilha; sem pets, mantém o estado vazio.
 */
export function ZillaRoute() {
  const pets = listPets();
  if (!hasPet() || pets.length === 0) return <ZillaScreen />;
  if (pets.length === 1) return <PetDetailScreen petIdOverride={pets[0]!.id} isSinglePetRoot />;
  return <PetsListScreen pets={pets} />;
}
