import { useNavigate } from 'react-router-dom';
import sucessoIcon from '../assets/icons/sucesso.png';
import infoIcon from '../assets/icons/info.png';
import { getUserProfile } from '../lib/userProfile.js';
import { getAuthProvider } from '../lib/session.js';

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  email: 'E-mail',
};

/**
 * Acesso e segurança — sem tela equivalente no protótipo (lá era só um toast
 * "as formas de entrada conectadas serão mostradas aqui"). Construída do
 * zero, e mostra só o que de fato existe: com login real (Google, e depois
 * Apple/e-mail — `getAuthProvider()` reflete a sessão do Supabase), soma a
 * forma de entrada usada; sem provedor real configurado, cai no aviso antigo
 * da Fase 0. Nunca finge um provedor que não está ativo.
 */
export function AccountAccessScreen() {
  const navigate = useNavigate();
  const email = getUserProfile()?.email;
  const provider = getAuthProvider();
  const providerLabel = provider ? (PROVIDER_LABEL[provider] ?? provider) : null;

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
            <strong>{providerLabel ?? 'E-mail'}</strong>
          </span>
          <span>
            <small>E-mail cadastrado</small>
            <strong>{email || 'Não informado'}</strong>
          </span>
        </div>

        {providerLabel ? (
          <div className="shared-recipe-note">
            <img src={infoIcon} alt="" />
            <p>
              <strong>Conectado com {providerLabel}</strong>É por essa conta que você acessa o Papazilla hoje. Apple e
              troca de provedor entram numa próxima fatia.
            </p>
          </div>
        ) : (
          <div className="shared-recipe-note">
            <img src={infoIcon} alt="" />
            <p>
              <strong>Login social ainda não existe</strong>Conectar com Google (e depois Apple) é um dos próximos passos
              da autenticação — por enquanto o acesso é só pelo e-mail informado na tela de entrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
