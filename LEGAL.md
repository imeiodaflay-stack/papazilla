# Conteúdo legal do Papazilla

O Papazilla mantém o mesmo conteúdo legal em dois contextos:

- **Site público:** `apps/web/public/termos.html` e `apps/web/public/privacidade.html`.
- **App autenticado:** `apps/web/src/routes/TermosPrivacidadeScreen.tsx`.

## Regra de manutenção

Toda alteração em Termos de Uso ou Política de Privacidade deve ser aplicada na mesma mudança aos arquivos públicos e à tela interna do app. A data de “Última atualização” também deve permanecer igual nos dois contextos.

Antes de publicar uma mudança legal:

1. Atualizar o texto no site público.
2. Atualizar o mesmo texto no app autenticado.
3. Conferir a data de atualização nas duas versões.
4. Validar `/termos`, `/privacidade` e `/conta/termos`.

Os textos atuais são uma minuta e ainda contêm o placeholder `CNPJ [a definir]`. A razão social, o CNPJ e mudanças materiais de tratamento de dados precisam ser confirmados antes de substituir essas informações.
