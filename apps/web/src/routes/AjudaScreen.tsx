import { useNavigate } from 'react-router-dom';
import mensagemIcon from '../assets/icons/mensagem.png';
import { useScrollAwareFooter } from '../hooks/useScrollAwareFooter.js';
import { SUPPORT_EMAIL, supportMailto } from '../lib/contact.js';
import { goBackOr } from '../lib/navigation.js';

/**
 * Central de Ajuda — FAQ curta + canal de contato, conforme `escopo-mvp.md`
 * ("A Central de Ajuda é uma FAQ curta com canal de contato"). Sem tela
 * equivalente no protótipo (lá é só uma linha em Minha conta que avisa "será
 * aberta aqui"); construída aqui seguindo a voz e os componentes já existentes
 * (`.flow-screen`, acordeão de `.answer-groups`).
 *
 * As respostas descrevem só o que já está decidido no escopo do produto — nada
 * de conselho clínico ou promessa que o app ainda não cumpre. O canal de
 * contato é o e-mail hello@papazilla.app: "Falar com a gente" abre o app de
 * e-mail com o assunto já preenchido.
 */
const FAQ = [
  {
    q: 'O Papazilla substitui uma consulta com o veterinário?',
    a: 'Não. O Papazilla organiza informações e calcula quantidades para ajudar no dia a dia, mas não substitui consulta, diagnóstico ou prescrição de um médico-veterinário. Se seu cão tiver uma condição de saúde, compartilhe a receita com quem o acompanha.',
  },
  {
    q: 'Posso cadastrar mais de um cão?',
    a: 'Sim. Cada Monstrinho tem seu próprio perfil, respostas e recomendações. Todos ficam juntos na área Pets, e você troca entre eles quando quiser.',
  },
  {
    q: 'Preciso pagar para usar o Papazilla?',
    a: 'Cadastrar seus cães, preencher a anamnese e ler as Curiosidades é gratuito. Criar receitas personalizadas faz parte da assinatura.',
  },
  {
    q: 'A assinatura renova sozinha?',
    a: 'Não. O Papazilla Anual libera 12 meses de acesso e não renova automaticamente, nem no cartão nem no Pix. Em Minha conta você vê até quando seu acesso vai e, no fim do período, escolhe se quer assinar de novo.',
  },
  {
    q: 'Tive um problema com o pagamento. E agora?',
    a: `Escreva para ${SUPPORT_EMAIL} contando o que aconteceu e o e-mail da sua conta Papazilla. Se tiver, mande também o comprovante do Pix ou do cartão.`,
  },
  {
    q: 'Meus dados estão protegidos?',
    a: 'Sim. As informações suas e dos seus cães só são usadas para calcular as receitas e manter os perfis. Você pode baixar ou pedir a exclusão dos seus dados a qualquer momento em Minha conta.',
  },
];

export function AjudaScreen() {
  const navigate = useNavigate();
  const { bodyRef, dividerVisible, onBodyScroll } = useScrollAwareFooter();

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para Minha conta"
          onClick={() => goBackOr(navigate, '/conta')}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Minha conta</span>
          <strong>Central de Ajuda</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={mensagemIcon} alt="" />
        </span>
      </header>

      <div className="flow-body" ref={bodyRef} onScroll={onBodyScroll}>
        <div className="flow-intro">
          <p className="eyebrow">Dúvidas e contato</p>
          <h1>Central de Ajuda</h1>
          <p>Respostas rápidas sobre o Papazilla. Se não encontrar o que precisa, é só falar com a gente.</p>
        </div>

        <div className="answer-groups">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>
                <span>{item.q}</span>
                <span aria-hidden="true">⌄</span>
              </summary>
              <div>
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <section className="tip-card">
          <img src={mensagemIcon} alt="" />
          <div>
            <strong>Não encontrou sua resposta?</strong>
            <p>
              Problemas com a compra ou com o uso do app? Escreva para{' '}
              <a className="support-link" href={supportMailto()}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>
        </section>
      </div>

      <footer className={`flow-footer flow-footer--single scroll-aware-footer${dividerVisible ? ' is-divider-visible' : ''}`}>
        <a className="pz-button pz-button--primary wide" href={supportMailto()}>
          Falar com a gente
        </a>
      </footer>
    </div>
  );
}
