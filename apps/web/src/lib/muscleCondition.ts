/**
 * Musculatura (Passo 4 da Anamnese) → recomendação de formulação.
 *
 * A WSAVA trata escore de condição muscular (perda leve/moderada/grave) como
 * um eixo independente do escore de condição corporal — um cão pode estar
 * gordo e com perda de músculo ao mesmo tempo (ver `bodyCondition.ts`). A
 * literatura converge em: dietas com mais proteína preservam/recuperam massa
 * magra melhor do que dietas com menos proteína e mais carboidrato (fontes
 * no commit). O motor já tem a formulação certa pra isso — "mais-proteina"
 * (45% carnes / 25% carboidratos, contra 35/35 da padrão) — então aqui só
 * decidimos QUANDO recomendar essa formulação já existente, sem inventar
 * nenhum percentual novo.
 *
 * Decisão de produto (Flay, 2026-09): só perda **moderada** ou **bem
 * evidente** disparam a recomendação — "Pequena" fica sem efeito, pra não
 * reagir a um sinal fraco isolado. E é só uma recomendação visual no wizard
 * da receita: nunca troca a formulação escolhida sem o tutor confirmar.
 */
import type { StoredPet } from './petsStore.js';

const NO_SIGNAL = new Set(['Nenhuma dessas mudanças', 'Não sei avaliar']);
const SIGNIFICANT_SEVERITY = new Set(['Moderada', 'Bem evidente']);

export function hasSignificantMuscleLoss(
  pet: Pick<StoredPet, 'muscleChangeSigns' | 'muscleChangeSeverity'>,
): boolean {
  const hasRealSign = pet.muscleChangeSigns.some((sign) => !NO_SIGNAL.has(sign));
  return hasRealSign && SIGNIFICANT_SEVERITY.has(pet.muscleChangeSeverity);
}
