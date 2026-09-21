import { useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import { listPets } from '../lib/petsStore.js';
import { joinPt } from '../lib/petLabel.js';
import { getSubscription, hasActiveAccess, loadSubscriptionForOwner } from '../lib/subscription.js';
import { getUserId } from '../lib/session.js';

/**
 * Início recorrente — fiel à tela "home" de `papazilla-prototype`: saudação,
 * tira da matilha, card de criar receita e a dica do Zilla. Mostrada em
 * `/papa` quando já existe um Monstrinho cadastrado (ver `PapaRoute`).
 *
 * A tira da matilha é só informativa — mostra todos os Monstrinhos
 * cadastrados, sem seleção nem navegação; escolher quem entra em cada
 * receita continua sendo o Passo 1 do wizard (Flay, 2026-09-21). "Criar uma
 * receita" segue a regra do protótipo — sem assinatura ativa, abre a oferta;
 * com assinatura, vai pro wizard.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const pets = listPets();
  const packNames = joinPt(pets.map((pet) => pet.name)) || 'sua matilha';

  async function createRecipe() {
    await loadSubscriptionForOwner(getUserId());
    if (hasActiveAccess(getSubscription())) navigate('/receita');
    else navigate('/assinatura', { state: { returnTo: 'recipe' } });
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

      <div className="pack-strip">
        <small>Cozinhando para</small>
        <strong>{packNames}</strong>
        <div className="pack-strip__list">
          {pets.map((pet) => (
            <div key={pet.id} className="pack-strip__pet">
              <span className={`pack-strip__avatar${pet.photoPath ? '' : ' pack-strip__avatar--icon'}`}>
                <img src={pet.photoPath || zillaIcon} alt="" />
              </span>
              <small>{pet.name}</small>
            </div>
          ))}
        </div>
      </div>

      <section className="create-card">
        <div className="create-card__art">
          <span className="steam" aria-hidden="true">
            〰
          </span>
          <img src={potinhoIcon} alt="Tigela de comida" />
        </div>
        <div>
          <span className="pz-badge pz-badge--success">Feita para {packNames}</span>
          <h2>Vamos montar uma receita?</h2>
          <p>Escolha os ingredientes e a gente calcula as quantidades.</p>
        </div>
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => { void createRecipe(); }}>
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
    </div>
  );
}
