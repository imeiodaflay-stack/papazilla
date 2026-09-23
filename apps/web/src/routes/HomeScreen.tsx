import { useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import calculatorIcon from '../assets/icons/calculator.webp';
import lockedIcon from '../assets/icons/locked.webp';
import loveIcon from '../assets/icons/love.webp';
import zillaChef from '../assets/originals/zilla-chef.webp';
import { listPets } from '../lib/petsStore.js';
import { ORIGINAL_RECIPES } from '../lib/originalRecipes.js';
import { getSubscription, hasActiveAccess, loadSubscriptionForOwner } from '../lib/subscription.js';
import { getUserId } from '../lib/session.js';

/**
 * Vitrine Papá. Os retratos da matilha são informativos: a escolha dos pets
 * acontece somente no fluxo da receita. Originals sem acesso vigente abrem a
 * oferta; quem tem acesso abre a configuração própria da Original. O cálculo
 * final só será conectado quando ingredientes e regras de cada prato forem
 * validados, sem reaproveitar indevidamente o wizard da personalizada.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const pets = listPets();

  async function requireSubscription(onActive: () => void) {
    await loadSubscriptionForOwner(getUserId());
    if (hasActiveAccess(getSubscription())) onActive();
    else navigate('/assinatura', { state: { returnTo: 'papa' } });
  }

  function createRecipe() {
    void requireSubscription(() => navigate('/receita'));
  }

  function openOriginal(slug: string) {
    void requireSubscription(() => navigate(`/papa/original/${encodeURIComponent(slug)}`));
  }

  return (
    <div className="home-content home-showcase">
      <section className="home-pack" aria-labelledby="home-pack-title">
        <h1 id="home-pack-title">Cozinhando para</h1>
        <div className="home-pack__grid">
          {pets.map((pet) => (
            <article key={pet.id} className="home-pack__pet">
              <span className={`home-pack__portrait${pet.photoPath ? '' : ' home-pack__portrait--fallback'}`}>
                <img src={pet.photoPath || zillaIcon} alt={pet.photoPath ? `Foto de ${pet.name}` : ''} />
              </span>
              <strong>{pet.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="home-personalized-card">
        <img className="home-personalized-card__zilla" src={zillaChef} alt="Zilla vestido de chef" />
        <div className="home-personalized-card__copy">
          <small>SUA RECEITA</small>
          <h2>Receita personalizada</h2>
          <p>
            Balanceada para o pet escolhido na próxima etapa, com metodologias usadas por profissionais e
            recomendadas por órgãos de saúde animal.
          </p>
        </div>
        <button type="button" className="pz-button pz-button--primary wide" onClick={createRecipe}>
          Criar uma receita <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="home-originals" aria-labelledby="home-originals-title">
        <header className="home-originals__heading">
          <div>
            <small>PAPAZILLA ORIGINALS</small>
            <h2 id="home-originals-title">Favoritas da cozinha</h2>
          </div>
        </header>

        <div className="home-originals__grid">
          {ORIGINAL_RECIPES.map((original) => (
            <button
              key={original.slug}
              type="button"
              className="home-original"
              aria-label={`${original.title}. Conteúdo exclusivo para assinantes.`}
              onClick={() => openOriginal(original.slug)}
            >
              <span className="home-original__photo">
                <img className="home-original__dish" src={original.image} alt="" />
                <img className="home-original__locked" src={lockedIcon} alt="" aria-hidden="true" />
                <span className="home-original__likes" aria-label={`${original.likes} pessoas amaram`}>
                  <img src={loveIcon} alt="" aria-hidden="true" />
                  {original.likes}
                </span>
              </span>
              <span className="home-original__copy">
                <strong>{original.title}</strong>
                <small>{original.subtitle}</small>
              </span>
            </button>
          ))}
        </div>

        <p className="home-originals__note">
          <img src={calculatorIcon} alt="" aria-hidden="true" />
          <span>As quantidades de cada Original são calculadas para o perfil selecionado na próxima etapa.</span>
        </p>
      </section>
    </div>
  );
}
