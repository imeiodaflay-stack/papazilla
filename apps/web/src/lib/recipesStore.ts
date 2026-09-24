/**
 * Receitas salvas (Fase 0, sem Supabase ainda). Guarda o que o wizard da
 * receita produziu, pra a área "Receitas salvas" ler (`ReceitasScreen.tsx`,
 * `RecipeDetailScreen.tsx`) e o histórico de preparos registrado depois
 * (`RecipeCookLogScreen.tsx`).
 */
import type { FormulationId, RecipeSelection, SupplementId } from '@papazilla/nutrition-engine';

const RECIPES_KEY = 'papazilla.recipes';

/** Um preparo registrado de verdade pelo tutor — não é dado ilustrativo. */
export interface CookLog {
  id: string;
  date: string;
  petIds: string[];
  rating: number;
  note: string;
  /** URL da foto do prato (bucket `cook-photos`), ou data URL local sem Supabase/sessão. Vazio se não tirou foto. */
  photoPath: string;
}

export interface StoredRecipe {
  id: string;
  petIds: string[];
  formulation: FormulationId;
  supplement: SupplementId;
  selection: RecipeSelection;
  days: number;
  format: string;
  createdAt: string;
  cookLogs: CookLog[];
  /** Título dado pelo tutor em "Renomear" — quando ausente, a tela deriva um da seleção de ingredientes. */
  customTitle?: string;
  favorite: boolean;
}

function readRecipes(): StoredRecipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredRecipe[]).map((r) => ({
      ...r,
      cookLogs: Array.isArray(r.cookLogs) ? r.cookLogs.map((log) => ({ ...log, photoPath: log.photoPath ?? '' })) : [],
      favorite: r.favorite === true,
    }));
  } catch {
    return [];
  }
}

function writeRecipes(recipes: StoredRecipe[]): void {
  try {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

export function listRecipes(): StoredRecipe[] {
  return readRecipes();
}

export function getRecipe(id: string): StoredRecipe | undefined {
  return readRecipes().find((r) => r.id === id);
}

function newId(prefix: string): string {
  const now = Date.now();
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}_${now}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addRecipe(data: Omit<StoredRecipe, 'id' | 'createdAt' | 'cookLogs' | 'favorite'>): StoredRecipe {
  const recipe: StoredRecipe = { ...data, id: newId('recipe'), createdAt: new Date().toISOString(), cookLogs: [], favorite: false };
  const recipes = readRecipes();
  recipes.push(recipe);
  writeRecipes(recipes);
  return recipe;
}

/** Registra um preparo (fornalha) desta receita. Retorna a receita atualizada, ou `undefined` se o id não existir. */
export function addCookLog(recipeId: string, log: Omit<CookLog, 'id'>): StoredRecipe | undefined {
  const recipes = readRecipes();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return undefined;
  recipe.cookLogs.push({ ...log, id: newId('cook') });
  writeRecipes(recipes);
  return recipe;
}

/** Adiciona ou substitui a foto de um preparo já registrado. */
export function updateCookLogPhoto(recipeId: string, logId: string, photoPath: string): StoredRecipe | undefined {
  const recipes = readRecipes();
  const recipe = recipes.find((item) => item.id === recipeId);
  const log = recipe?.cookLogs.find((item) => item.id === logId);
  if (!recipe || !log) return undefined;
  log.photoPath = photoPath;
  writeRecipes(recipes);
  return recipe;
}

/** Renomeia a receita. `title` vazio remove o nome customizado e volta a derivar da seleção. */
export function renameRecipe(recipeId: string, title: string): StoredRecipe | undefined {
  const recipes = readRecipes();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return undefined;
  const trimmed = title.trim();
  if (trimmed) recipe.customTitle = trimmed;
  else delete recipe.customTitle;
  writeRecipes(recipes);
  return recipe;
}

export function setRecipeFavorite(recipeId: string, favorite: boolean): StoredRecipe | undefined {
  const recipes = readRecipes();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return undefined;
  recipe.favorite = favorite;
  writeRecipes(recipes);
  return recipe;
}

/** Remove a receita salva (e o histórico de preparos dela). Irreversível. */
export function deleteRecipe(recipeId: string): void {
  writeRecipes(readRecipes().filter((r) => r.id !== recipeId));
}
