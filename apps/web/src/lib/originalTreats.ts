import type { DailyPlan } from '@papazilla/nutrition-engine';

/**
 * Receitas dos petiscos Originals (Flay, 2026-09-30). Cada uma parte de uma
 * leva de referência da fonte original e é escalada pelo limite de petisco
 * do(s) cão(es) no período escolhido.
 *
 * `energyFactor` ajusta o limite diário de petisco do motor, que é em gramas
 * de comida (10 a 15% do total diário). Petisco mais denso em calorias que a
 * comida entra com fator menor, pra não passar do teto em energia:
 * - Snack Pá-pum (frango e ovo assados, sem água): ≈ 1,9 kcal/g → 0,75
 * - Chips de banana (desidratada, açúcar concentrado): ≈ 3,4 kcal/g → 0,4
 * - Frozen e Gelatina (muita água): ≈ 0,6–0,9 kcal/g → 1
 * Estimativas de Claude a partir de tabelas de composição; entram na revisão
 * nutricional junto com o resto.
 */
export interface TreatIngredient {
  id: string;
  label: string;
  /** Quantidade na leva de referência. */
  amount: number;
  unit: 'g' | 'ml' | 'pitada';
  /** Dica caseira mostrada abaixo da quantidade, recebe a quantidade já escalada. */
  hint?: (scaled: number) => string | null;
  /** Não se compra: sai do próprio preparo (ex.: caldo do cozimento). */
  fromPrep?: boolean;
}

export interface TreatFormula {
  ingredients: TreatIngredient[];
  /** Peso do petisco pronto na leva de referência. */
  yieldGrams: number;
  energyFactor: number;
  /** Validade que limita o tamanho do lote (ex.: só geladeira). */
  maxBatchDays?: number;
  /** Peso aproximado de cada unidade pronta, pra dizer quantas rende. */
  unitGrams?: number;
  unitLabel?: [string, string];
  steps: { title: string; text: string }[];
  storage: string[];
  cautions: string[];
  source: string;
}

const eggs = (grams: number) => {
  const count = Math.max(0.5, Math.round((grams / 50) * 2) / 2);
  const text = count.toLocaleString('pt-BR');
  return `≈ ${text} ${count <= 1 ? 'ovo' : 'ovos'}`;
};
const bananas = (grams: number) => {
  const count = Math.max(1, Math.round(grams / 120));
  return `≈ ${count} ${count === 1 ? 'banana média' : 'bananas médias'}`;
};
const spoonsOfGelatin = (grams: number) => {
  const spoons = Math.max(0.5, Math.round((grams / 7) * 2) / 2);
  return `≈ ${spoons.toLocaleString('pt-BR')} colher${spoons > 1 ? 'es' : ''} de sopa`;
};

