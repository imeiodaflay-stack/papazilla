import type { FormulationId, RecipeSelection } from '@papazilla/nutrition-engine';
import snackImage from '../assets/originals/snack-pa-pum.jpeg';
import basicoImage from '../assets/originals/basico-brasileiro.jpg';
import baratoImage from '../assets/originals/barato-nutritivo.jpeg';
import frozenImage from '../assets/originals/frozen-antioxidante.jpeg';
import gelatinaImage from '../assets/originals/gelatina-dourada.jpeg';
import chipsImage from '../assets/originals/chips-banana.jpeg';
import { TREAT_FORMULAS, type TreatFormula } from './originalTreats.js';

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
  /** Fórmula das Originals "meal" (motor AN cozida). */
  formula?: OriginalFormula;
  /** Receita dos petiscos (`originalTreats.ts`). */
  treat?: TreatFormula;
  /** Texto de "Mais sobre esta receita". */
  about: string[];
}

export const ORIGINAL_RECIPES: OriginalRecipeSummary[] = [
  {
    slug: 'snack-pa-pum', title: 'Snack Pá-pum', subtitle: 'Proteico e com 2 ingredientes', likes: 38, image: snackImage, kind: 'treat',
    treat: TREAT_FORMULAS['snack-pa-pum'],
    about: ['Petisco de frango e ovo, bom para adestramento: as gotinhas são pequenas e fáceis de dosar.'],
  },
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
    about: [
      'Frango, arroz e cenoura: a combinação mais simples e fácil de achar em qualquer mercado.',
      'Boa porta de entrada para quem está começando na comida natural cozida.',
    ],
  },
  {
    slug: 'barato-nutritivo',
    title: 'Barato Nutritivo',
    subtitle: 'Sabor que cabe no bolso',
    likes: 27,
    image: baratoImage,
    kind: 'meal',
    // Validada por Claude em 2026-09-23, mesma metodologia da Básico Brasileiro.
    // Coxa/sobrecoxa de frango (desossada) — corte tipicamente mais barato que o
    // peito no Brasil — mandioca e chuchu, tubérculo e vegetal comuns e baratos.
    // Evitei ingredientes com aviso de "solta intestino" (abóbora/quiabo) porque
    // essa Original ainda não mostra a seção de notas/disclaimers da receita.
    formula: {
      formulation: 'padrao',
      selection: { proteins: ['frango_coxa'], organs: [], carbs: ['mandioca'], vegetables: ['chuchu'] },
    },
    about: [
      'Coxa e sobrecoxa de frango, mandioca e chuchu: ingredientes que costumam custar menos e rendem bem.',
      'Tire a pele e os ossos do frango antes de cozinhar.',
    ],
  },
  {
    slug: 'frozen-antioxidante', title: 'Frozen Antioxidante', subtitle: 'Geladinho funcional', likes: 91, image: frozenImage, kind: 'treat',
    treat: TREAT_FORMULAS['frozen-antioxidante'],
    about: ['Geladinho de iogurte com frutas vermelhas, bom para dias quentes.'],
  },
  {
    slug: 'gelatina-dourada', title: 'Gelatina Dourada', subtitle: 'Com poder anti-inflamatório', likes: 46, image: gelatinaImage, kind: 'treat',
    treat: TREAT_FORMULAS['gelatina-dourada'],
    about: ['Gelatina de caldo de pé de galinha com uma pitada de cúrcuma, que dá a cor dourada.'],
  },
  {
    slug: 'chips-de-banana', title: 'Chips de Banana', subtitle: 'Pronto rapidinho na air-fryer', likes: 53, image: chipsImage, kind: 'treat',
    treat: TREAT_FORMULAS['chips-de-banana'],
    about: ['Banana desidratada, crocante ou borrachuda conforme o tempo. Um ingrediente só.'],
  },
];

export function findOriginalRecipe(slug: string | undefined): OriginalRecipeSummary | undefined {
  return ORIGINAL_RECIPES.find((recipe) => recipe.slug === slug);
}
