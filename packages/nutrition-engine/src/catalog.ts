import type { CatalogItem } from './types.js';

/**
 * Catálogo de ingredientes — port fiel de `calculadora-an-cozida.html`.
 * `id` preservado do original para rastreabilidade com o protótipo e a calculadora.
 *
 * Vísceras musculares (moela, coração, pulmão, bucho, língua) ficam no grupo de
 * PROTEÍNA, como no motor original. `ORGANS` são só as vísceras glandulares.
 */

export const PROTEINS: readonly CatalogItem[] = [
  { id: 'frango_peito', label: 'Peito de frango', common: true, rawGroup: 'carne' },
  { id: 'frango_coxa', label: 'Coxa/sobrecoxa de frango (desossada)', common: true, rawGroup: 'carne' },
  { id: 'frango_moela', label: 'Moela de frango', common: true, muscularOrgan: true, rawGroup: 'carne' },
  { id: 'frango_coracao', label: 'Coração de frango', common: true, muscularOrgan: true, rawGroup: 'carne' },
  { id: 'boi_musculo', label: 'Músculo bovino', common: true, rawGroup: 'carne' },
  { id: 'boi_lagarto', label: 'Lagarto bovino', common: true, rawGroup: 'carne' },
  { id: 'boi_patinho', label: 'Patinho bovino', common: true, rawGroup: 'carne' },
  { id: 'boi_coxao', label: 'Coxão (mole ou duro) bovino', common: true, rawGroup: 'carne' },
  { id: 'boi_pulmao', label: 'Pulmão bovino', common: true, muscularOrgan: true, rawGroup: 'carne' },
  { id: 'boi_coracao', label: 'Coração bovino', common: true, muscularOrgan: true, rawGroup: 'carne' },
  { id: 'boi_bucho', label: 'Bucho bovino (dobradinha)', common: true, muscularOrgan: true, rawGroup: 'carne' },
  {
    id: 'boi_lingua',
    label: 'Língua bovina',
    common: true,
    muscularOrgan: true,
    highFat: true,
    rawGroup: 'carne',
  },
  { id: 'porco_lombo', label: 'Lombo suíno', common: true, rawGroup: 'carne' },
  { id: 'porco_file', label: 'Filé mignon suíno', common: true, rawGroup: 'carne' },
  { id: 'porco_pulmao', label: 'Pulmão suíno', common: true, muscularOrgan: true, rawGroup: 'carne' },
  { id: 'porco_coracao', label: 'Coração suíno', common: true, muscularOrgan: true, rawGroup: 'carne' },
  {
    id: 'peixe',
    label: 'Peixe pequeno com espinha (ex. sardinha)',
    common: true,
    rawGroup: 'carne',
  },
  { id: 'ovo', label: 'Ovo cozido', common: false, rawGroup: 'ovo' },
  { id: 'coelho', label: 'Coelho', common: false, rawGroup: 'carne' },
  { id: 'cordeiro', label: 'Cordeiro', common: false, rawGroup: 'carne' },
  { id: 'peru', label: 'Peru', common: false, rawGroup: 'carne' },
];

export const ORGANS: readonly CatalogItem[] = [
  { id: 'figado', label: 'Fígado (frango, boi ou porco)', common: true, rawGroup: 'viscera' },
  { id: 'rim', label: 'Rim (boi ou porco)', common: true, rawGroup: 'viscera' },
  { id: 'baco', label: 'Baço (boi)', common: true, rawGroup: 'viscera' },
  { id: 'cerebro', label: 'Cérebro (boi ou porco)', common: true, rawGroup: 'viscera' },
];