export const TREAT_FORMULAS: Record<string, TreatFormula> = {
  'snack-pa-pum': {
    ingredients: [
      { id: 'frango', label: 'Peito de frango cru, sem pele e sem tempero', amount: 140, unit: 'g' },
      { id: 'ovo', label: 'Ovo', amount: 50, unit: 'g', hint: eggs },
    ],
    yieldGrams: 130,
    energyFactor: 0.75,
    unitGrams: 4,
    unitLabel: ['gotinha', 'gotinhas'],
    steps: [
      { title: 'Bata tudo', text: 'Bata o frango cru em pedaços com o ovo no processador ou liquidificador até virar uma pasta lisa.' },
      { title: 'Faça as gotinhas', text: 'Com uma colher ou saco de confeitar, faça gotinhas pequenas numa assadeira forrada com papel manteiga.' },
      { title: 'Asse', text: 'Leve ao forno preaquecido a 180°C por 10 a 15 minutos. Asse até ficar firme por dentro, sem partes rosadas. Gotinhas maiores precisam de mais tempo.' },
      { title: 'Espere esfriar', text: 'Deixe esfriar completamente antes de servir ou guardar.' },
    ],
    storage: ['Geladeira: até 3 dias em pote fechado.', 'Freezer: até 2 meses. Separe em porções e descongele na geladeira.'],
    cautions: [
      'Frango e ovo crus: lave bem as mãos, a tábua e os utensílios depois de manusear.',
      'Na primeira vez, ofereça pouquinho e observe se o cão tolera bem o ovo.',
    ],
    source: 'Adaptada de @catmurgel (Instagram).',
  },
  'frozen-antioxidante': {
    ingredients: [
      { id: 'iogurte', label: 'Iogurte natural sem açúcar e sem adoçante', amount: 245, unit: 'g' },
      { id: 'agua', label: 'Água filtrada', amount: 120, unit: 'ml' },
      { id: 'framboesa', label: 'Framboesa', amount: 60, unit: 'g' },
      { id: 'morango', label: 'Morango', amount: 75, unit: 'g' },
      { id: 'mirtilo', label: 'Mirtilo (blueberry)', amount: 75, unit: 'g' },
    ],
    yieldGrams: 575,
    energyFactor: 1,
    unitGrams: 36,
    unitLabel: ['forminha', 'forminhas'],
    steps: [
      { title: 'Faça o purê de framboesa', text: 'Bata a framboesa com metade da água até ficar liso.' },
      { title: 'Afine o iogurte', text: 'Numa tigela, misture o iogurte com o resto da água.' },
      { title: 'Monte as forminhas', text: 'Pique o morango em pedaços pequenos. Coloque forminhas de silicone sobre uma assadeira e distribua o mirtilo e o morango.' },
      { title: 'Complete em duas cores', text: 'Encha um lado de cada forminha com o purê de framboesa e complete o espaço com o iogurte.' },
      { title: 'Congele', text: 'Leve ao freezer por cerca de 3 horas, até ficar firme. Desenforme e guarde em pote ou saco próprio para freezer.' },
    ],
    storage: ['Freezer: até 3 meses em pote ou saco fechado.'],
    cautions: [
      'Nunca use iogurte com adoçante: o xilitol é tóxico para cães. Confira o rótulo.',
      'Prefira iogurte com pouca gordura. Se o cão não tolera lactose, pule esta receita.',
      'Na primeira vez, ofereça uma forminha e observe as fezes no dia seguinte.',
    ],
    source: 'Adaptada de Spoiled Hounds.',
  },
  'gelatina-dourada': {
    ingredients: [
      { id: 'pe-galinha', label: 'Pé de galinha', amount: 500, unit: 'g' },
      { id: 'agua', label: 'Água filtrada para o cozimento', amount: 2000, unit: 'ml' },
      { id: 'vinagre', label: 'Vinagre de maçã', amount: 5, unit: 'ml' },
      { id: 'caldo', label: 'Caldo do cozimento, já coado', amount: 480, unit: 'ml', fromPrep: true },
      { id: 'gelatina', label: 'Gelatina em pó incolor e sem sabor', amount: 35, unit: 'g', hint: spoonsOfGelatin },
      { id: 'curcuma', label: 'Cúrcuma em pó', amount: 1, unit: 'pitada' },
    ],
    yieldGrams: 650,
    energyFactor: 1,
    maxBatchDays: 4,
    steps: [
      { title: 'Limpe os pés', text: 'Lave bem os pés de galinha e corte as unhas.' },
      { title: 'Cozinhe o caldo', text: 'Coloque numa panela com a água e leve ao fogo. Quando ferver, junte o vinagre, abaixe o fogo, tampe e deixe cozinhar por 4 horas.' },
      { title: 'Esfrie e desosse com cuidado', text: 'Deixe amornar, tire os pés do caldo e retire todos os ossinhos. Osso cozido lasca e pode machucar: confira pedaço por pedaço. Coe o caldo.' },
      { title: 'Prepare a gelatina', text: 'Separe o caldo na quantidade indicada acima, ainda morno. Junte a cúrcuma e a gelatina e mexa até dissolver por completo.' },
      { title: 'Monte e gele', text: 'Distribua a carne dos pés numa forma, cubra com o caldo e leve à geladeira de um dia para o outro, até firmar. Corte em cubinhos para servir.' },
    ],
    storage: ['Geladeira: até 4 dias em pote fechado. Por isso o lote é de no máximo 4 dias.'],
    cautions: [
      'Retire todos os ossos antes de montar. Nenhum pedaço de osso cozido deve ir para a forma.',
      'É um petisco rico: comece com pouco e observe as fezes. Se continuarem firmes, pode oferecer um pouco mais, sempre dentro do limite diário.',
    ],
    source: 'Adaptada de @nadia.and.reggie (Instagram).',
  },
  'chips-de-banana': {
    ingredients: [
      { id: 'banana', label: 'Banana madura, sem casca', amount: 900, unit: 'g', hint: bananas },
      { id: 'limao', label: 'Suco de limão', amount: 45, unit: 'ml' },
      { id: 'agua', label: 'Água filtrada', amount: 45, unit: 'ml' },
    ],
    yieldGrams: 225,
    energyFactor: 0.4,
    unitGrams: 2,
    unitLabel: ['chip', 'chips'],
    steps: [
      { title: 'Fatie', text: 'Corte a banana em rodelas uniformes de cerca de 0,5 cm.' },
      { title: 'Banho rápido', text: 'Misture o suco de limão com a água e passe as rodelas por 15 a 20 segundos. Isso evita que escureçam.' },
      { title: 'Arrume sem sobrepor', text: 'Espalhe em uma camada só, sem encostar uma na outra.' },
      { title: 'Desidrate', text: 'Desidratador: 57°C por 6 a 12 horas. Forno: temperatura mais baixa (cerca de 90°C), porta entreaberta, 2 a 3 horas, virando a cada 45 minutos. Air fryer com função desidratar: 57 a 65°C por 3 a 4 horas, conferindo a cada 30 minutos.' },
      { title: 'Confira o ponto', text: 'Estão prontos quando ficam firmes ou borrachudos e não soltam umidade ao apertar. Deixe esfriar antes de guardar.' },
    ],
    storage: ['Temperatura ambiente: até 1 mês em pote bem fechado.', 'Freezer: até 6 meses.'],
    cautions: [
      'Desidratar concentra o açúcar da fruta. O limite diário deste petisco já é menor por isso.',
      'Cães diabéticos ou em dieta para emagrecer: só com o aval do veterinário.',
    ],
    source: 'Adaptada de I Love Cavaliers.',
  },
};

/** Limite diário deste petisco para um pet, em gramas do petisco pronto. */
export function treatDailyMax(plan: DailyPlan, formula: TreatFormula | undefined): number {
  return plan.treatsGramsPerDay.max * (formula?.energyFactor ?? 1);
}

export interface ScaledTreatRow {
  id: string;
  label: string;
  amount: string;
  hint: string | null;
  fromPrep: boolean;
}

function formatAmount(value: number, unit: TreatIngredient['unit']): string {
  if (unit === 'pitada') return '1 pitada';
  const rounded = value >= 20 ? Math.round(value / 5) * 5 : Math.max(1, Math.round(value));
  return `≈ ${rounded.toLocaleString('pt-BR')} ${unit === 'ml' ? 'ml' : 'g'}`;
}

export function scaleTreat(formula: TreatFormula, readyGrams: number): ScaledTreatRow[] {
  const factor = readyGrams / formula.yieldGrams;
  return formula.ingredients.map((ing) => {
    const scaled = ing.amount * factor;
    return {
      id: ing.id,
      label: ing.label,
      amount: formatAmount(scaled, ing.unit),
      hint: ing.hint ? ing.hint(scaled) : null,
      fromPrep: !!ing.fromPrep,
    };
  });
}
