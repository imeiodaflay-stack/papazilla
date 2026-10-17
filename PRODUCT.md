# PRODUCT.md — Papazilla

## Register
product

## Product Purpose
Papazilla ajuda donos de cães a preparar receitas de alimentação natural cozida (ANC) de forma confiável, personalizada e prática. O usuário cadastra seus cães, responde uma anamnese veterinária simplificada e recebe uma receita diária com gramagens exatas por ingrediente, baseada na metodologia da Dra. Sylvia Angélico (cachorroverde.com.br).

## Target Users
Donos de cães brasileiros que já adotam ou querem adotar alimentação natural cozida. Perfil: adultos 25-45 anos, majoritariamente mulheres, cuidadosas com a saúde dos pets, dispostas a cozinhar mas sem formação veterinária. Contexto de uso: em casa, na cozinha, geralmente no celular enquanto planejam ou executam o preparo da refeição.

## Primary Task
Gerar e consultar a receita do pet com ingredientes e gramagens prontas para uso.

## Secondary Tasks
- Registrar log de cozimento (check-in de refeição)
- Consultar histórico de receitas
- Gerenciar perfil do pet (anamnese completa)
- Acessar curiosidades sobre nutrição canina

## Brand Personality (3 words)
Confiável, caloroso, prático

## Anti-References (what we are NOT)
- Clínico/frio como um app de saúde humana
- Genérico como apps de receitas culinárias
- Infantil/fofo como branding para pet shop
- Minimalista/vazio como SaaS B2B

## Emotional Register
O app deve passar sensação de cuidado especializado com leveza. A Flay está cozinhando para o cachorro dela com carinho — não operando um software veterinário.

## Design Principles
1. **Clareza na hora que importa**: gramagens e ingredientes devem ser escaneáveis de relance
2. **Personalidade presente mas não intrusiva**: o mascote Zilla aparece com propósito, não como decoração reflexiva
3. **Mobile-first, mobile-only**: max-width 480px, todo o layout pensado para polegar no celular
4. **Tokens de design respeitados**: paleta coral/chocolate/creme já é a identidade; não reinventar

## Tech Context
- Vite + React + TypeScript, react-router v6
- Supabase auth (magic link / OTP)
- Vercel serverless
- Monorepo: apps/web + packages/nutrition-engine + packages/design-system
- Mobile-web app (Capacitor planejado para o futuro)
- Não há dark mode (intencional)

## Key Screens
1. **HomeScreen / PapaScreen** — tela principal autenticada (receita personalizada + originals)
2. **OriginalRecipeConfigScreen** — configuração de receita (seleção de ingredientes)
3. **OriginalRecipeResultScreen** — resultado da receita (gramagens finais)
4. **RecipeCookLogScreen** — check-in de cozimento
5. **AnamneseScreen** — anamnese do pet (20+ seções)
6. **ContaScreen** — perfil e assinatura
7. **AuthScreen** — login (magic link / OTP)
8. **OnboardingScreen** — primeiro acesso
9. **Landing** — site público em papazilla.app
