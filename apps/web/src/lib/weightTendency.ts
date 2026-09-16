/**
 * Condição corporal (Passo 3) + Atividade (Passo 6) → Tendência de peso.
 *
 * O motor (`@papazilla/nutrition-engine`) já tem a alavanca certa pra isso —
 * `tendencyPercent()` em `packages/nutrition-engine/src/tables.ts` — só que
 * antes ela era alimentada por uma pergunta solta e vaga ("Tendência de
 * peso": Tende a engordar / Normal / **Magro-muito ativo**). O próprio rótulo
 * da calculadora original já juntava corpo e atividade num sinal só —
 * confirmado em `auditoria-calculadora-original-vs-app.md`: "Atividade e
 * corpo são coletados, mas não existe mapeamento aprovado para essa regra".
 * Esta função é esse mapeamento: cinco perguntas que a Anamnese já fazia e
 * descartava (visão de cima, costelas, barriga, tempo e tipo de atividade)
 * alimentam o mesmo placar. Não inventa nenhum ajuste percentual novo — só
 * troca a fonte de um valor que o motor já sabia usar, então `tables.ts` não
 * muda (o aviso lá sobre não alterar valores sem registrar a fonte continua
 * valendo).
 *
 * Cada pergunta soma pontos negativos (mais faminto — magro ou muito ativo,
 * mesma direção) ou positivos (menos faminto — acima do peso ou sedentário);
 * a soma de todas decide o resultado. Um único sinal claramente forte numa
 * pergunta (ex.: "Bem acima do peso" ou "Mais de 2 horas" de atividade) já
 * basta sozinho — é sinal real, não ruído. Sinais fracos isolados (ex.: só
 * "Um pouco acima do peso", nota 1) não bastam sozinhos; caem em "Normal".
 *
 * O "ideal" (nota 0) não é sempre a opção do meio: em "costelas" e "barriga",
 * a descrição padrão de condição saudável (referência WSAVA — "costelas
 * sentidas facilmente, sem camada de gordura por cima"; "cintura levemente
 * recolhida") é a 2ª das 5 opções, não a 3ª — diferente de "visão de cima",
 * onde "corpo proporcional" é mesmo o centro da escala. Em atividade, o
 * padrão da Anamnese ("40 a 60 minutos" / "Brincadeiras ativas") já pende
 * levemente pro lado ativo, de propósito — reflete um cão saudável comum,
 * não um sedentário.
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

/** Mais tempo de atividade por dia = mais faminto (nota negativa, mesma direção de "magro"). */
const ACTIVITY_TIME_SCORE: Record<string, number> = {
  'Menos de 20 minutos': 2,
  '20 a 40 minutos': 1,
  '40 a 60 minutos': 0,
  '1 a 2 horas': -1,
  'Mais de 2 horas': -2,
};

/** Intensidade da atividade — mesma direção do tempo. */
const ACTIVITY_TYPE_SCORE: Record<string, number> = {
  'Quase nenhuma atividade': 2,
  'Passeios bem tranquilos': 1,
  Caminhadas: 0,
  'Brincadeiras ativas': -1,
  'Corridas ou atividade intensa': -2,
  'Esporte ou trabalho': -3,
};

export const WEIGHT_TENDENCY_LEAN = 'Magro(a) / muito ativo(a)';
export const WEIGHT_TENDENCY_NORMAL = 'Normal';
export const WEIGHT_TENDENCY_GAINS = 'Tende a engordar';

/** Todos os parâmetros são rótulos literais dos Passos 3 e 6. Ausentes contam como 0 (neutro). */
export function deriveWeightTendency(
  bodyTop: string,
  ribs: string,
  belly: string,
  activityTime: string,
  activityType: string,
): string {
  const score =
    (BODY_TOP_SCORE[bodyTop] ?? 0) +
    (RIBS_SCORE[ribs] ?? 0) +
    (BELLY_SCORE[belly] ?? 0) +
    (ACTIVITY_TIME_SCORE[activityTime] ?? 0) +
    (ACTIVITY_TYPE_SCORE[activityType] ?? 0);
  if (score <= -2) return WEIGHT_TENDENCY_LEAN;
  if (score >= 2) return WEIGHT_TENDENCY_GAINS;
  return WEIGHT_TENDENCY_NORMAL;
}
