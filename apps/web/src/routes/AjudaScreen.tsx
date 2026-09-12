import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mensagemIcon from '../assets/icons/mensagem.png';

/**
 * Central de Ajuda — FAQ curta + canal de contato, conforme `escopo-mvp.md`
 * ("A Central de Ajuda é uma FAQ curta com canal de contato"). Sem tela
 * equivalente no protótipo (lá é só uma linha em Minha conta que avisa "será
 * aberta aqui"); construída aqui seguindo a voz e os componentes já existentes
 * (`.flow-screen`, acordeão de `.answer-groups`).
 *
 * As respostas descrevem só o que já está decidido no escopo do produto — nada
 * de conselho clínico ou promessa que o app ainda não cumpre. O canal de
 * contato ainda não tem provedor definido, então "Falar com a gente" avisa por
 * toast em vez de simular um e-mail que não existe.
 */
const FAQ = [
  {
    q: 'O Papazilla substitui uma consulta com o veterinário?',
    a: 'Não. O Papazilla organiza informações e calcula quantidades para ajudar no dia a dia, mas não substitui consulta, diagnóstico ou prescrição de um médico-veterinário. Se seu cão tiver uma condição de saúde, compartilhe a receita com quem o acompanha.',
  },
  {
    q: 'Posso cadastrar mais de um cão?',
    a: 'Sim. Cada Monstrinho tem seu próprio perfil, respostas e recomendações — todos ficam juntos na área Pets, e você troca entre eles quando quiser.',
  },
  {
    q: 'Preciso pagar para usar o Papazilla?',
    a: 'Cadastrar seus cães, preencher a anamnese e ler as Curiosidades é gratuito. Criar receitas personalizadas faz parte da assinatura.',
  },
  {
    q: 'Como cancelo ou troco de plano?',
    a: 'Em Minha conta você vê o plano atual e gerencia ou cancela a renovação por lá. O acesso continua até o fim do período já pago.',
  },
  {
    q: 'Meus dados estão protegidos?',
    a: 'Sim. As informações suas e dos seus cães só são usadas para calcular as receitas e manter os perfis. Você pode baixar ou pedir a exclusão dos seus dados a qualquer momento em Minha conta.',
  },
];

export function AjudaScreen() {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para Minha conta"
          onClick={() => navigate('/conta')}
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

      <div className="flow-body">
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
            <p>Fale com a gente pelo canal de contato do app.</p>
          </div>
        </section>
      </div>

      <footer className="flow-footer flow-footer--single">
        <button
          type="button"
          className="pz-button pz-button--primary wide"
          onClick={() => toast('O canal de contato ainda está sendo configurado.')}
        >
          Falar com a gente
        </button>
      </footer>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
