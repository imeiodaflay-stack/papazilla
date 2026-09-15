import { useNavigate } from 'react-router-dom';

/**
 * Termos e privacidade — minuta redigida a partir do que o produto
 * efetivamente faz hoje (ver `arquitetura-tecnica.md` e o código de
 * `accountData.ts`, `session.ts`, `subscription.ts`): não inventa recursos,
 * provedores ou práticas que o app não tem. Dois pontos ficam deliberadamente
 * como placeholder — razão social e CNPJ — porque são dados reais da empresa
 * que só a Flay pode preencher; não é algo pra decidir ou inventar sozinho.
 *
 * Isto é uma MINUTA: content jurídico gerado para revisão humana, não texto
 * aprovado. Antes de publicar isto como Política de Privacidade oficial (por
 * exemplo, usando esta URL na tela de branding do Google Cloud OAuth), a Flay
 * deve revisar o conteúdo e, idealmente, um advogado deve validar — em
 * especial porque o app lida com dados de saúde do pet e é voltado a
 * consumidores no Brasil (LGPD, CDC, Marco Civil da Internet).
 */
const TERMOS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Sobre o Papazilla',
    body: 'O Papazilla é um aplicativo que ajuda tutores de cães a montar receitas de alimentação natural cozida (AN) para seus Monstrinhos, calculando quantidades de ingredientes e suplementos a partir do perfil de cada cão — peso, fase de vida, rotina e preferências informadas por você.',
  },
  {
    heading: '2. Quem pode usar',
    body: 'O uso do Papazilla requer conta e é destinado a maiores de 18 anos ou pessoas com capacidade civil plena, responsáveis pelo cuidado de um ou mais cães. Ao criar uma conta, você declara que essas condições são verdadeiras.',
  },
  {
    heading: '3. Sua conta',
    body: 'Você pode criar conta com Google, Apple ou e-mail (link ou código de uso único, sem senha). Você é responsável por manter o acesso à sua conta seguro. Pode excluir sua conta e todos os dados associados a qualquer momento em Minha conta → Dados da conta — a exclusão é permanente.',
  },
  {
    heading: '4. As receitas e o cálculo nutricional',
    body: 'O Papazilla calcula quantidades a partir das informações que você fornece sobre o cão — a precisão da receita depende da precisão dessas informações. Condições de saúde informadas na anamnese não viram regras terapêuticas automáticas: elas geram avisos e, quando aplicável, uma recomendação de revisão veterinária — nunca uma promessa de que a receita trata, previne ou substitui tratamento de qualquer condição. O Papazilla não substitui orientação de um médico-veterinário; antes de mudanças relevantes na alimentação do seu cão, principalmente se ele tiver alguma condição diagnosticada, consulte um profissional. Cada receita salva registra a versão do motor de cálculo usada, para que atualizações futuras nas regras não alterem silenciosamente receitas já geradas.',
  },
  {
    heading: '5. Conteúdo enviado por você',
    body: 'Fotos e informações que você envia — fotos do pet, fotos da fornalha, respostas da anamnese — continuam sendo suas. Você garante ter o direito de enviá-las e que elas não violam direitos de terceiros.',
  },
  {
    heading: '6. Assinatura',
    body: 'Alguns recursos, como criar receitas, podem exigir uma assinatura paga. Preços, forma de pagamento e política de cancelamento são exibidos dentro do próprio app antes de qualquer cobrança.',
  },
  {
    heading: '7. Uso aceitável',
    body: 'Não é permitido usar o Papazilla para fins ilegais, tentar acessar dados de outros usuários, ou explorar falhas de segurança do serviço.',
  },
  {
    heading: '8. Alterações e encerramento',
    body: 'Podemos atualizar estes Termos; mudanças relevantes serão avisadas dentro do app. Você pode encerrar sua conta quando quiser. Podemos suspender contas que violem estes Termos.',
  },
  {
    heading: '9. Limitação de responsabilidade',
    body: 'O Papazilla é fornecido "como está". Não garantimos que o serviço estará livre de erros ou interrupções. Na máxima extensão permitida por lei, não nos responsabilizamos por danos indiretos decorrentes do uso do app — isso não afeta os direitos que a legislação brasileira de defesa do consumidor te garante.',
  },
  {
    heading: '10. Legislação aplicável',
    body: 'Estes Termos são regidos pelas leis brasileiras, incluindo o Código de Defesa do Consumidor. Fica eleito o foro do domicílio do usuário para dirimir eventuais controvérsias.',
  },
];

