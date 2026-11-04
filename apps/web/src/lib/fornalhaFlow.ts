/**
 * Pontes entre receita salva e o ciclo da fornalha (build de teste).
 */
import type { DailyPlan, Recipe } from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import { getPet } from './petsStore.js';
import type { SavedRecipe } from './recipeRepository.js';
import { getRecipe } from './recipeRepository.js';
import { saveRecipeDraft } from './recipeDraft.js';
import { displayRecipeTitle } from './recipeDisplay.js';
import { buildPetPlan, buildSharedRecipe } from './recipeEngine.js';
import { derivePredominantProtein } from './engineMapping.js';
import { findItem } from '@papazilla/nutrition-engine';

export interface RecipeEditState {
  editing: true;
  /** Fornalha em andamento a ser substituída quando a pessoa seguir para a lista. */
  fornalhaId?: string;
}

/** Abre o wizard já preenchido com as respostas de uma receita salva. */
export function draftFromRecipe(recipe: SavedRecipe, petIds?: string[]): void {
  saveRecipeDraft({
    selectedPetIds: petIds && petIds.length > 0 ? petIds : recipe.petIds,
    formulation: recipe.formulation,
    proteins: recipe.selection.proteins,
    carbs: recipe.selection.carbs,
    vegetables: recipe.selection.vegetables,
    organs: recipe.selection.organs,
    supplement: recipe.supplement,
    days: recipe.days,
    format: recipe.format,
  });
}

export function recipeIdForEdit(recipeId: string): SavedRecipe | undefined {
  return getRecipe(recipeId);
}

/**
 * Resultado e planos de uma receita salva. Usa o snapshot do servidor quando
 * existe; senão, recalcula com os pets atuais (receitas locais antigas).
 */
export function recipeSnapshot(recipe: SavedRecipe): { recipe: Recipe; petPlans: { pet: StoredPet; plan: DailyPlan }[]; title: string } | null {
  const title = displayRecipeTitle(recipe);
  if (recipe.result && recipe.petPlans && recipe.petPlans.length > 0) {
    return { recipe: recipe.result, petPlans: recipe.petPlans, title };
  }
  const pets = recipe.petIds.map((id) => getPet(id)).filter((p): p is StoredPet => Boolean(p));
  if (pets.length === 0) return null;
  const predominantProtein = derivePredominantProtein(
    recipe.selection.proteins.map((id) => findItem(id)).filter((it): it is NonNullable<typeof it> => Boolean(it)),
  );
  const choices = { formulation: recipe.formulation, supplement: recipe.supplement, predominantProtein };
  const petPlans = pets.map((pet) => ({ pet, plan: buildPetPlan(pet, choices) }));
  return {
    recipe: buildSharedRecipe(petPlans.map((p) => p.plan), recipe.selection, recipe.days),
    petPlans,
    title,
  };
}
