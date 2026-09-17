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

Em dev, as tabelas, colunas, políticas e privilégios foram conferidos. A
migration `supabase/migrations/20260917160000_data_api_grants.sql` foi aplicada
**somente em dev**. Um teste integrado com duas contas descartáveis passou:
criação da receita pelo handler local com Supabase real, RLS, snapshot após
edição do pet, proteção do cálculo e registro de preparo. As contas e os dados
de teste foram removidos. Ainda faltam o deploy em Preview, o fluxo visual
com sessão real e a integração Asaas no sandbox; produção não recebeu estas
migrations de receitas. Capacitor vem quando o fluxo web estiver estável.
Ver `../HANDOVER.md` para o estado mais recente.
