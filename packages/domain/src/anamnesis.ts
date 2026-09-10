/**
 * Anamnese do cão — modelo de dados das 20 seções de
 * `Claude outputs/questionario-cadastro-pet.md`.
 *
 * As perguntas e opções são copy de produto definida por Flay; os rótulos aqui
 * são identificadores estáveis (não traduções). Não adicionar/remover opções sem
 * atualizar o questionário canônico.
 *
 * Cada versão da anamnese é imutável (`pet_anamneses` em `arquitetura-tecnica.md`):
 * ao editar, cria-se uma nova versão com data de vigência.
 */

// 1. Sobre o cão
export type Sex = 'male' | 'female';

// 2. Objetivo (mesma lista do motor)
export type FeedingGoal =
  | 'maintain'
  | 'lose'
  | 'gain'
  | 'quality'
  | 'aging'
  | 'health';

// 3. Condição corporal
export type BodyShapeTopView =
  | 'very-thin'
  | 'thin'
  | 'proportional'
  | 'slightly-over'
  | 'well-over';
export type RibFeel =
  | 'very-visible'
  | 'easy'
  | 'fat-layer'
  | 'need-press'
  | 'cannot-feel';
export type BellyProfile =
  | 'well-tucked'
  | 'slightly-tucked'
  | 'almost-straight'
  | 'rounded'
  | 'very-rounded';

// 4. Musculatura
export type MuscleChange =
  | 'temporal-hollowing'
  | 'spine-visible'
  | 'hip-bones-visible'
  | 'thin-hind-legs'
  | 'recent-muscle-loss'
  | 'none'
  | 'cannot-assess';
export type MuscleChangeSeverity = 'mild' | 'moderate' | 'evident' | 'unknown';

// 5. Mudança de peso recente
export type RecentWeightChange =
  | 'stable'
  | 'gained-a-little'
  | 'gained-a-lot'
  | 'lost-a-little'
  | 'lost-a-lot'
  | 'unknown';

// 6. Rotina de atividade
export type ActivityDuration = 'lt20' | '20-40' | '40-60' | '60-120' | 'gt120';
export type ActivityIntensity =
  | 'almost-none'
  | 'calm-walks'
  | 'walks'
  | 'active-play'
  | 'running'
  | 'sport-work';

// 7. Apetite
export type Appetite =
  | 'picky'
  | 'normal'
  | 'likes-food'
  | 'always-hungry'
  | 'begs-constantly';

// 8. Alimentação atual
export type CurrentDiet =
  | 'dry-kibble'
  | 'wet-food'
  | 'natural-ready'
  | 'natural-homemade'
  | 'mixed';
export type MealsPerDayAnswer = '1' | '2' | '3' | '4+' | 'free-feeding';

// 9. Petiscos
export type TreatFrequency = 'almost-never' | '1-2-day' | '3-5-day' | 'many' | 'unknown';
export type TableFood = 'never' | 'sometimes' | 'often';

// 10. Digestão
export type StoolConsistency = 'very-hard' | 'firm' | 'soft-formed' | 'very-soft' | 'liquid';
export type StoolFrequency = 'lt1-day' | '1-day' | '2-day' | '3plus-day';
export type DigestiveIssue =
  | 'gas'
  | 'constipation'
  | 'vomiting'
  | 'regurgitation'
  | 'recurrent-diarrhea'
  | 'mucus-in-stool'
  | 'none';

// 11. Saúde — mapeia para as restrições clínicas da metodologia
export type HealthCondition =
  | 'kidney-disease'
  | 'heart-disease'
  | 'liver-disease'
  | 'pancreatitis'
  | 'diabetes'
  | 'high-cholesterol-triglycerides'
  | 'urinary-stones'
  | 'food-allergy-intolerance'
  | 'gastrointestinal-disease'
  | 'osteoarthritis-orthopedic'
  | 'cancer'
  | 'endocrine-hormonal'
  | 'other'
  | 'none';

/** Condições que acionam a recomendação de revisão veterinária (seção 11 + nota de integração). */
export const CLINICAL_REVIEW_CONDITIONS: readonly HealthCondition[] = [
  'kidney-disease',
  'heart-disease',
  'liver-disease',
  'pancreatitis',
  'diabetes',
  'high-cholesterol-triglycerides',
  'urinary-stones',
  'food-allergy-intolerance',
  'gastrointestinal-disease',
  'cancer',
  'endocrine-hormonal',
  'other',
];

// 12. Complementares (condicionais)
export type PancreatitisHistory = 'once' | 'more-than-once' | 'unknown';
export type UrinaryStoneType = 'struvite' | 'oxalate' | 'urate' | 'other' | 'unknown';
export type KidneyStageKnown = 'yes' | 'no' | 'unknown';

