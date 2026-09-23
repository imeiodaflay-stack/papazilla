import snackImage from '../assets/originals/snack-pa-pum.jpeg';
import basicoImage from '../assets/originals/basico-brasileiro.jpg';
import baratoImage from '../assets/originals/barato-nutritivo.jpeg';
import frozenImage from '../assets/originals/frozen-antioxidante.jpeg';
import gelatinaImage from '../assets/originals/gelatina-dourada.jpeg';
import chipsImage from '../assets/originals/chips-banana.jpeg';

export type OriginalKind = 'meal' | 'treat';

export interface OriginalRecipeSummary {
  slug: string;
  title: string;
  subtitle: string;
  likes: number;
  image: string;
  kind: OriginalKind;
}

export const ORIGINAL_RECIPES: OriginalRecipeSummary[] = [
  { slug: 'snack-pa-pum', title: 'Snack Pá-pum', subtitle: 'Proteico e com 2 ingredientes', likes: 38, image: snackImage, kind: 'treat' },
  { slug: 'basico-brasileiro', title: 'Básico Brasileiro', subtitle: 'Comida do dia a dia', likes: 64, image: basicoImage, kind: 'meal' },
  { slug: 'barato-nutritivo', title: 'Barato Nutritivo', subtitle: 'Sabor que cabe no bolso', likes: 27, image: baratoImage, kind: 'meal' },
  { slug: 'frozen-antioxidante', title: 'Frozen Antioxidante', subtitle: 'Geladinho funcional', likes: 91, image: frozenImage, kind: 'treat' },
  { slug: 'gelatina-dourada', title: 'Gelatina Dourada', subtitle: 'Com poder anti-inflamatório', likes: 46, image: gelatinaImage, kind: 'treat' },
  { slug: 'chips-de-banana', title: 'Chips de Banana', subtitle: 'Pronto rapidinho na air-fryer', likes: 53, image: chipsImage, kind: 'treat' },
];

export function findOriginalRecipe(slug: string | undefined): OriginalRecipeSummary | undefined {
  return ORIGINAL_RECIPES.find((recipe) => recipe.slug === slug);
}
