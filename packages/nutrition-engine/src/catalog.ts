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
  { id: 'batata_doce', label: 'Batata-doce', common: true, rawGroup: 'tuberculo' },
  { id: 'mandioquinha', label: 'Mandioquinha (batata-baroa)', common: true, rawGroup: 'tuberculo' },
  { id: 'inhame', label: 'Inhame', common: true, rawGroup: 'tuberculo' },
  { id: 'cara', label: 'Cará', common: true, rawGroup: 'tuberculo' },
  { id: 'mandioca', label: 'Mandioca', common: true, rawGroup: 'tuberculo' },
  { id: 'arroz_integral', label: 'Arroz integral', common: true, rawGroup: 'grao' },
  { id: 'arroz_branco', label: 'Arroz branco', common: true, rawGroup: 'grao' },
  { id: 'aveia', label: 'Aveia', common: true, rawGroup: 'grao' },
  { id: 'quinoa', label: 'Quinoa', common: true, rawGroup: 'grao' },
  { id: 'lentilha', label: 'Lentilha', common: true, rawGroup: 'grao' },
];

export const VEGETABLES: readonly CatalogItem[] = [
  { id: 'espinafre', label: 'Espinafre', common: true, vegAlert: true, rawGroup: 'folhosa' },
  { id: 'repolho', label: 'Repolho', common: true, rawGroup: 'folhosa' },
  { id: 'aipo', label: 'Aipo (talo do salsão)', common: true, rawGroup: 'legume' },
  { id: 'ervilha', label: 'Ervilha', common: true, rawGroup: 'legume' },
  { id: 'cenoura', label: 'Cenoura', common: true, rawGroup: 'legume' },
  { id: 'abobora', label: 'Abóbora', common: true, vegLoosens: true, rawGroup: 'legume' },
  { id: 'pepino', label: 'Pepino', common: true, rawGroup: 'legume' },
  { id: 'abobrinha', label: 'Abobrinha', common: true, rawGroup: 'legume' },
  { id: 'chuchu', label: 'Chuchu', common: true, rawGroup: 'legume' },
  { id: 'berinjela', label: 'Berinjela', common: true, vegLoosens: true, rawGroup: 'legume' },
  { id: 'brocolis', label: 'Brócolis', common: true, rawGroup: 'legume' },
  { id: 'couveflor', label: 'Couve-flor', common: true, rawGroup: 'legume' },
  { id: 'vagem', label: 'Vagem', common: true, rawGroup: 'legume' },
  { id: 'quiabo', label: 'Quiabo', common: true, vegLoosens: true, rawGroup: 'legume' },
  { id: 'jilo', label: 'Jiló', common: true, vegLoosens: true, rawGroup: 'legume' },
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
