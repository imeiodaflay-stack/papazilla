/**
 * Biblioteca de curiosidades — conjunto pequeno e manual (sem automação no
 * MVP, ver `escopo-mvp.md`). Conteúdo, títulos e fontes portados fielmente
 * de `papazilla-prototype` (já revisados ali); nenhum texto novo foi criado
 * aqui. Só "storage" tem artigo completo no protótipo — as demais entradas
 * são cards que, ao serem abertos, avisam que o formato de leitura chega
 * depois (mesmo comportamento do protótipo).
 */
import potinhoIcon from '../assets/icons/potinho.png';
import erroIcon from '../assets/icons/erro.png';
import graficoBarrasIcon from '../assets/icons/grafico-barras.png';
import sucessoIcon from '../assets/icons/sucesso.png';
import sheetIcon from '../assets/icons/sheet.png';
import graficoPizzaIcon from '../assets/icons/grafico-pizza.png';

export type CuriosityCategory = 'preparo' | 'seguranca' | 'nutricao';

/** Ícone por variante de arte do card/artigo — mesmas variantes de `.curiosity-art--*` no CSS. */
export const ART_ICON: Record<string, string> = {
  cool: potinhoIcon,
  alert: erroIcon,
  body: graficoBarrasIcon,
  clean: sucessoIcon,
  study: sheetIcon,
  portion: graficoPizzaIcon,
};

export interface CuriosityArticle {
  /** Eyebrow do cabeçalho do artigo — texto bespoke do protótipo, não derivado de `sourceLabel`. */
  headerEyebrow: string;
  lead: string;
  fact: { value: string; text: string };
  sections: { heading: string; body: string }[];
  scope: string;
  source: { label: string; name: string; updated: string; url: string };
}

export interface CuriosityItem {
  id: string;
  category: CuriosityCategory;
  sourceLabel: string;
  title: string;
  summary: string;
  readTime: string;
  art: string;
  featured?: boolean;
  article?: CuriosityArticle;
}

export const CATEGORY_LABELS: Record<'all' | CuriosityCategory, string> = {
  all: 'Todos',
  preparo: 'Preparo',
  seguranca: 'Segurança',
  nutricao: 'Nutrição',
};

export const CURIOSITIES: CuriosityItem[] = [
  {
    id: 'storage',
    category: 'preparo',
    featured: true,
    art: 'cool',
    sourceLabel: 'PREPARO · USDA',
    title: 'Comida pronta na geladeira: até quando?',
    summary: 'Alimentos cozidos refrigerados devem ser usados em 3 a 4 dias.',
    readTime: '3 min de leitura',
    article: {
      headerEyebrow: 'Preparo seguro',
      lead: 'Organizar a fornalha em porções menores ajuda a comida a esfriar mais rápido e facilita a rotina dos próximos dias.',
      fact: { value: '3 a 4 dias', text: 'é o prazo geral indicado pelo USDA para consumir alimentos cozidos mantidos sob refrigeração.' },
      sections: [
        {
          heading: 'Não deixe a panela esperando',
          body: 'Alimentos perecíveis devem ser refrigerados em até duas horas depois do preparo. Em dias muito quentes, acima de aproximadamente 32 °C, esse intervalo cai para uma hora.',
        },
        {
          heading: 'Porções menores esfriam melhor',
          body: 'Distribua a comida em recipientes rasos e bem fechados. Uma panela grande demora mais para esfriar e pode permanecer por mais tempo em uma faixa favorável ao crescimento de bactérias.',
        },
        {
          heading: 'Identifique cada fornalha',
          body: 'Marque a data do preparo antes de guardar. Se o alimento apresentar odor ou aparência incomum, descarte e não ofereça ao pet.',
        },
      ],
      scope: 'Estas são regras gerais de segurança para alimentos cozidos. Uma orientação individual do veterinário pode ser mais restritiva.',
      source: {
        label: 'Fonte consultada',
        name: 'USDA Food Safety and Inspection Service',
        updated: 'Atualizada em 8 set. 2026 no Papazilla',
        url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety',
      },
    },
  },
  {
    id: 'toxic-foods',
    category: 'seguranca',
    art: 'alert',
    sourceLabel: 'SEGURANÇA · ASPCA',
    title: 'Cebola, alho e cebolinha não vão para o potinho',
    summary: 'Vegetais do gênero Allium podem causar irritação gastrointestinal e dano às células vermelhas.',
    readTime: '2 min de leitura',
  },
  {
    id: 'body-score',
    category: 'nutricao',
    art: 'body',
    sourceLabel: 'NUTRIÇÃO · WSAVA',
    title: 'A balança conta só uma parte da história',
    summary: 'Escore corporal e massa muscular ajudam a acompanhar mudanças além do peso.',
    readTime: '4 min de leitura',
  },
  {
    id: 'clean-bowls',
    category: 'preparo',
    art: 'clean',
    sourceLabel: 'PREPARO · FDA',
    title: 'Potinho limpo também faz parte da receita',
    summary: 'A FDA orienta lavar e secar tigelas e utensílios de medição após cada uso.',
    readTime: '2 min de leitura',
  },
  {
    id: 'balanced-home-food',
    category: 'nutricao',
    art: 'study',
    sourceLabel: 'NUTRIÇÃO · ESTUDO USP',
    title: 'Caseira não significa balanceada automaticamente',
    summary: 'Um estudo brasileiro encontrou deficiências frequentes em dietas preparadas em casa sem formulação adequada.',
    readTime: '5 min de leitura',
  },
  {
    id: 'treats',
    category: 'nutricao',
    art: 'portion',
    sourceLabel: 'NUTRIÇÃO · AAHA',
    title: 'Petiscos também entram na conta do dia',
    summary: 'O histórico alimentar completo deve considerar refeições, petiscos, comida da família e suplementos.',
    readTime: '3 min de leitura',
  },
];

export function findCuriosity(id: string): CuriosityItem | undefined {
  return CURIOSITIES.find((c) => c.id === id);
}