// 13. Medicamentos e suplementos
export type SupplementInUse =
  | 'omega-3'
  | 'vitamin-mineral'
  | 'joint'
  | 'probiotic'
  | 'other';

// 14. Acompanhamento veterinário
export type LastVetVisit = 'lt6m' | '6-12m' | 'gt1y' | 'never';
export type BloodworkStatus = 'normal' | 'altered' | 'no' | 'unknown';

// 15–17. Preferências alimentares
export type ProteinPreference =
  | 'chicken'
  | 'beef'
  | 'pork'
  | 'fish'
  | 'egg'
  | 'turkey'
  | 'all'
  | 'any';
export type CarbPreference =
  | 'rice'
  | 'sweet-potato'
  | 'potato'
  | 'cassava'
  | 'yam'
  | 'oats'
  | 'any';
export type VegetableFavorite =
  | 'pumpkin'
  | 'zucchini'
  | 'carrot'
  | 'chayote'
  | 'broccoli'
  | 'green-beans'
  | 'other'
  | 'any';

// 18. Rotina de preparo
export type CookingMethod =
  | 'boiling'
  | 'steaming'
  | 'pressure-cooker'
  | 'oven'
  | 'air-fryer'
  | 'varies';
export type RecipeFormatPreference = 'raw' | 'cooked' | 'both';

// 19. Refeições preferidas
export type PreferredMeals = '1' | '2' | '3' | '4' | 'recommend';

/** Estrutura completa das respostas. Campos abertos e "não sei" preservados como no questionário. */
export interface AnamnesisAnswers {
  // 1
  breed?: string;
  sex: Sex;
  neutered: boolean;
  birthDateOrAge: string;
  currentWeightKg: number;
  // 2
  goal: FeedingGoal;
  idealWeightKg?: number;
  // 3
  bodyShapeTopView: BodyShapeTopView;
  ribFeel: RibFeel;
  bellyProfile: BellyProfile;
  // 4
  muscleChanges: MuscleChange[];
  muscleChangeSeverity?: MuscleChangeSeverity;
  // 5
  recentWeightChange: RecentWeightChange;
  previousWeightKg?: number | 'unknown';
  // 6
  activityDuration: ActivityDuration;
  activityIntensity: ActivityIntensity;
  // 7
  appetite: Appetite;
  // 8
  currentDiet: CurrentDiet;
  currentMealsPerDay: MealsPerDayAnswer;
  currentAmountPerDayG?: number | 'unknown';
  // 9
  treatFrequency: TreatFrequency;
  tableFood: TableFood;
  // 10
  stoolConsistency: StoolConsistency;
  stoolFrequency: StoolFrequency;
  digestiveIssues: DigestiveIssue[];
  // 11
  healthConditions: HealthCondition[];
  healthConditionOther?: string;
  // 12
  pancreatitisHistory?: PancreatitisHistory;
  urinaryStoneType?: UrinaryStoneType;
  kidneyStageKnown?: KidneyStageKnown;
  // 13
  continuousMedication?: string;
  supplementsInUse: SupplementInUse[];
  supplementOther?: string;
  // 14
  lastVetVisit: LastVetVisit;
  bloodwork: BloodworkStatus;
  bloodworkNote?: string;
  // 15
  proteinsEatenWell: ProteinPreference[];
  proteinToAvoid?: string;
  knownIntolerance?: string;
  // 16
  carbPreferences: CarbPreference[];
  // 17
  vegetableToAvoid?: string;
  vegetableFavorites: VegetableFavorite[];
  // 18
  cookingMethod: CookingMethod;
  recipeFormatPreference: RecipeFormatPreference;
  // 19
  preferredMeals: PreferredMeals;
  // 20
  finalNotes?: string;
  // aceite
  disclaimerAcceptedAt: string;
}

/** Texto oficial do disclaimer (usar literalmente — seção "Disclaimer sugerido"). */
export const OFFICIAL_DISCLAIMER = [
  'Importante: o Papazilla é uma ferramenta de apoio à alimentação e não substitui consulta, ' +
    'diagnóstico, prescrição clínica ou acompanhamento veterinário.',
  'As receitas são criadas com base nas informações fornecidas pelo tutor e em referências ' +
    'nutricionais publicadas na literatura veterinária. Cães com doenças, sintomas, alterações ' +
    'importantes de peso, uso contínuo de medicamentos ou necessidades específicas podem precisar ' +
    'de ajustes individualizados.',
  'Recomendamos compartilhar a receita com o médico-veterinário que acompanha seu cão.',
].join('\n');

export function hasClinicalReviewCondition(conditions: HealthCondition[]): boolean {
  return conditions.some((c) => CLINICAL_REVIEW_CONDITIONS.includes(c));
}
