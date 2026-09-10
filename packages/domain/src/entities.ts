/**
 * Entidades de persistência — espelham o modelo de dados de `arquitetura-tecnica.md`
 * (tabelas do Supabase). Camelizadas para uso no app; a camada de dados converte
 * de/para snake_case.
 */
import type { AnamnesisAnswers } from './anamnesis.js';
import type {
  DailyPlan,
  FormulationId,
  Recipe,
  SupplementId,
} from '@papazilla/nutrition-engine';

export type Uuid = string;
/** ISO 8601. */
export type Timestamp = string;

/** `profiles` — dados do humano ligados a `auth.users`. */
export interface Profile {
  id: Uuid;
  displayName: string;
  createdAt: Timestamp;
}

/** `pets` — identidade atual do Monstrinho. */
export interface Pet {
  id: Uuid;
  ownerId: Uuid;
  name: string;
  /** Caminho do objeto no Supabase Storage (bucket `pet-photos`), não URL. */
  photoPath?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** `pet_anamneses` — versão imutável das respostas. */
export interface PetAnamnesis {
  id: Uuid;
  petId: Uuid;
  answers: AnamnesisAnswers;
  /** A partir de quando esta versão passa a valer. */
  effectiveFrom: Timestamp;
  createdAt: Timestamp;
}

/** `recipes` — receita calculada pelo motor versionado. */
export interface RecipeRecord {
  id: Uuid;
  ownerId: Uuid;
  engineVersion: string;
  formulation: FormulationId;
  supplement: SupplementId;
  days: number;
  /** Snapshot do plano diário base (compartilhado quando há mais de um pet). */
  plan: DailyPlan;
  /** Resultado da receita renderizado pelo motor. */
  result: Recipe;
  createdAt: Timestamp;
  title?: string;
}

/**
 * `recipe_pets` — liga uma receita a um ou mais pets.
 * Guarda a versão da anamnese usada e os itens individualizados por cão.
 */
export interface RecipePet {
  id: Uuid;
  recipeId: Uuid;
  petId: Uuid;
  anamnesisId: Uuid;
  /** Plano diário deste cão (quantidades somadas na base, porção individual). */
  plan: DailyPlan;
  /** Doses de suplemento/óleos/sal deste cão. */
  supplementDoseGramsPerDay: number;
  warnings: string[];
}

/** `recipe_preparations` — cada vez que a receita foi preparada. */
export interface RecipePreparation {
  id: Uuid;
  recipeId: Uuid;
  preparedAt: Timestamp;
  photoPath?: string;
  note?: string;
}

/** `recipe_preparation_pets` — pets que provaram um preparo e sua avaliação. */
export interface RecipePreparationPet {
  id: Uuid;
  preparationId: Uuid;
  petId: Uuid;
  rating?: 1 | 2 | 3 | 4 | 5;
  shortNote?: string;
}

export type ContentTheme =
  | 'nutrition'
  | 'ingredients'
  | 'preparation'
  | 'health'
  | 'behavior';

/** `content_items` — Curiosidades e receitas editoriais publicadas. */
export interface ContentItem {
  id: Uuid;
  slug: string;
  theme: ContentTheme;
  title: string;
  summary: string;
  body: string;
  /** Fonte primária referenciada no conteúdo. */
  sourceLabel?: string;
  sourceUrl?: string;
  publishedAt: Timestamp;
}
