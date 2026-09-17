import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import { describePet } from '../lib/petLabel.js';

/**
 * Cadastro concluído — fiel à tela "success" de `papazilla-prototype`.
 * Recebe um resumo do Monstrinho recém-cadastrado via `location.state`
 * (passado pela Anamnese); sem esse estado (ex.: acesso direto), usa um
 * resumo genérico em vez de dados inventados.
 *
 * "Vamos papá!" leva para `/beneficios` (parabéns + benefícios da AN + CTA
 * pra oferta) em vez de ir direto pro Papá — decisão de produto pra
 * reforçar a alimentação natural enquanto o tutor ainda está no pico de
 * engajamento do cadastro, antes de pedir pra assinar.
 */
interface SuccessState {
  name?: string;
  sex?: string;
  weight?: string;
  goal?: string;
  activityTime?: string;
}

const CONFETTI_COLORS = ['#f98b69', '#adb047', '#f7bda3', '#716a11', '#4a2d22', '#e9744f'];

interface ConfettiPiece {
  left: string;
  size: string;
  radius: string;
  color: string;
  drift: string;
  spin: string;
  duration: string;
  delay: string;
}

function buildConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const size = 6 + Math.round(Math.random() * 6);
    const isCircle = i % 3 === 0;
    return {
      left: `${Math.round((i / count) * 100 + (Math.random() * 8 - 4))}%`,
      size: `${size}px`,
      radius: isCircle ? '50%' : '2px',
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      drift: `${Math.round(Math.random() * 90 - 45)}px`,
      spin: `${Math.round(Math.random() * 420 - 210)}deg`,
      duration: `${(1.6 + Math.random() * 1.2).toFixed(2)}s`,
      delay: `${(Math.random() * 0.35).toFixed(2)}s`,
    };
  });
}

export function SucessoScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? {};
  const { isFemale, noun, article, displayName } = describePet(state);
  const confetti = useMemo(() => buildConfetti(18), []);

  function goEat() {
    navigate('/beneficios', { replace: true });
  }

  function addAnother() {
    navigate('/anamnese');
  }

  return (
    <div className="success-view">
      <div className="confetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="confetti__piece"
            style={
              {
                '--pz-left': c.left,
                '--pz-size': c.size,
                '--pz-radius': c.radius,
                '--pz-color': c.color,
                '--pz-drift': c.drift,
                '--pz-spin': c.spin,
                '--pz-duration': c.duration,
                '--pz-delay': c.delay,
              } as React.CSSProperties
            }
          />
        ))}
        <svg
          className="confetti__streamer"
          style={{ '--pz-tilt': '-12deg', left: 22, width: 46, height: 210 } as React.CSSProperties}
          viewBox="0 0 46 210"
          fill="none"
        >
          <path
            d="M23 0C10 30 40 55 20 85C2 113 40 140 18 168C4 188 26 200 23 210"
            stroke="var(--pz-coral)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="confetti__streamer"
          style={
            { '--pz-tilt': '10deg', right: 26, width: 40, height: 190, animationDelay: '0.12s' } as React.CSSProperties
          }
          viewBox="0 0 40 190"
          fill="none"
        >
          <path
            d="M20 0C34 26 6 50 22 78C38 106 8 130 22 156C32 176 12 184 20 190"
            stroke="var(--pz-verde)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="confetti__streamer"
          style={
            { '--pz-tilt': '4deg', left: 150, width: 30, height: 140, animationDelay: '0.22s' } as React.CSSProperties
          }
          viewBox="0 0 30 140"
          fill="none"
        >
          <path
            d="M15 0C24 20 4 38 15 58C26 78 4 96 15 116C22 128 10 132 15 140"
            stroke="var(--pz-oliva)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
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
