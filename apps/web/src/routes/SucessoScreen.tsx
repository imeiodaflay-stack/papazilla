import { useNavigate, useLocation } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import { setHasPet } from '../lib/session.js';
import { describePet } from '../lib/petLabel.js';

/**
 * Cadastro concluído — fiel à tela "success" de `papazilla-prototype`.
 * Recebe um resumo do Monstrinho recém-cadastrado via `location.state`
 * (passado pela Anamnese); sem esse estado (ex.: acesso direto), usa um
 * resumo genérico em vez de dados inventados.
 */
interface SuccessState {
  name?: string;
  sex?: string;
  weight?: string;
  goal?: string;
  activityTime?: string;
}

export function SucessoScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? {};
  const { isFemale, noun, article, displayName } = describePet(state);

  function goEat() {
    setHasPet();
    navigate('/papa', { replace: true });
  }

  function addAnother() {
    navigate('/anamnese');
  }

  return (
    <div className="success-view">
      <div className="confetti" aria-hidden="true">
        ✦ <span>●</span> ♥ <span>✦</span>
      </div>

      <div className="success-view__content">
        <div className="pet-portrait">
          <img src={zillaIcon} alt={`Ilustração de ${displayName}`} />
          <span className="success-check" aria-hidden="true">
            ✓
          </span>
        </div>
        <p className="eyebrow">
          {isFemale ? 'Nova' : 'Novo'} {noun} na matilha
        </p>
        <h1 className="pz-h1">
          Agora eu conheço {article} {displayName}!
        </h1>
        <p>Já guardei tudo o que preciso para ajudar vocês nas próximas fornalhas.</p>

        <div className="success-summary">
          <span>
            <strong>{state.weight ? `${state.weight} kg` : '—'}</strong>Peso
          </span>
          <span>
            <strong>{state.goal || '—'}</strong>Objetivo
          </span>
          <span>
            <strong>{state.activityTime || '—'}</strong>Atividade
          </span>
        </div>
      </div>

      <div className="success-view__actions">
        <button type="button" className="pz-button pz-button--primary wide" onClick={goEat}>
          Vamos papá!
        </button>
        <button type="button" className="pz-button pz-button--text" onClick={addAnother}>
          Cadastrar outro Monstrinho
        </button>
      </div>
    </div>
  );
}
