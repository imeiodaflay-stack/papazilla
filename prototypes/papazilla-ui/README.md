# Papazilla UI

Biblioteca local e independente de framework. Abra `index.html` para revisar fundamentos, marca, componentes e interações.

## Uso no futuro app

1. Importe `styles/tokens.css` uma vez na raiz.
2. Importe `styles/components.css` depois dos tokens.
3. Use as classes `pz-*` em HTML semântico ou traduza a mesma API visual para componentes do framework escolhido.
4. Use tokens semânticos (`--pz-accent`, `--pz-ink`, `--pz-surface`) nos componentes. Tokens de marca servem para documentação e exceções deliberadas.

`styles/catalog.css` e `scripts/catalog.js` pertencem somente ao catálogo. Eles não precisam entrar no app.

## Fontes e assets

- Fredoka é o display de interface conforme a referência v1.2. O lettering Papazilla permanece nos arquivos de logo.
- Nunito é usada em títulos de apoio e rótulos amigáveis.
- Inter é usada em corpo, dados, campos e ações.
- O catálogo aponta para os assets originais de `papazilla-design-system/assets/` para evitar cópias divergentes.

## Acessibilidade incorporada

- Alvos interativos com pelo menos 44px.
- Foco visível de 3px.
- Controles nativos preservados sob a apresentação visual.
- Redução de movimento respeitada.
- Estados não dependem somente da cor em alertas, campos e controles.

## Limite desta entrega

Esta é uma biblioteca visual e funcional, não o app. Ela ainda não contém lógica nutricional, cadastro, persistência ou integração com Supabase. As frases e dados presentes são exemplos de interface.
