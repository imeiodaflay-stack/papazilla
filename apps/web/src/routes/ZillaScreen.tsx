import { useNavigate } from 'react-router-dom';
import zilla from '../assets/zilla-frente.png';

/**
 * Sem Monstrinhos — fiel à tela "empty" de `papazilla-prototype`.
 * Estado inicial da área Pets: matilha vazia, com o Zilla convidando o cadastro.
 */
export function ZillaScreen() {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-state__mascot">
        <span className="speech-bubble">Au! Quem mora por aí?</span>
        <img src={zilla} alt="Zilla esperando conhecer seu pet" />
      </div>
      <p className="eyebrow">A matilha começa aqui</p>
      <h1 className="pz-h1">Ainda não conheço seus Monstrinhos</h1>
      <p>Cadastre seu primeiro aumigo para prepararmos uma receita feita para ele.</p>
      <button
        type="button"
        className="pz-button pz-button--primary wide"
        onClick={() => navigate('/anamnese')}
      >
        Cadastrar um aumigo <span aria-hidden="true">＋</span>
      </button>
    </div>
  );
}
