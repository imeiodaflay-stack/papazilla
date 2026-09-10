/**
 * Schemas Zod compartilhados entre o app e a API da Vercel.
 * Validam a fronteira antes de chamar o motor nutricional.
 */
import { z } from 'zod';
import { RECIPE_DAYS_MAX, RECIPE_DAYS_MIN, WEIGHT_MAX_KG, WEIGHT_MIN_KG } from '@papazilla/nutrition-engine';

export const feedingGoalSchema = z.enum([
  'maintain',
  'lose',
  'gain',
  'quality',
  'aging',
  'health',
]);

export const lifeStageSchema = z.enum(['adult', 'puppy']);
export const puppyAgeBandSchema = z.enum(['2-4', '4-6', '6-8', '8-10', '10-18', '18+']);
export const dogSizeSchema = z.enum(['small', 'medium', 'large', 'giant']);
export const weightTendencySchema = z.enum(['gains-easily', 'normal', 'lean-active']);
export const seasonSchema = z.enum(['mild', 'summer', 'winter']);
export const formulationIdSchema = z.enum([
  'padrao',
  'mais-proteina',
  'intermediaria',
  'mais-visceras',
]);
export const supplementIdSchema = z.enum(['food-dog', 'nutroplus']);
export const predominantProteinSchema = z.enum(['chicken-pork', 'beef-lean-fish']);

const weightKg = z.number().min(WEIGHT_MIN_KG).max(WEIGHT_MAX_KG);

export const dailyPlanInputSchema = z
  .object({
    currentWeightKg: weightKg,
    goal: feedingGoalSchema,
    idealWeightKg: weightKg.optional(),
    lifeStage: lifeStageSchema,
    puppyAgeBand: puppyAgeBandSchema.optional(),
    expectedAdultSize: dogSizeSchema.optional(),
    weightTendency: weightTendencySchema,
    neutered: z.boolean().optional(),
    senior: z.boolean().optional(),
    season: seasonSchema,
    formulation: formulationIdSchema,
    supplement: supplementIdSchema,
    predominantProtein: predominantProteinSchema,
    healthConditionsPresent: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.goal === 'lose' && v.idealWeightKg === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['idealWeightKg'],
        message: 'Peso ideal é obrigatório quando o objetivo é emagrecer.',
      });
    }
    if (v.lifeStage === 'puppy') {
      if (!v.puppyAgeBand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['puppyAgeBand'],
          message: 'Faixa etária é obrigatória para filhote.',
        });
      }
      if (!v.expectedAdultSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expectedAdultSize'],
          message: 'Porte adulto esperado é obrigatório para filhote.',
        });
      }
    }
  });

const ingredientId = z.string().min(1).max(64);

export const recipeSelectionSchema = z.object({
  proteins: z.array(ingredientId).min(1),
  organs: z.array(ingredientId),
  carbs: z.array(ingredientId).min(1),
  vegetables: z.array(ingredientId).min(1),
  herbs: z.array(ingredientId),
});

export const calculateRecipeRequestSchema = z.object({
  planInput: dailyPlanInputSchema,
  selection: recipeSelectionSchema,
  days: z.number().int().min(RECIPE_DAYS_MIN).max(RECIPE_DAYS_MAX),
});

export type DailyPlanInputParsed = z.infer<typeof dailyPlanInputSchema>;
export type CalculateRecipeRequest = z.infer<typeof calculateRecipeRequestSchema>;
