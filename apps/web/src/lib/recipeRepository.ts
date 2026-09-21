/** Receitas da conta. Com Supabase, o servidor calcula e grava snapshots imutáveis. */
import type { DailyPlan, FormulationId, Recipe, RecipeSelection, SupplementId } from '@papazilla/nutrition-engine';
import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';
import { waitForPendingPetWrites } from './petsStore.js';
import type { StoredPet } from './petsStore.js';
import {
  addCookLog as addLocalCookLog, addRecipe as addLocalRecipe,
  deleteRecipe as deleteLocalRecipe, listRecipes as listLocalRecipes,
  renameRecipe as renameLocalRecipe, setRecipeFavorite as setLocalFavorite,
} from './recipesStore.js';
import type { CookLog, StoredRecipe } from './recipesStore.js';

export interface SavedRecipe extends StoredRecipe {
  result?: Recipe;
  petPlans?: { pet: StoredPet; plan: DailyPlan }[];
}

export class RecipeSaveError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'RecipeSaveError';
  }
}

type RecipeInput = Omit<StoredRecipe, 'id' | 'createdAt' | 'cookLogs' | 'favorite'> & {
  result: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
};

interface RecipeRow {
  id: string; pet_ids: string[]; formulation: FormulationId; supplement: SupplementId;
  selection: RecipeSelection; days: number; format: string; created_at: string;
  custom_title: string | null; favorite: boolean; result: Recipe;
  pet_plans: { pet: StoredPet; plan: DailyPlan }[];
  recipe_preparations?: PreparationRow[];
}

interface PreparationRow {
  id: string; recipe_id: string; prepared_at: string; pet_ids: string[];
  rating: number; note: string; photo_path: string;
}

let ownerId: string | null = null;
let cache: SavedRecipe[] = isSupabaseConfigured ? [] : listLocalRecipes();

function fromRow(row: RecipeRow): SavedRecipe {
  return {
    id: row.id, petIds: row.pet_ids, formulation: row.formulation,
    supplement: row.supplement, selection: row.selection, days: row.days,
    format: row.format, createdAt: row.created_at, favorite: row.favorite,
    customTitle: row.custom_title ?? undefined, result: row.result,
    petPlans: row.pet_plans,
    cookLogs: (row.recipe_preparations ?? []).map((p) => ({
      id: p.id, date: p.prepared_at, petIds: p.pet_ids,
      rating: p.rating, note: p.note, photoPath: p.photo_path,
    })),
  };
}

export async function loadRecipesForOwner(userId: string | null): Promise<void> {
  ownerId = userId;
  if (!isSupabaseConfigured || !supabase) {
    cache = listLocalRecipes();
    return;
  }
  if (!userId) {
    cache = [];
    return;
  }
  const { data, error } = await supabase.from('recipes')
    .select('*, recipe_preparations(*)').eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[recipeRepository] Falha ao carregar receitas', error);
    cache = [];
    return;
  }
  cache = (data as RecipeRow[]).map(fromRow);
}

export function listRecipes(): SavedRecipe[] { return cache; }
export function getRecipe(id: string): SavedRecipe | undefined { return cache.find((recipe) => recipe.id === id); }

export async function saveRecipe(input: RecipeInput): Promise<SavedRecipe> {
  if (!isSupabaseConfigured || !supabase) {
    const recipe = addLocalRecipe(input) as SavedRecipe;
    cache = [recipe, ...cache];
    return recipe;
  }
  await waitForPendingPetWrites();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para salvar a receita.');
  const response = await fetch('/api/recipes-create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      petIds: input.petIds, formulation: input.formulation, supplement: input.supplement,
      selection: input.selection, days: input.days, format: input.format,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.recipe) {
    throw new RecipeSaveError(body?.error || 'Não foi possível salvar a receita.', response.status);
  }
  const recipe = fromRow(body.recipe as RecipeRow);
  cache = [recipe, ...cache];
  return recipe;
}

export async function addCookLog(recipeId: string, input: Omit<CookLog, 'id'>): Promise<SavedRecipe> {
  const recipe = getRecipe(recipeId);
  if (!recipe) throw new Error('Receita não encontrada.');
  if (!isSupabaseConfigured || !supabase) {
    const updated = addLocalCookLog(recipeId, input);
    if (!updated) throw new Error('Não foi possível registrar a fornalha.');
    cache = cache.map((item) => item.id === recipeId ? updated as SavedRecipe : item);
    return updated as SavedRecipe;
  }
  if (!ownerId) throw new Error('Entre novamente para registrar a fornalha.');
  const { data, error } = await supabase.from('recipe_preparations').insert({
    owner_id: ownerId, recipe_id: recipeId, pet_ids: input.petIds,
    rating: input.rating, note: input.note, photo_path: input.photoPath,
  }).select('*').single();
  if (error || !data) throw new Error('Não foi possível registrar a fornalha.');
  const row = data as PreparationRow;
  recipe.cookLogs = [...recipe.cookLogs, {
    id: row.id, date: row.prepared_at, petIds: row.pet_ids,
    rating: row.rating, note: row.note, photoPath: row.photo_path,
  }];
  return recipe;
}

export async function renameRecipe(id: string, title: string): Promise<void> {
  const recipe = getRecipe(id);
  if (!recipe) return;
  const trimmed = title.trim().slice(0, 120);
  if (!isSupabaseConfigured || !supabase) renameLocalRecipe(id, trimmed);
  else {
    const { error } = await supabase.from('recipes').update({ custom_title: trimmed || null }).eq('id', id);
    if (error) throw new Error('Não foi possível renomear a receita.');
  }
  recipe.customTitle = trimmed || undefined;
}

export async function setRecipeFavorite(id: string, favorite: boolean): Promise<void> {
  const recipe = getRecipe(id);
  if (!recipe) return;
  if (!isSupabaseConfigured || !supabase) setLocalFavorite(id, favorite);
  else {
    const { error } = await supabase.from('recipes').update({ favorite }).eq('id', id);
    if (error) throw new Error('Não foi possível atualizar a receita.');
  }
  recipe.favorite = favorite;
}

export async function deleteRecipe(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) deleteLocalRecipe(id);
  else {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw new Error('Não foi possível excluir a receita.');
  }
  cache = cache.filter((recipe) => recipe.id !== id);
}
