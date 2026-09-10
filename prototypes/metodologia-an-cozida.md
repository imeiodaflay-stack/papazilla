# Metodologia — AN Cozida (cães)

Fonte: https://cachorroverde.com.br/caes/dieta-cozida-para-caes/ (Dra. Sylvia Angélico, CRMV-SP 29943). Levantado em 04/09/2026 como base para a Calculadora AN Cozida (v1, artifact publicado).

Este documento é a referência técnica usada para escrever a lógica de cálculo em `calculadora-an-cozida.html`. Útil para a fase 2 (porte do cálculo para o app nativo).

## 1. Proporções entre grupos (presets usados na calculadora)

| Preset | Carnes | Vísceras | Carboidratos | Vegetais |
|---|---|---|---|---|
| Padrão | 35% | 5% | 35% | 25% |
| Mais proteína | 45% | 5% | 25% | 25% |
| Intermediária | 40% | 5% | 30% | 25% |
| Mais vísceras | 40% | 10% | 25% | 25% |

Distribuição calórica aproximada do padrão: 44% proteína / 31% carboidrato / 25% gordura / 1,4% fibras.

## 2. Quantidade diária

`total_g = peso_ideal_kg × (% do porte) × 1000 / 100`

Regra de integração definida para o produto: quando o objetivo informado na anamnese é **Emagrecer**, `peso_ideal_kg` é o peso ideal cadastrado e obrigatório. Nos demais objetivos, o cálculo usa o peso atual. A suplementação calculada por quantidade de AN acompanha o novo total; as faixas de óleo continuam usando o peso atual do cão.

### % por porte — cães adultos

| Porte | Peso | % |
|---|---|---|
| Miniatura | até 3kg | 7–10% |
| Miniatura | 3–5kg | 5–6% |
| Pequeno | 5–10kg | 4–6% |
| Médio | 10–25kg | 4–5% |
| Grande | 25–35kg | 4–5% |
| Grande | 35–42kg | 3–4% |
| Gigante | 42kg+ | 3–4% |

Ajustes: castrado −0,5%; idoso (pode voltar a subir) +0,5% (heurística própria, não é número exato da fonte); verão reduzir levemente (usei −0,25%); inverno aumentar levemente (usei +0,25%); raça com tendência a engordar → usar mínimo da faixa; raça magra/muito ativa → usar máximo da faixa.

### % por idade — filhotes (cálculo sobre o peso ATUAL do filhote, não o peso adulto)

| Idade | Pequeno (adulto 5–10kg) | Médio (10–25kg) | Grande (25–35kg) | Gigante (35kg+) |
|---|---|---|---|---|
| 2–4 meses | 10% | 10% | 8% | 8% |
| 4–6 meses | 8% | 8% | 7% | 7% |
| 6–8 meses | 6–7% | 6–7% | 6–7% | 6% |
| 8–10 meses | 5–6% | 5–6% | 5–6% | 5% |
| 10–18 meses | 4–6% | 4–6% | 4–5% | 4–5% |
| 18+ meses | (usar tabela adulto "pequeno") | 4–5% | 4–4,5% | 3–4% |

## 3. Refeições/dia

Filhotes: 2–4m → 3–4x; 4–6m → 3x; 6m+ → 2x.
Adultos: 2x (padrão); 3–4x menores se estômago sensível.

## 4. Petiscos

Máximo 10–15% do total diário de AN.

## 5. Suplementação (fórmulas usadas)

- As doses abaixo acompanham a quantidade ou o valor energético da comida pronta. O peso do cão influencia primeiro a quantidade diária de AN; ele não é aplicado diretamente como uma tabela de gramas de suplemento por quilo de peso.
- **Food Dog Adulto / Basic**: 0,8g / 100g de AN pronta, conforme a página atual de dieta cozida da Cachorro Verde.
- **Nutroplus Manutenção**: 0,6g (600mg) / 100g de AN pronta na referência de dieta cozida. O fabricante informa 6g / 1.000kcal, equivalente a aproximadamente 1kg de alimento.
- As fórmulas registradas anteriormente para filhotes — Food Dog 2,5g / 100g e Nutroplus 2g / 100g — ainda precisam ser conferidas contra o rótulo atual da versão exata antes de entrar no motor de produção.
- Introdução gradual: 1/4 da dose a cada 3 dias, dose cheia em 12 dias.
- **Óleo vegetal** (por peso do cão): até 2kg → 1 colherinha de café 1x/dia · 3–7kg → 1/2 colher de chá 2x/dia · 8–15kg → 1 colher de sobremesa 1x/dia · 15–25kg → 1 colher de sopa 1x/dia · 25kg+ → 1 colher de sopa 2x/dia. Frango/porco (rico em ômega-6) → azeite, côco ou linhaça dourada. Só boi/peixe magro → girassol ou gergelim.
- **Óleo de peixe/krill**: até 5kg → 1 cápsula 500mg · 5–20kg → 1 cápsula 1g · 20kg+ → 2 cápsulas de 1g. Diário ou 3x/semana. Dispensável se peixe fresco 2–3x/semana.
- **Sal integral**: obrigatório, dose não padronizada pela fonte.

Fontes consultadas em 08/09/2026: [Dieta cozida para cães — Cachorro Verde](https://cachorroverde.com.br/caes/dieta-cozida-para-caes/) e [Nutroplus Manutenção — fabricante](https://lojanutroplus.com.br/products/suplemento-nutroplus-manutencao). A versão e o rótulo do produto devem ser armazenados junto da receita, pois instruções comerciais podem mudar.

## 6. Contraindicações (não usar esta dieta sem acompanhamento veterinário)

Diabetes, doença hepática (inclui shunt portossistêmico), doença renal aguda/crônica, cálculos urinários, doença cardíaca, gastrite/vômitos crônicos, enterite/colite, pancreatite ou insuficiência pancreática exócrina. Não iniciar se o cão estiver muito debilitado.

## 7. Ingredientes (referência rápida, não usados no cálculo v1)

Carnes: frango (peito/coxa/sobrecoxa desossada, moela, coração), porco (lombo, filé mignon, pulmão, coração), boi (músculo, lagarto, patinho, coxão, pulmão, coração), ovos, peixes pequenos com espinha.
Vísceras glandulares: fígado, rim, baço, cérebro.
Vegetais: agrião, catalonia, salsão, alface, acelga, rúcula, brócolis, couve-flor, abóbora, cenoura, beterraba etc. Evitar cebola (tóxica) e soja/milho (alergênicos).
Carboidratos: tubérculos preferidos (batata-doce, mandioquinha, inhame, cará, mandioca) e grãos (arroz, aveia, quinoa, lentilha). Evitar milho, soja, trigo, feijão, macarrão/pão comuns.
Proibidos sempre: cebola, uva/passas, carambola.

## Pendências para v2

- Validar as heurísticas de idoso/estação com um veterinário (não vêm de número exato da fonte).
- Metodologia de gatos (site ainda não publica calculadora de gatos).
- Metodologia AN Crua (sem/com ossos) — ainda não levantada.
- Decidir se o app cobra por cálculo (modelo Hotmart do concorrente) ou assinatura microSaaS.
