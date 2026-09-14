import { useNavigate } from 'react-router-dom';
import infoIcon from '../assets/icons/info.png';

/**
 * Termos e privacidade — sem tela equivalente no protótipo (lá era um toast
 * "serão abertos aqui"). `arquitetura-tecnica.md` só promete "links para
 * termos e política de privacidade" — o texto legal em si ainda não existe em
 * lugar nenhum do projeto. Esta tela avisa isso de forma honesta, sem
 * inventar Termos de Uso ou Política de Privacidade (conteúdo jurídico não é
 * algo pra decidir sozinho).
 */
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

      <div className="flow-body">
        <div className="flow-intro">
          <p className="eyebrow">Como cuidamos dos seus dados</p>
          <h1>Termos de Uso e Política de Privacidade</h1>
          <p>Estes documentos ainda estão sendo preparados.</p>
        </div>

        <div className="shared-recipe-note">
          <img src={infoIcon} alt="" />
          <p>
            <strong>Ainda não disponíveis</strong>O Termos de Uso e a Política de Privacidade completos entram aqui assim
            que estiverem prontos. Enquanto isso, veja como tratamos seus dados em "Dados da conta", em Minha conta.
          </p>
        </div>
      </div>
    </div>
  );
}
