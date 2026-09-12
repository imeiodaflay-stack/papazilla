# Product

## Register

product

## Users

Tutores de cães que já alimentam ou querem migrar para alimentação natural (AN)
caseira, e precisam de orientação confiável sobre proporções, quantidades e
suplementação — sem calcular tudo na mão com planilhas ou seguir tabelas
genéricas. Usam o app em contexto de tarefa real: cadastrar o cão (anamnese),
gerar uma receita antes de ir às compras/cozinhar, e depois registrar como foi
o preparo.

## Product Purpose

Papazilla transforma como é o cão do tutor (idade, peso, rotina, condição
corporal, saúde, apetite, preferências) numa receita de AN prática — com
quantidades exatas pra comprar, cozinhar, porcionar e congelar — seguindo
recomendações veterinárias e nutricionais. Não é um serviço médico-veterinário:
organiza informação, calcula e facilita o preparo do dia a dia; recomenda
revisão do médico-veterinário sempre que há condição clínica relevante.
Sucesso = o tutor sai do wizard com uma receita que ele realmente cozinha, sem
ansiedade sobre estar fazendo certo pelo cão.

Mensagem de posicionamento aprovada para App Store e outros conteúdos:
**"Consigo cadastrar meus cães e preparar uma receita completa, confiável e
prática para eles?"**

## Brand Personality

Brincalhona e carinhosa com o "monstrinho de fome" que é o cão, mas séria e
responsável quando o assunto é saúde. Voz: fofa, acolhedora, clara, natural,
leve, confiável, "comida de verdade", divertida, "premium leve" — não é uma
marca de bebê/infantil, é calorosa com padrão de acabamento adulto. Essência
declarada: "Natural, Saudável, Feliz."

## Anti-references

- Nada com cara de app de veterinário/saúde clínico — sem branco frio, azul
  médico genérico, sem personalidade. A seriedade do produto (disclaimer,
  contraindicações) não deve custar o calor da marca.
- Nada com estética genérica de app de fitness/tracker (grids de métricas
  frias).
- Nada infantil/cartunesco demais — o Zilla é fofo, mas o produto se posiciona
  como "premium leve", não como app infantil.

## Design Principles

- Cantos sempre arredondados, um CTA competindo por tela no máximo, alto
  contraste, espaço pra respirar.
- "Simplicidade hoje. Mais momentos juntos amanhã." — priorizar clareza e
  ritmo sobre densidade.
- A seriedade em saúde (disclaimers, contraindicações) é inegociável e nunca
  suavizada por tom de voz ou visual.
- Movimento é parte da voz da marca, não decoração: curto, decidido, nunca
  elástico/bounce.

## Accessibility & Inclusion

- `prefers-reduced-motion: reduce` é obrigatório em toda a experiência (regra
  registrada como correção P0 no design system) — toda animação precisa de
  alternativa não animada.
- Contraste medido e documentado: coral/verde são cores de preenchimento,
  nunca de texto (falham contraste); texto/links em coral usam `#B84726`
  (5,0:1); texto sobre fundos coral/verde usa chocolate `#4A2D22` (5,3:1).
- Público em geral usa aparelhos razoáveis (iPhones recentes como referência
  principal); não há requisito de suportar hardware muito limitado, mas
  evitar efeitos pesados sem necessidade.

## Contexto adicional (fonte de verdade fora deste arquivo)

Este monorepo é a implementação de produção do protótipo navegável em
`prototypes/papazilla-prototype/`, cujo `PRODUCT.md` é a fonte original deste
documento. Antes de decisões de escopo ou arquitetura, ver também na raiz de
`Calculadora AN/` (um nível acima deste repo):

- `escopo-mvp.md` — escopo aprovado da primeira publicação (o que entra/fica
  de fora do MVP).
- `arquitetura-tecnica.md` — Vercel + Supabase, modelo de dados, motor
  nutricional versionado.
- `HANDOVER.md` — histórico de sessões e decisões entre Claude e Codex.

Design tokens vivem em `packages/design-system/src/tokens.css` (paleta,
tipografia, espaçamento, sombras, easing) e são consumidos por `apps/web`.
