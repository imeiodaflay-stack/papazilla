import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import { getActivePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';
import { getSubscription } from '../lib/subscription.js';

/**
 * Início recorrente — fiel à tela "home" de `papazilla-prototype`: saudação,
 * seletor do pet ativo, card de criar receita e a dica do Zilla. Mostrada em
 * `/papa` quando já existe um Monstrinho cadastrado (ver `PapaRoute`).
 *
 * Diferença do protótipo: lá o seletor de pet não tem ação; aqui, como a área
 * Pets já existe, ele abre o perfil do pet ativo. Trocar de pet ainda avisa
 * por toast. "Criar uma receita" segue a regra do protótipo — sem assinatura
 * ativa, abre a oferta; com assinatura, o wizard em si ainda não existe.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const activePet = getActivePet();
  const { displayName, article } = describePet(activePet);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  function openActivePet() {
    if (activePet) navigate(`/zilla/${activePet.id}`);
    else toast('Cadastre um Monstrinho para ver o perfil dele aqui.');
  }

  function createRecipe() {
    if (getSubscription()) toast('O wizard de receita entra na próxima fatia.');
    else navigate('/assinatura', { state: { returnTo: 'papa' } });
  }

  return (
    <div className="home-content">
      <div className="home-greeting">
        <p className="eyebrow">Bom te ver de novo</p>
        <h1 className="pz-h1">
          E aí, Humano?
          <br />
          Que a gente vai papá?
        </h1>
      </div>

      <button
        type="button"
        className="pet-selector"
        aria-label={`Ver perfil de ${displayName}`}
        onClick={openActivePet}
      >
        <span className="pet-selector__avatar">
          <img src={zillaIcon} alt="" />
        </span>
        <span>
          <small>Cozinhando para</small>
          <strong>{displayName}</strong>
        </span>
        <span className="pet-selector__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>

      <section className="create-card">
        <div className="create-card__art">
          <span className="steam" aria-hidden="true">
            〰
          </span>
          <img src={potinhoIcon} alt="Tigela de comida" />
        </div>
        <div>
          <span className="pz-badge pz-badge--success">
            Feita para {article} {displayName}
          </span>
          <h2>Vamos montar uma receita?</h2>
          <p>Escolha os ingredientes e a gente calcula as quantidades.</p>
        </div>
        <button type="button" className="pz-button pz-button--primary wide" onClick={createRecipe}>
          Criar uma receita <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="tip-card">
        <img src={infoIcon} alt="" />
        <div>
          <strong>Pitada do Zilla</strong>
          <p>Separe os ingredientes antes de começar. A fornalha fica bem mais tranquila.</p>
        </div>
      </section>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
