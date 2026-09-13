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
