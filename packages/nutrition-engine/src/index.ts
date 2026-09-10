export { ENGINE_VERSION } from './version.js';
export { calculateDailyPlan } from './daily-plan.js';
export { buildRecipe, RECIPE_DAYS_MIN, RECIPE_DAYS_MAX } from './recipe.js';
export {
  CATALOG,
  PROTEINS,
  ORGANS,
  CARBS,
  VEGETABLES,
  HERBS,
  findItem,
} from './catalog.js';
export {
  FORMULATIONS,
  SUPPLEMENTS,
  RAW_FACTOR,
  PERCENT_MIN,
  PERCENT_MAX,
  WEIGHT_MIN_KG,
  WEIGHT_MAX_KG,
} from './tables.js';
export type {
  FoodGroup,
  FeedingGoal,
  LifeStage,
  PuppyAgeBand,
  DogSize,
  WeightTendency,
  Season,
  FormulationId,
  SupplementId,
  PredominantProtein,
  Formulation,
  DailyPlanInput,
  DailyPlan,
  DailyPlanValidationCode,
  CatalogItem,
  IngredientRawGroup,
  IngredientGroupKey,
  RecipeSelection,
  RecipeInput,
  RecipeRow,
  RecipeGroup,
  RecipeNote,
  Recipe,
} from './types.js';
