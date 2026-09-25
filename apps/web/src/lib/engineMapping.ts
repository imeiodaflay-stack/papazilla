/**
 * Ponte entre respostas literais em PT-BR (anamnese / matilha) e os tipos do
 * `@papazilla/nutrition-engine`. Só mapeia rótulos para os enums do motor —
 * nenhuma regra nutricional nova, nenhuma inferência clínica.
 *
 * Resolve a lacuna documentada em `auditoria-calculadora-original-vs-app.md`
 * (fase de vida, faixa etária/porte do filhote e tendência de peso não tinham
 * mapeamento aprovado). Decisão de Flay: coletar esses campos na Anamnese
 * (seção 1), não a cada receita — ver `AnamneseScreen.tsx`.
 */
import type {
  CatalogItem,
  DogSize,
  FeedingGoal,
  LifeStage,
  PredominantProtein,
  PuppyAgeBand,
  Season,
  WeightTendency,
} from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';

const GOAL_MAP: Record<string, FeedingGoal> = {
  'Manter o peso atual': 'maintain',
  Emagrecer: 'lose',
  'Ganhar peso': 'gain',
  'Melhorar a qualidade da alimentação': 'quality',
  'Ajudar a preservar músculos e disposição com a idade': 'aging',
  'Apoiar uma condição de saúde': 'health',
};

export function mapGoal(goal: string): FeedingGoal {
  return GOAL_MAP[goal] ?? 'quality';
}

export function mapLifeStage(pet: Pick<StoredPet, 'lifeStage'>): LifeStage {
  return pet.lifeStage === 'Filhote' ? 'puppy' : 'adult';
}

const PUPPY_AGE_BAND_MAP: Record<string, PuppyAgeBand> = {
  '2 a 4 meses': '2-4',
  '4 a 6 meses': '4-6',
  '6 a 8 meses': '6-8',
  '8 a 10 meses': '8-10',
  '10 a 18 meses': '10-18',
  '18 meses ou mais': '18+',
};

export function mapPuppyAgeBand(pet: Pick<StoredPet, 'puppyAgeBand'>): PuppyAgeBand | undefined {
  return PUPPY_AGE_BAND_MAP[pet.puppyAgeBand];
}

const ADULT_SIZE_MAP: Record<string, DogSize> = {
  'Pequeno (adulto 5–10kg)': 'small',
  'Médio (adulto 10–25kg)': 'medium',
  'Grande (adulto 25–35kg)': 'large',
  'Gigante (adulto 35kg+)': 'giant',
};

export function mapExpectedAdultSize(pet: Pick<StoredPet, 'expectedAdultSize'>): DogSize | undefined {
  return ADULT_SIZE_MAP[pet.expectedAdultSize];
}

const TENDENCY_MAP: Record<string, WeightTendency> = {
  'Tende a engordar': 'gains-easily',
  Normal: 'normal',
  'Magro(a) / muito ativo(a)': 'lean-active',
};

export function mapWeightTendency(pet: Pick<StoredPet, 'weightTendency'>): WeightTendency {
  return TENDENCY_MAP[pet.weightTendency] ?? 'normal';
}

/**
 * País (Anamnese, Passo 1) → hemisfério, pra derivar a estação do ano pela
 * data do servidor em vez de perguntar "qual estação" direto — pergunta
 * estranha de responder e que desatualiza sozinha (ver `COUNTRY_OPTIONS` em
 * `AnamneseScreen.tsx`). Países próximos ao equador têm sazonalidade fraca
 * demais pra valer o ajuste — ficam em `null` (mesmo efeito de não informar).
 */
