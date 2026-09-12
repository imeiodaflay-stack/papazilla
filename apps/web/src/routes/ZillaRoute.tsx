import { hasPet } from '../lib/session.js';
import { listPets } from '../lib/petsStore.js';
import { ZillaScreen } from './ZillaScreen.js';
import { PetsListScreen } from './PetsListScreen.js';

/**
 * `/zilla` mostra a matilha quando já existe pet cadastrado e "hasPet" foi
 * ligado (fiel ao protótipo: nav "Pets" só abre a lista com `papazilla.hasPet`);
 * senão, o estado vazio "Sem Monstrinhos".
 */
export function ZillaRoute() {
  const pets = listPets();
  return hasPet() && pets.length > 0 ? <PetsListScreen pets={pets} /> : <ZillaScreen />;
}
