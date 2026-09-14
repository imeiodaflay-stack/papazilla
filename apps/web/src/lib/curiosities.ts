/**
 * Biblioteca de curiosidades — conjunto pequeno e manual (sem automação no
 * MVP, ver `escopo-mvp.md`). Título, resumo e categoria de cada card vêm do
 * protótipo (já revisados ali). O artigo completo de cada um (exceto
 * "storage", que já veio pronto do protótipo) foi pesquisado e redigido
 * nesta sessão a partir de fontes primárias reais — ASPCA, WSAVA, FDA, AAHA
 * e um estudo da USP publicado na Pesquisa Veterinária Brasileira — cada
 * uma linkada no rodapé do próprio artigo. Nenhuma regra nutricional nova
 * foi inventada; é conteúdo educativo geral, não prescrição.
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
    article: {
      headerEyebrow: 'Segurança na cozinha',
      lead: 'Faz parte do gênero Allium: cebola, alho, cebolinha, alho-poró e chalota. Todos têm o mesmo problema para cães, em qualquer forma que apareçam na cozinha.',
      fact: {
        value: '1 dente de alho',
        text: 'já é citado como dose de referência para causar toxicidade em um cão de porte pequeno (cerca de 9 kg) — a ASPCA orienta manter toda a família Allium longe do potinho.',
      },
      sections: [
        {
          heading: 'Por que faz mal',
          body: 'Alho, cebola, cebolinha e alho-poró contêm compostos sulfurados que causam dano oxidativo aos glóbulos vermelhos do cão, levando à sua destruição (hemólise) e podendo causar anemia.',
        },
        {
          heading: 'Todas as formas contam',
          body: 'Cru, cozido, assado, em pó ou desidratado — todas as formas mantêm o risco. As versões em pó são mais concentradas: uma colher de chá de alho em pó equivale a cerca de 8 dentes frescos.',
        },
        {
          heading: 'Fique de olho nos sinais',
          body: 'Fraqueza, gengivas pálidas, urina escura, vômito e falta de ar podem aparecer horas ou dias depois da ingestão. Se seu cão comeu qualquer quantidade, vale ligar para o veterinário.',
        },
      ],
      scope: 'Este resumo cobre o risco geral da família Allium. A quantidade que causa problema varia com o porte e a sensibilidade de cada cão — na dúvida, ou diante de qualquer ingestão, procure orientação veterinária.',
      source: {
        label: 'Fonte consultada',
        name: 'ASPCA Animal Poison Control',
        updated: 'Atualizada em 14 set. 2026 no Papazilla',
        url: 'https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/garlic',
      },
    },
  },
  {
    id: 'body-score',
    category: 'nutricao',
    art: 'body',
    sourceLabel: 'NUTRIÇÃO · WSAVA',
    title: 'A balança conta só uma parte da história',
    summary: 'Escore corporal e massa muscular ajudam a acompanhar mudanças além do peso.',
    readTime: '4 min de leitura',
    article: {
      headerEyebrow: 'Além da balança',
      lead: 'Dois cães do mesmo peso podem estar em situações bem diferentes. O escore de condição corporal olha pra forma do corpo, não só pro número na balança.',
      fact: {
        value: '4 a 5',
        text: 'de 9 é a faixa considerada ideal na escala da WSAVA (World Small Animal Veterinary Association), adotada como padrão por veterinários no mundo todo.',
      },
      sections: [
        {
          heading: 'Como funciona a escala',
          body: 'Vai de 1 (muito abaixo do peso) a 9 (obesidade); a WSAVA considera de 1 a 3 abaixo do ideal e de 6 a 9 acima do ideal. A escala foi criada pela pesquisadora Dottie Laflamme e depois adotada globalmente.',
        },
        {
          heading: 'O que olhar e sentir',
          body: 'Passe as mãos pelas costelas: elas devem ser sentidas com uma leve camada de gordura por cima. Olhando de cima, deve haver uma cintura visível atrás das costelas; de lado, a barriga sobe em direção às patas traseiras.',
        },
        {
          heading: 'Por que o peso sozinho não conta tudo',
          body: 'Um cão pode manter o mesmo peso na balança enquanto perde massa muscular por idade ou doença — por isso a WSAVA recomenda avaliar também o escore de condição muscular, separado do escore de gordura.',
        },
      ],
      scope: 'Este resumo explica a lógica do escore corporal; ele não substitui a avaliação prática feita por um médico-veterinário, que consegue comparar a pontuação com o histórico e o porte do seu cão.',
      source: {
        label: 'Fonte consultada',
        name: 'WSAVA Global Nutrition Committee',
        updated: 'Atualizada em 14 set. 2026 no Papazilla',
        url: 'https://wsava.org/wp-content/uploads/2020/01/Body-Condition-Score-Dog.pdf',
      },
    },
  },
  {
    id: 'clean-bowls',
    category: 'preparo',
    art: 'clean',
    sourceLabel: 'PREPARO · FDA',
    title: 'Potinho limpo também faz parte da receita',
    summary: 'A FDA orienta lavar e secar tigelas e utensílios de medição após cada uso.',
    readTime: '2 min de leitura',
    article: {
      headerEyebrow: 'Higiene no potinho',
      lead: 'Separar os ingredientes certos é só metade do trabalho — o jeito de guardar e lavar a fornalha também protege a saúde da matilha, e da sua também.',
      fact: {
        value: '20 segundos',
        text: 'é o tempo mínimo de lavagem das mãos recomendado pela FDA antes e depois de lidar com a comida ou os petiscos do seu cão.',
      },
      sections: [
        {
          heading: 'Lave depois de cada uso',
          body: 'A FDA recomenda lavar tigelas, colheres e utensílios de medição com água quente e sabão após cada uso — não só quando parecem sujos.',
        },
        {
          heading: 'Não use a tigela como medidor',
          body: 'Use sempre uma colher, xícara ou scoop separado, dedicado só à comida do pet, em vez de mergulhar a própria tigela no pacote ou no pote da fornalha.',
        },
        {
          heading: 'Por que isso importa',
          body: 'Comida e utensílios de pet podem carregar bactérias como E. coli e Salmonella. O risco existe tanto para o cão quanto para pessoas da casa, principalmente quem tem imunidade mais baixa.',
        },
      ],
      scope: 'Estas são orientações gerais de higiene doméstica. Se alguém da casa for imunocomprometido, vale reforçar os cuidados com orientação de um profissional de saúde.',
      source: {
        label: 'Fonte consultada',
        name: 'FDA — Tips for Safe Handling of Pet Food and Treats',
        updated: 'Atualizada em 14 set. 2026 no Papazilla',
        url: 'https://www.fda.gov/animal-veterinary/animal-health-literacy/tips-safe-handling-pet-food-and-treats',
      },
    },
  },
  {
    id: 'balanced-home-food',
    category: 'nutricao',
    art: 'study',
    sourceLabel: 'NUTRIÇÃO · ESTUDO USP',
    title: 'Caseira não significa balanceada automaticamente',
    summary: 'Um estudo brasileiro encontrou deficiências frequentes em dietas preparadas em casa sem formulação adequada.',
    readTime: '5 min de leitura',
    article: {
      headerEyebrow: 'Formulação importa',
      lead: 'Cozinhar em casa dá controle sobre os ingredientes — mas só vira uma dieta completa quando as proporções são calculadas com atenção, e seguidas do jeito que foram pensadas.',
      fact: {
        value: '60%',
        text: 'dos tutores entrevistados em um estudo da USP admitiram ter alterado por conta própria a fórmula de dieta caseira prescrita para o cão, sem orientação prévia.',
      },
      sections: [
        {
          heading: 'O que o estudo encontrou',
          body: 'Pesquisadores da USP entrevistaram 55 tutores de cães em São Paulo que usavam dieta caseira. Mesmo com 79% considerando a dieta adequada, 60% relataram ter mudado a fórmula prescrita por conta própria.',
        },
        {
          heading: 'Onde mora o risco',
          body: 'A literatura veterinária associa dietas caseiras desbalanceadas a deficiências de vitamina D, vitamina E, zinco, cálcio e ácidos graxos ômega-3 — mais críticas em filhotes em fase de crescimento.',
        },
        {
          heading: 'O que ajuda',
          body: 'Seguir a formulação como calculada, sem trocar ou remover ingredientes por conta própria, e reavaliar peso e exames periodicamente com o médico-veterinário que acompanha o cão.',
        },
      ],
      scope: 'Este resumo descreve um achado de pesquisa, não uma regra fixa. A necessidade nutricional muda com idade, porte e saúde do cão — por isso o Papazilla não recomenda ajustar receitas por conta própria.',
      source: {
        label: 'Fonte consultada',
        name: 'Halfen et al., Pesquisa Veterinária Brasileira (USP), 2017',
        updated: 'Atualizada em 14 set. 2026 no Papazilla',
        url: 'https://repositorio.usp.br/item/002879228',
      },
    },
  },
  {
    id: 'treats',
    category: 'nutricao',
    art: 'portion',
    sourceLabel: 'NUTRIÇÃO · AAHA',
    title: 'Petiscos também entram na conta do dia',
    summary: 'O histórico alimentar completo deve considerar refeições, petiscos, comida da família e suplementos.',
    readTime: '3 min de leitura',
    article: {
      headerEyebrow: 'Regra dos 10%',
      lead: 'Um petisco aqui, uma beliscada ali — separados, parecem pouco. Somados ao longo do dia, podem desequilibrar a alimentação pensada com tanto cuidado.',
      fact: {
        value: '10%',
        text: 'é o limite recomendado pela AAHA (American Animal Hospital Association) para o total de calorias diárias vindas de petiscos e extras — o resto deve vir da alimentação completa e balanceada.',
      },
      sections: [
        {
          heading: 'Por que existe esse limite',
          body: 'Petiscos costumam ser pensados para o sabor, não para o equilíbrio nutricional. Passar de 10% das calorias do dia pode mexer nas proporções de proteína, gordura, vitaminas e minerais que o cão precisa.',
        },
        {
          heading: 'O que entra na conta',
          body: 'Não é só o petisco embalado: pedacinhos de comida da família, prêmios de treino, ossos e petiscos dentais também contam — vale somar tudo, não só o que sai do pacote "de petisco".',
        },
        {
          heading: 'Como aplicar no dia a dia',
          body: 'Reserve os 10% para os extras e, se um dia teve mais petisco que o normal, ajuste a porção da refeição principal para compensar — em vez de simplesmente somar por cima.',
        },
      ],
      scope: 'Este resumo apresenta uma diretriz geral da AAHA. Cães com restrições de saúde específicas podem precisar de limites diferentes — vale conversar com o médico-veterinário.',
      source: {
        label: 'Fonte consultada',
        name: 'AAHA — Nutrition and Weight Management Guidelines for Dogs and Cats',
        updated: 'Atualizada em 14 set. 2026 no Papazilla',
        url: 'https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/home/',
      },
    },
  },
];

export function findCuriosity(id: string): CuriosityItem | undefined {
  return CURIOSITIES.find((c) => c.id === id);
}