const PRIVACIDADE_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Quem trata seus dados',
    body: 'Os dados pessoais tratados pelo Papazilla são de responsabilidade de [razão social a definir], inscrita no CNPJ [a definir]. Dúvidas ou solicitações sobre seus dados podem ser enviadas para imeiodaflay@gmail.com.',
  },
  {
    heading: '2. Quais dados coletamos',
    body: 'Dados de conta (nome, e-mail e, quando fornecida pelo provedor de login, foto de perfil); dados de autenticação do fluxo de login com Google, Apple ou e-mail; dados do(s) cão(ães) cadastrado(s) — nome, raça, idade ou data de nascimento, peso, sexo, foto e as respostas da anamnese sobre rotina, apetite, preferências alimentares e condições de saúde que você informar; e as receitas calculadas, os ingredientes escolhidos e o histórico de fornalhas, com fotos quando você adicionar.',
  },
  {
    heading: '3. Por que coletamos',
    body: 'Usamos esses dados exclusivamente para criar e manter sua conta, calcular e salvar as receitas dos seus cães, permitir que você acesse seu histórico em qualquer aparelho, e dar suporte quando você entra em contato. Não usamos seus dados para publicidade e não os vendemos a terceiros.',
  },
  {
    heading: '4. Onde seus dados ficam',
    body: 'Os dados ficam hospedados em servidores do Supabase na região sa-east-1 (São Paulo, Brasil). O aplicativo em si é hospedado pela Vercel.',
  },
  {
    heading: '5. Com quem compartilhamos',
    body: 'Supabase (banco de dados, autenticação e armazenamento de arquivos) e Vercel (hospedagem do aplicativo) atuam como operadores dos seus dados, seguindo nossas instruções. Se você optar por entrar com Google ou Apple, recebemos do provedor apenas nome, e-mail e foto, quando disponíveis — como em qualquer login social. Não compartilhamos seus dados com mais ninguém, e o Papazilla não usa ferramentas de rastreamento publicitário.',
  },
  {
    heading: '6. Seus direitos (LGPD)',
    body: 'A qualquer momento, em Minha conta → Dados da conta, você pode baixar uma cópia de todos os seus dados guardados no Papazilla ou excluir permanentemente sua conta e os dados associados. Você também pode corrigir dados incorretos editando seu perfil e os perfis dos seus cães diretamente no app, ou entrando em contato pelo e-mail abaixo.',
  },
  {
    heading: '7. Por quanto tempo guardamos seus dados',
    body: 'Guardamos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta, os dados associados são apagados permanentemente, exceto quando a lei exigir retenção por período maior.',
  },
  {
    heading: '8. Menores de idade',
    body: 'O Papazilla não é direcionado a menores de 18 anos. Se você acredita que uma criança nos forneceu dados pessoais, entre em contato para que possamos excluí-los.',
  },
  {
    heading: '9. Alterações nesta política',
    body: 'Podemos atualizar esta Política. Mudanças relevantes serão avisadas dentro do app antes de entrarem em vigor.',
  },
  {
    heading: '10. Contato',
    body: 'Dúvidas, solicitações ou reclamações sobre seus dados podem ser enviadas para imeiodaflay@gmail.com.',
  },
];

export function TermosPrivacidadeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button type="button" className="flow-header__back" aria-label="Voltar para Minha conta" onClick={() => navigate('/conta')}>
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Minha conta</span>
          <strong>Termos e privacidade</strong>
        </div>
        <span aria-hidden="true" />
      </header>

      <div className="flow-body curiosity-article">
        <p className="eyebrow">Como cuidamos dos seus dados</p>
        <h1>Termos de Uso e Política de Privacidade</h1>
        <p className="curiosity-lead">
          Última atualização: 15 de setembro de 2026. Ao usar o Papazilla, você concorda com os Termos de Uso e a
          Política de Privacidade abaixo.
        </p>

        <h2 style={{ marginTop: '1.6rem' }}>Termos de Uso</h2>
        {TERMOS_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </div>
        ))}

        <h2 style={{ marginTop: '1.6rem' }}>Política de Privacidade</h2>
        {PRIVACIDADE_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
