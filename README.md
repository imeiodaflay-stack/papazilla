# Papazilla

Alimentação natural cozida para cães. Cadastre seus cães e prepare uma receita
completa, confiável e prática para eles.

Escopo do MVP: `../escopo-mvp.md`. Arquitetura: `../arquitetura-tecnica.md`.
Colaboração e histórico: `../HANDOVER.md` e `../AGENTS.md`.

## Estrutura (npm workspaces)

```
papazilla/
├── apps/
│   └── web/                  React + TypeScript + Vite (Capacitor depois)
├── packages/
│   ├── nutrition-engine/     Motor nutricional — TS puro, sem DOM/rede. Port de calculadora-an-cozida.html
│   ├── domain/               Tipos de pet, anamnese (20 seções) e receita; ponte anamnese→motor
│   ├── design-system/        Tokens (CSS + TS) e reset
│   └── validation/           Schemas Zod compartilhados app ↔ API
├── supabase/                 migrations versionadas (perfis, pets, assinatura, receitas, fotos)
└── prototypes/               Referência congelada dos protótipos do Codex
```

## Comandos

```bash
npm install            # na raiz de papazilla/
npm run dev            # sobe o app web em http://localhost:5173
npm test               # testes de todos os pacotes (Vitest)
npm run typecheck      # tsc --noEmit em todos os pacotes
npm run build          # build de produção do app web
```

Prévia visual da receita pronta e da imagem vertical, com dados ilustrativos:
inicie `npm run dev` e abra `http://localhost:5173/recipe-design-preview.html`.
Essa página serve para revisão de design e não integra o fluxo do produto.

## Motor nutricional

`@papazilla/nutrition-engine` é um port fiel de `prototypes/calculadora-an-cozida.html`
(metodologia pública da Dra. Sylvia Angélico, cachorroverde.com.br).

- `calculateDailyPlan(input)` → total diário, %, refeições, grupos, petiscos, suplemento, óleos, sal.
- `buildRecipe({ plan, selection, days })` → gramas prontas/cruas por ingrediente, alertas contextuais.
- `ENGINE_VERSION` grava a versão usada em cada receita salva.

Lacunas conhecidas (sem mapeamento aprovado, ver `../auditoria-calculadora-original-vs-app.md`):
fase de vida, faixa etária do filhote, porte adulto e tendência de peso ainda não
são derivados da anamnese — `packages/domain/src/anamnesis-to-plan.ts` lista o que
falta resolver. Não inventar regras clínicas ou de fase de vida.

## Ambiente

Copie `.env.example` para `apps/web/.env.local` e preencha com as chaves do
Supabase (projeto dev). Sem chaves, o app roda em modo desconectado.

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — públicas, no bundle.
- `SUPABASE_SERVICE_ROLE_KEY` — só servidor (Vercel Functions), nunca no bundle.

## Estado atual e próximos passos

O app já usa Supabase para Auth, pets e leitura de assinatura. A criação de
receitas passa por `api/recipes-create.ts`, que calcula e salva o resultado
no servidor. O detalhe usa snapshots imutáveis; fornalhas ficam em
`recipe_preparations`. Compartilhamento imprimível e exclusão da conta estão
implementados em código. O modo desconectado ainda usa dados locais.

As migrations de receitas e grants foram aplicadas em dev e produção. Um teste
integrado com contas descartáveis passou em dev: criação de receita, RLS,
snapshot após edição do pet e registro de preparo. O empacotamento da API foi
validado em Preview e publicado em `papazilla.app` em 2026-09-18. A criação de
uma receita com assinatura ativa em produção e a integração Asaas no sandbox
ainda precisam de validação. Capacitor vem quando o fluxo web estiver estável.
Ver `../HANDOVER.md` para o estado mais recente.
