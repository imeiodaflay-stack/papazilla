import { hasPet } from '../lib/session.js';
import { PapaHubScreen } from './PapaHubScreen.js';
import { PapaScreen } from './PapaScreen.js';

/**
 * `/papa` mostra o Início recorrente quando já existe um Monstrinho cadastrado
 * (fiel ao protótipo: nav "Papá" → `home` só com `papazilla.hasPet`); sem pet,
 * mostra a amostra do motor (placeholder da Fase 0 até o wizard existir).
 */
export function PapaRoute() {
  return hasPet() ? <PapaHubScreen /> : <PapaScreen />;
}
