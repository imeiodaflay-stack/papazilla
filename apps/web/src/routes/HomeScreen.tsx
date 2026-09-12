import { useRef, useState } from 'react';
import zillaIcon from '../assets/icons/zilla.png';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import { getCurrentPet } from '../lib/session.js';
import { describePet } from '../lib/petLabel.js';

/**
 * Início recorrente — fiel à tela "home" de `papazilla-prototype`: saudação,
 * seletor do pet ativo, card de criar receita e a dica do Zilla. Mostrada em
 * `/papa` quando já existe um Monstrinho cadastrado (ver `PapaRoute`).
 *
 * Fase 0: um só pet "registrado" localmente (`getCurrentPet`); troca de pet,
 * wizard de receita e paywall entram nas próximas fatias — os botões
 * correspondentes avisam por toast em vez de simular um fluxo que não existe.
 */
export function HomeScreen() {
  const { displayName, article } = describePet(getCurrentPet());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
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
        aria-label={`Receita para ${displayName}`}
        onClick={() => toast('Troca de pet e mais de um Monstrinho entram nas próximas fatias.')}
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
        <button
          type="button"
          className="pz-button pz-button--primary wide"
          onClick={() => toast('O wizard de receita e a assinatura entram nas próximas fatias.')}
        >
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