export const CARBS: readonly CatalogItem[] = [
  { id: 'arroz_branco', label: 'Arroz branco', common: true, rawGroup: 'grao', note: '⭐ Muito comum · Fácil digestão, sabor neutro' },
  {
    id: 'arroz_integral',
    label: 'Arroz integral',
    common: false,
    rawGroup: 'grao',
    note: '⭐ Comum · Mais fibra; nem sempre ideal para cães sensíveis',
  },
  { id: 'batata_inglesa', label: 'Batata inglesa', common: true, rawGroup: 'tuberculo', note: '⭐ Muito comum · Sempre cozida' },
  { id: 'batata_doce', label: 'Batata-doce', common: true, rawGroup: 'tuberculo', note: '⭐ Muito comum · Boa fonte de amido e fibra' },
  {
    id: 'aveia',
    label: 'Aveia',
    common: true,
    rawGroup: 'grao',
    note: '⭐ Muito comum · Boa fonte de fibra solúvel; oferecer cozida',
  },
  {
    id: 'mandioca',
    label: 'Mandioca (aipim/macaxeira)',
    common: false,
    rawGroup: 'tuberculo',
    note: 'Comum · Só bem cozida e corretamente preparada',
  },
  { id: 'inhame', label: 'Inhame', common: false, rawGroup: 'tuberculo', note: 'Comum · Cozido' },
  { id: 'cara', label: 'Cará', common: false, rawGroup: 'tuberculo', note: 'Comum · Cozido' },
  { id: 'milho', label: 'Milho', common: false, rawGroup: 'grao', note: 'Comum · Cozido; não é "vilão" nutricional' },
  {
    id: 'fuba_polenta',
    label: 'Fubá/polenta',
    common: false,
    rawGroup: 'grao',
    note: 'Boa opção · Preparado apenas com água, sem temperos',
  },
  { id: 'cevada', label: 'Cevada', common: false, rawGroup: 'grao', note: 'Boa opção · Cozida' },
  { id: 'quinoa', label: 'Quinoa', common: false, rawGroup: 'grao', note: 'Boa opção · Cozida e bem lavada' },
  {
    id: 'trigo_sarraceno',
    label: 'Trigo-sarraceno',
    common: false,
    rawGroup: 'grao',
    note: 'Boa opção · Não é trigo; pode ser usado cozido',
  },
  {
    id: 'macarrao_simples',
    label: 'Macarrão simples',
    common: false,
    rawGroup: 'grao',
    note: 'Permitido · Menos interessante nutricionalmente; sem molho/temperos',
  },
];

export const VEGETABLES: readonly CatalogItem[] = [
  { id: 'abobora', label: 'Abóbora', common: true, vegLoosens: true, rawGroup: 'legume' },
  { id: 'cenoura', label: 'Cenoura', common: true, rawGroup: 'legume' },
  { id: 'abobrinha', label: 'Abobrinha', common: true, rawGroup: 'legume' },
  { id: 'chuchu', label: 'Chuchu', common: true, rawGroup: 'legume' },
  { id: 'vagem', label: 'Vagem', common: true, rawGroup: 'legume' },
  { id: 'brocolis', label: 'Brócolis', common: false, rawGroup: 'legume' },
  { id: 'couveflor', label: 'Couve-flor', common: false, rawGroup: 'legume' },
  { id: 'couve', label: 'Couve', common: false, rawGroup: 'folhosa' },
  { id: 'espinafre', label: 'Espinafre', common: false, vegAlert: true, rawGroup: 'folhosa' },
  { id: 'beterraba', label: 'Beterraba', common: false, rawGroup: 'legume' },
  { id: 'pepino', label: 'Pepino', common: false, rawGroup: 'legume' },
  { id: 'ervilha', label: 'Ervilha fresca', common: false, rawGroup: 'legume' },
  { id: 'pimentao', label: 'Pimentão', common: false, rawGroup: 'legume' },
  { id: 'quiabo', label: 'Quiabo', common: false, vegLoosens: true, rawGroup: 'legume' },
  { id: 'nabo', label: 'Nabo', common: false, rawGroup: 'legume' },
  { id: 'aipo', label: 'Aipo/salsão', common: false, rawGroup: 'legume' },
];

/** Ervas e especiarias — 100% opcionais, não entram no cálculo de gramas. */
export const HERBS: readonly CatalogItem[] = [
  { id: 'salsinha', label: 'Salsinha', common: true, sourced: true },
  { id: 'alecrim', label: 'Alecrim', common: true, sourced: true },
  { id: 'tomilho', label: 'Tomilho', common: true, sourced: true },
  { id: 'oregano', label: 'Orégano', common: true, sourced: true },
  { id: 'dill', label: 'Dill / Endro', common: true, sourced: true },
  { id: 'manjericao', label: 'Manjericão', common: true, sourced: true },
  { id: 'salvia', label: 'Sálvia', common: true, sourced: true },
  { id: 'hortela', label: 'Hortelã', common: true, sourced: true },
  { id: 'canela', label: 'Canela', common: false, sourced: false },
  { id: 'acafrao', label: 'Açafrão-da-terra (cúrcuma)', common: false, sourced: false },
  { id: 'gengibre', label: 'Gengibre fresco ralado', common: false, sourced: false },
];

const ALL_ITEMS: readonly CatalogItem[] = [
  ...PROTEINS,
  ...ORGANS,
  ...CARBS,
  ...VEGETABLES,
  ...HERBS,
];

const BY_ID = new Map<string, CatalogItem>(ALL_ITEMS.map((it) => [it.id, it]));

export function findItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export const CATALOG = {
  proteins: PROTEINS,
  organs: ORGANS,
  carbs: CARBS,
  vegetables: VEGETABLES,
  herbs: HERBS,
} as const;
