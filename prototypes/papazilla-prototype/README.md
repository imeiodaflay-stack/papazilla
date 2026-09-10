# Protótipo Papazilla

Primeiro núcleo navegável da experiência mobile, construído a partir da biblioteca local do Papazilla.

## Fluxo disponível

1. Splash screen.
2. Conta obrigatória com Google, Apple ou e-mail sem senha, usando o lockup de marca com fundo realmente transparente.
3. Estados de código enviado e coleta condicional do nome.
4. Onboarding em quatro telas, com botões, indicadores e gesto horizontal.
5. Estado inicial sem pets cadastrados.
6. Confirmação ilustrativa depois do cadastro da Mel.
7. Início recorrente na área Papá.
8. Oferta de assinatura ao tentar criar a primeira receita depois do cadastro do pet, com Papazilla Anual em destaque, escolha entre R$107,90 à vista ou 12 pagamentos de R$9,99, e Papazilla Mensal por R$19,90. A compra é simulada e libera o wizard localmente.
9. Área Minha conta, acessada pelo avatar sem ocupar um item da navegação inferior, com identidade do tutor, estado gratuito ou assinatura ativa, gerenciamento do plano, métodos de acesso, preferências, ajuda, privacidade e saída da conta.
10. Área Pets com lista da matilha, cards de Mel e Bento, cadastro de outro Monstrinho e perfil individual com troca de pet.
11. Perfil individual com resumo dos dados principais, edição e consulta das respostas da anamnese.
12. Anamnese completa em 20 seções, da identificação às observações finais, com peso ideal obrigatório quando o objetivo é emagrecer, respostas únicas e múltiplas, campos condicionais, perguntas clínicas complementares, preferências de preparo, revisão e aceite do disclaimer oficial. A quantidade de dias foi retirada do perfil e ela também pode ser reaberta pela área Pets para edição.
13. Wizard de receita começando pela seleção de um ou mais pets e pela escolha entre quatro proporções da calculadora original — padrão, mais proteína, intermediária e mais vísceras. Depois, busca e catálogo denso, sem emojis nos alimentos: 21 proteínas, 10 carboidratos, 15 vegetais e 4 vísceras; escolha entre Food Dog Adulto / Basic e Nutroplus Manutenção; tamanho da fornalha com atalhos ou período personalizado de 1 a 30 dias; resultado com proporção escolhida, base compartilhada, doses do suplemento escolhido por pet, óleos, sal e modo de preparo específico para a combinação.
14. Receitas salvas com filtros por pet, foto do último preparo, avaliação e contador de fornalhas.
15. Detalhe da receita com quantidades, suplementação e modo de preparo, seguido do registro de um novo preparo com foto, pets que provaram, avaliação e anotação.
16. Área Curiosidades com filtros por tema, seis exemplos editoriais baseados em USDA, ASPCA, WSAVA, FDA, estudo da USP e AAHA e dez ilustrações fixas do Zilla que se alternam a cada abertura.
17. Artigo completo sobre conservação de comida cozida, com orientação prática, indicação de escopo, fonte original e opção de salvar.

Os novos fluxos validam a arquitetura, o ritmo e as interações. A anamnese incorpora literalmente as perguntas e opções oficiais de `Claude outputs/questionario-cadastro-pet.md`; respostas permanecem disponíveis ao avançar e voltar durante a sessão, e a seção de saúde complementar só aparece quando necessária. O resultado da receita contém valores ilustrativos e registra isso na própria tela. A integração com o motor nutricional existente será feita depois da aprovação da experiência. Em Curiosidades, o primeiro card abre um artigo completo; os outros cinco validam a composição e os filtros do feed.

O login é uma simulação local. Nenhum botão chama Google, Apple, e-mail ou Supabase de verdade. Os estados `papazilla.authenticated` e `papazilla.subscription` em `localStorage` demonstram apenas o roteamento e a liberação do wizard. A tela de compra não processa pagamento; restauração, alteração e cancelamento também são marcadores de fluxo. Os dados exibidos e as alterações feitas em Pets e Receitas salvas são ilustrativos e ainda não são persistidos. A foto da fornalha é representada visualmente no protótipo, sem acessar câmera ou galeria reais. Os conteúdos de Curiosidades são estáticos e ainda não estão ligados à automação editorial nem ao Supabase.

A comparação funcional entre a calculadora original e o app está registrada em `../auditoria-calculadora-original-vs-app.md`.

## Abrir localmente

Com um servidor na raiz do projeto, acesse:

`http://localhost:4173/papazilla-prototype/index.html?reset=1`

O parâmetro `reset=1` limpa o estado salvo e reinicia a experiência de primeiro uso. Em telas maiores, o painel ao lado permite abrir qualquer estado para revisão.

## Dependências

- Tokens e componentes: `../papazilla-ui/`
- Marca e ícones: `../papazilla-design-system/assets/`