const HEMISPHERE_MAP: Record<string, 'north' | 'south' | null> = {
  Brasil: 'south',
  Portugal: 'north',
  Argentina: 'south',
  Chile: 'south',
  Uruguai: 'south',
  Paraguai: 'south',
  Bolívia: 'south',
  Peru: 'south',
  Colômbia: null,
  Equador: null,
  Venezuela: null,
  México: 'north',
  'Estados Unidos': 'north',
  Canadá: 'north',
  Espanha: 'north',
  França: 'north',
  Itália: 'north',
  Alemanha: 'north',
  'Reino Unido': 'north',
  Irlanda: 'north',
  'Países Baixos': 'north',
  Bélgica: 'north',
  Suíça: 'north',
  Áustria: 'north',
  Suécia: 'north',
  Noruega: 'north',
  Dinamarca: 'north',
  Polônia: 'north',
  Rússia: 'north',
  Turquia: 'north',
  Marrocos: 'north',
  Egito: 'north',
  Israel: 'north',
  'Emirados Árabes Unidos': 'north',
  Índia: 'north',
  China: 'north',
  Japão: 'north',
  'Coreia do Sul': 'north',
  Indonésia: null,
  Singapura: null,
  Malásia: null,
  Austrália: 'south',
  'Nova Zelândia': 'south',
  'África do Sul': 'south',
  Moçambique: 'south',
  Angola: 'south',
  Quênia: null,
  Nigéria: null,
};

/**
 * Estação do ano pela data (padrão: agora) e pelo hemisfério do país
 * informado. Sem país, país fora da lista ou perto do equador => "mild"
 * (mesmo comportamento de antes de existir esse campo).
 */
export function deriveSeason(pet: Pick<StoredPet, 'country'>, now: Date = new Date()): Season {
  const hemisphere = HEMISPHERE_MAP[pet.country];
  if (!hemisphere) return 'mild';
  const month = now.getMonth(); // 0 = janeiro
  const isNorthernSummer = month >= 5 && month <= 7; // jun–ago
  const isNorthernWinter = month === 11 || month <= 1; // dez–fev
  if (hemisphere === 'north') {
    if (isNorthernSummer) return 'summer';
    if (isNorthernWinter) return 'winter';
    return 'mild';
  }
  // Hemisfério sul: estações invertidas.
  if (isNorthernWinter) return 'summer';
  if (isNorthernSummer) return 'winter';
  return 'mild';
}

/**
 * Carboidratos/vegetais favoritos (Anamnese, passos 16–17) → ids do
 * catálogo do motor, pra pré-selecionar o wizard da receita em vez de abrir
 * sempre com o mesmo item fixo. "Tanto faz" e favoritos sem correspondência
 * direta no catálogo (ex.: "Outro") são ignorados aqui — o wizard cai no
 * padrão de sempre nesses casos.
 */
const CARB_FAVORITE_MAP: Record<string, string> = {
  Arroz: 'arroz_branco',
  'Batata-doce': 'batata_doce',
  Batata: 'batata_inglesa',
  Mandioca: 'mandioca',
  Inhame: 'inhame',
  Aveia: 'aveia',
};

export function mapCarbFavorites(pet: Pick<StoredPet, 'carbs'>): string[] {
  return pet.carbs.map((label) => CARB_FAVORITE_MAP[label]).filter((id): id is string => Boolean(id));
}

const VEGETABLE_FAVORITE_MAP: Record<string, string> = {
  Abóbora: 'abobora',
  Abobrinha: 'abobrinha',
  Cenoura: 'cenoura',
  Chuchu: 'chuchu',
  Brócolis: 'brocolis',
  Vagem: 'vagem',
};

export function mapVegetableFavorites(pet: Pick<StoredPet, 'vegetableFavorites'>): string[] {
  return pet.vegetableFavorites
    .map((label) => VEGETABLE_FAVORITE_MAP[label])
    .filter((id): id is string => Boolean(id));
}

/**
 * Deriva a proteína predominante a partir das proteínas escolhidas no wizard
 * (não é uma pergunta própria — a calculadora original tratava como campo
 * avulso; aqui é inferido da seleção real de ingredientes).
 */
export function derivePredominantProtein(selectedProteins: CatalogItem[]): PredominantProtein {
  const isBeefOrLeanFish = (item: CatalogItem) => item.id.startsWith('boi_') || item.id === 'peixe';
  if (selectedProteins.length > 0 && selectedProteins.every(isBeefOrLeanFish)) {
    return 'beef-lean-fish';
  }
  return 'chicken-pork';
}
