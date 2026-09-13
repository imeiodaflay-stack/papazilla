/**
 * Receitas salvas (Fase 0, sem Supabase ainda). Guarda o que o wizard da
 * receita produziu, pra a área "Receitas salvas" (`ReceitasScreen.tsx`) ler
 * numa fatia futura — essa tela ainda não lista o conteúdo daqui.
 */
import type { FormulationId, RecipeSelection, SupplementId } from '@papazilla/nutrition-engine';

const RECIPES_KEY = 'papazilla.recipes';

export interface StoredRecipe {
  id: string;
  petIds: string[];
  formulation: FormulationId;
  supplement: SupplementId;
  selection: RecipeSelection;
  days: number;
  format: string;
  createdAt: string;
}

function readRecipes(): StoredRecipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredRecipe[]) : [];
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

export function addRecipe(data: Omit<StoredRecipe, 'id' | 'createdAt'>): StoredRecipe {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `recipe_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const recipe: StoredRecipe = { ...data, id, createdAt: now };
  const recipes = readRecipes();
  recipes.push(recipe);
  writeRecipes(recipes);
  return recipe;
}
