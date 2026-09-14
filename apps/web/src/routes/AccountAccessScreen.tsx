import { useNavigate } from 'react-router-dom';
import sucessoIcon from '../assets/icons/sucesso.png';
import infoIcon from '../assets/icons/info.png';
import { getUserProfile } from '../lib/userProfile.js';

/**
 * Acesso e segurança — sem tela equivalente no protótipo (lá era só um toast
 * "as formas de entrada conectadas serão mostradas aqui"). Construída do
 * zero, mas só mostra o que de fato existe hoje: Fase 0 não tem provedor de
 * login real (`arquitetura-tecnica.md` deixa Google/Apple/e-mail em aberto),
 * então nada de fingir "Google conectado" ou "e-mail verificado" — isso seria
 * inventar dado.
 */
export function AccountAccessScreen() {
  const navigate = useNavigate();
  const email = getUserProfile()?.email;

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button type="button" className="flow-header__back" aria-label="Voltar para Minha conta" onClick={() => navigate('/conta')}>
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Minha conta</span>
          <strong>Acesso e segurança</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={sucessoIcon} alt="" />
        </span>
      </header>

      <div className="flow-body">
        <div className="flow-intro">
          <p className="eyebrow">Como você entra</p>
          <h1>Acesso à sua conta</h1>
          <p>Um resumo de como você acessa o Papazilla hoje.</p>
        </div>

        <div className="answer-summary">
          <span>
            <small>Forma de entrada</small>
            <strong>E-mail</strong>
          </span>
          <span>
            <small>E-mail cadastrado</small>
            <strong>{email || 'Não informado'}</strong>
          </span>
        </div>

        <div className="shared-recipe-note">
          <img src={infoIcon} alt="" />
          <p>
            <strong>Login social ainda não existe</strong>Conectar com Google (e depois Apple) é um dos próximos passos da
            autenticação — por enquanto o acesso é só pelo e-mail informado na tela de entrada.
          </p>
        </div>
      </div>
    </div>
  );
}
