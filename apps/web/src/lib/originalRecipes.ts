import type { FormulationId, RecipeSelection } from '@papazilla/nutrition-engine';
import snackImage from '../assets/originals/snack-pa-pum.jpeg';
import basicoImage from '../assets/originals/basico-brasileiro.jpg';
import baratoImage from '../assets/originals/barato-nutritivo.jpeg';
import frozenImage from '../assets/originals/frozen-antioxidante.jpeg';
import gelatinaImage from '../assets/originals/gelatina-dourada.jpeg';
import chipsImage from '../assets/originals/chips-banana.jpeg';

export type OriginalKind = 'meal' | 'treat';

/**
 * Fórmula validada de uma Original "meal": mesma metodologia AN cozida da
 * Personalizada (`metodologia-an-cozida.md`, proporções em `FORMULATIONS`),
 * só que com ingredientes fixos e curados em vez de escolha do tutor — dá
 * pra alimentar `buildSharedRecipe` (`recipeEngine.ts`) direto, reaproveitando
 * o mesmo motor e as mesmas tabelas já usados na receita personalizada.
 * Sem víscera selecionada de propósito: o motor já soma o % de vísceras do
 * preset na proteína quando `organs` vem vazio (mesmo comportamento de
 * "Hoje não vou usar vísceras" no wizard) — não precisa de uma extra pra
 * fechar a proporção.
 */
export interface OriginalFormula {
  formulation: FormulationId;
  selection: Omit<RecipeSelection, 'herbs'>;
}

export interface OriginalRecipeSummary {
  slug: string;
  title: string;
  subtitle: string;
  likes: number;
  image: string;
  kind: OriginalKind;
  /** `undefined` = fórmula ainda em validação (ver escopo-mvp.md / handover 2026-09-23). */
  formula?: OriginalFormula;
}

export const ORIGINAL_RECIPES: OriginalRecipeSummary[] = [
  { slug: 'snack-pa-pum', title: 'Snack Pá-pum', subtitle: 'Proteico e com 2 ingredientes', likes: 38, image: snackImage, kind: 'treat' },
  {
    slug: 'basico-brasileiro',
    title: 'Básico Brasileiro',
    subtitle: 'Comida do dia a dia',
    likes: 64,
    image: basicoImage,
    kind: 'meal',
    // Validada por Claude em 2026-09-23 com a metodologia de calculadora-an-cozida.html
    // (proporção Padrão) e o catálogo já curado do motor — peito de frango, arroz
    // branco e cenoura: os três ingredientes mais comuns e acessíveis do catálogo,
    // combinação clássica de comida caseira brasileira.
    formula: {
      formulation: 'padrao',
      selection: { proteins: ['frango_peito'], organs: [], carbs: ['arroz_branco'], vegetables: ['cenoura'] },
    },
  },
  { slug: 'barato-nutritivo', title: 'Barato Nutritivo', subtitle: 'Sabor que cabe no bolso', likes: 27, image: baratoImage, kind: 'meal' },
  { slug: 'frozen-antioxidante', title: 'Frozen Antioxidante', subtitle: 'Geladinho funcional', likes: 91, image: frozenImage, kind: 'treat' },
  { slug: 'gelatina-dourada', title: 'Gelatina Dourada', subtitle: 'Com poder anti-inflamatório', likes: 46, image: gelatinaImage, kind: 'treat' },
  { slug: 'chips-de-banana', title: 'Chips de Banana', subtitle: 'Pronto rapidinho na air-fryer', likes: 53, image: chipsImage, kind: 'treat' },
];

export function findOriginalRecipe(slug: string | undefined): OriginalRecipeSummary | undefined {
  return ORIGINAL_RECIPES.find((recipe) => recipe.slug === slug);
}
