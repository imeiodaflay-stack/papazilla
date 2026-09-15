/**
 * Condição corporal (Passo 3 da Anamnese) → Tendência de peso.
 *
 * O motor (`@papazilla/nutrition-engine`) já tem a alavanca certa pra isso —
 * `tendencyPercent()` em `packages/nutrition-engine/src/tables.ts` — só que
 * antes ela era alimentada por uma pergunta solta e vaga ("Tendência de
 * peso": Tende a engordar / Normal / Magro-ativo). Removida: em vez de pedir
 * pro tutor "sentir" a tendência, derivamos ela da avaliação física de 3
 * perguntas (visão de cima, costelas, barriga) que a Anamnese já fazia e
 * descartava. Não inventa nenhum ajuste percentual novo — só troca a fonte
 * de um valor que o motor já sabia usar, então `tables.ts` não muda (o aviso
 * lá sobre não alterar valores sem registrar a fonte continua valendo).
 *
 * Cada pergunta soma pontos negativos (magreza) ou positivos (sobrepeso); a
 * soma das 3 decide o resultado. Empates/sinais fracos caem em "Normal" —
 * só decide pra um extremo quando o conjunto das 3 respostas aponta claro
 * numa direção, não uma única resposta isolada.
 *
 * O "ideal" (nota 0) não é sempre a opção do meio: em "costelas" e "barriga",
 * a descrição padrão de condição saudável (referência WSAVA — "costelas
 * sentidas facilmente, sem camada de gordura por cima"; "cintura levemente
 * recolhida") é a 2ª das 5 opções, não a 3ª — diferente de "visão de cima",
 * onde "corpo proporcional" é mesmo o centro da escala. Por isso as notas
 * abaixo não são um -2..+2 simétrico por pergunta; refletem onde cada opção
 * realmente cai numa avaliação de escore corporal.
 */
const BODY_TOP_SCORE: Record<string, number> = {
  'Muito magro': -2,
  Magro: -1,
  'Corpo proporcional, com cintura visível': 0,
  'Um pouco acima do peso': 1,
  'Bem acima do peso': 2,
};

const RIBS_SCORE: Record<string, number> = {
  'Ficam muito aparentes': -2,
  'Consigo sentir facilmente': 0,
  'Consigo sentir, mas há uma camada de gordura': 1,
  'Preciso pressionar para sentir': 2,
  'Quase não consigo sentir': 2,
};

const BELLY_SCORE: Record<string, number> = {
  'Bem recolhida': -1,
  'Levemente recolhida': 0,
  'Quase reta': 1,
  Arredondada: 2,
  'Bem arredondada ou caída': 3,
};

export const WEIGHT_TENDENCY_LEAN = 'Magro(a) / muito ativo(a)';
export const WEIGHT_TENDENCY_NORMAL = 'Normal';
export const WEIGHT_TENDENCY_GAINS = 'Tende a engordar';

/** `bodyTop`/`ribs`/`belly` são os rótulos literais do Passo 3. Ausentes contam como 0 (neutro). */
export function deriveWeightTendency(bodyTop: string, ribs: string, belly: string): string {
  const score = (BODY_TOP_SCORE[bodyTop] ?? 0) + (RIBS_SCORE[ribs] ?? 0) + (BELLY_SCORE[belly] ?? 0);
  if (score <= -2) return WEIGHT_TENDENCY_LEAN;
  if (score >= 2) return WEIGHT_TENDENCY_GAINS;
  return WEIGHT_TENDENCY_NORMAL;
}
