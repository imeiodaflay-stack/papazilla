import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSeenOnboarding } from '../lib/session.js';
import imgHello from '../assets/onboarding-hello.webp';
import imgPets from '../assets/onboarding-pets.webp';
import imgRecipe from '../assets/onboarding-recipe.webp';
import imgPortion from '../assets/onboarding-portion.webp';

/**
 * Onboarding em 4 telas.
 * Track horizontal com scroll-snap + gesto, dots, contador "N de 4", "Pular" e
 * botão que vira "Conhecer a matilha →" na última tela. Ao concluir, marca
 * `papazilla.seenOnboarding` e vai para o estado sem pets (/zilla).
 */
const LAST = 3;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number>();
  const [active, setActive] = useState(0);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  function goToSlide(index: number) {
    const next = Math.max(0, Math.min(LAST, index));
    setActive(next);
    const track = trackRef.current;
    if (track) track.scrollLeft = next * track.clientWidth;
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      setActive((current) => (current === index ? current : index));
    }, 140);
  }

  function finish() {
    setSeenOnboarding();
    navigate('/zilla', { replace: true });
  }

  function onNext() {
    if (active < LAST) goToSlide(active + 1);
    else finish();
  }

  return (
    <div className="onboarding">
      <header className="onboarding__topbar">
        <span className="onboarding__count">{active + 1} de 4</span>
        <button type="button" className="text-action" onClick={finish}>
          Pular
        </button>
      </header>

      <div className="onboarding__track" ref={trackRef} onScroll={onScroll}>
        <article className="onboarding-slide">
          <div className="hero-stage hero-stage--hello">
            <img src={imgHello} alt="Zilla, o mascote do Papazilla, acenando com avental de chef" />
          </div>
          <div className="onboarding-slide__copy">
            <p className="eyebrow">Prazer, eu sou o Zilla</p>
            <h1 className="pz-h1">Oi, Humano(a)!</h1>
            <p>
              Eu ajudo você a preparar comida de verdade, balanceada e feita para o seu Monstrinho.
            </p>
          </div>
        </article>

        <article className="onboarding-slide">
          <div className="hero-stage hero-stage--pets">
            <img src={imgPets} alt="Dois cachorros sorridentes em cards, com botão de adicionar pet" />
          </div>
          <div className="onboarding-slide__copy">
            <p className="eyebrow">Primeiro, as apresentações</p>
            <h1 className="pz-h1">Conte sobre seus Monstrinhos</h1>
            <p>
              Peso, idade, rotina e preferências ajudam a gente a cuidar de cada um do jeitinho certo.
            </p>
          </div>
        </article>

        <article className="onboarding-slide">
          <div className="hero-stage hero-stage--recipe">
            <img src={imgRecipe} alt="Panela de barro com ingredientes frescos ao redor" />
          </div>
          <div className="onboarding-slide__copy">
            <p className="eyebrow">Você escolhe os ingredientes</p>
            <h1 className="pz-h1">Monte a próxima fornalha</h1>
            <p>Use o que tem em casa e receba recomendações de acordo com o perfil do seu pet.</p>
          </div>
        </article>

        <article className="onboarding-slide">
          <div className="hero-stage hero-stage--portion">
            <img src={imgPortion} alt="Tigela com refeição balanceada e indicadores de aprovação" />
          </div>
          <div className="onboarding-slide__copy">
            <p className="eyebrow">Tudo na medida</p>
            <h1 className="pz-h1">Pronto para servir</h1>
            <p>
              Você recebe as quantidades certinhas, salva a receita e depois conta se a turma aprovou.
            </p>
            <p className="onboarding-membership-note">
              <strong>Conheça primeiro:</strong> cadastrar e cuidar dos perfis dos seus Monstrinhos é
              gratuito. As receitas personalizadas fazem parte da assinatura.
            </p>
          </div>
        </article>
      </div>

      <footer className="onboarding__footer">
        <div className="page-dots" role="tablist" aria-label="Etapas do onboarding">
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              className={`page-dot${i === active ? ' is-current' : ''}`}
              aria-label={`Tela ${i + 1}`}
              aria-selected={i === active}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="pz-button pz-button--primary onboarding__next"
          onClick={onNext}
        >
          {active === LAST ? 'Conhecer a matilha' : 'Continuar'} <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
