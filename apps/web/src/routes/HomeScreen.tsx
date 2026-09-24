import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import calculatorIcon from '../assets/icons/calculator.webp';
import lockedIcon from '../assets/icons/locked.webp';
import loveIcon from '../assets/icons/love.webp';
import zillaChef from '../assets/originals/zilla-chef.webp';
import { listPets } from '../lib/petsStore.js';
import { ORIGINAL_RECIPES } from '../lib/originalRecipes.js';
import { getSubscription, hasActiveAccess } from '../lib/subscription.js';

const ORIGINAL_LIKES_KEY = 'papazilla.originalLikes';

function readLikedOriginals(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORIGINAL_LIKES_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((slug): slug is string => typeof slug === 'string') : [];
  } catch {
    return [];
  }
}

function storeLikedOriginals(slugs: string[]): void {
  try {
    localStorage.setItem(ORIGINAL_LIKES_KEY, JSON.stringify(slugs));
  } catch {
    /* storage indisponível — o estado continua funcionando durante a sessão */
  }
}

/**
 * Vitrine Papá. Os retratos da matilha são informativos: a escolha dos pets
 * acontece somente no fluxo da receita. Tanto a Personalizada quanto as
 * Originals passam primeiro pela carta de benefícios; é nela que o acesso é
 * conferido antes de seguir para a configuração ou para a assinatura.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const pets = listPets();
  const hasSubscription = hasActiveAccess(getSubscription());
  const [likedOriginals, setLikedOriginals] = useState<string[]>(readLikedOriginals);

  function createRecipe() {
    navigate('/beneficios?returnTo=recipe');
  }

  function openOriginal(slug: string) {
    navigate(`/beneficios?returnTo=${encodeURIComponent(`original:${slug}`)}`);
  }

  function toggleLike(slug: string) {
    setLikedOriginals((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      storeLikedOriginals(next);
      return next;
    });
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
          {ORIGINAL_RECIPES.map((original) => {
            const liked = likedOriginals.includes(original.slug);
            const likes = original.likes + (liked ? 1 : 0);
            return (
              <article key={original.slug} className="home-original">
                <button
                  type="button"
                  className="home-original__open"
                  aria-label={hasSubscription ? original.title : `${original.title}. Conteúdo exclusivo para assinantes.`}
                  onClick={() => openOriginal(original.slug)}
                >
                  <span className="home-original__photo">
                    <img className="home-original__dish" src={original.image} alt="" />
                    {!hasSubscription ? (
                      <img className="home-original__locked" src={lockedIcon} alt="" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="home-original__copy">
                    <strong>{original.title}</strong>
                    <small>{original.subtitle}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={`home-original__likes${liked ? ' is-liked' : ''}`}
                  aria-label={liked ? `Remover curtida de ${original.title}` : `Curtir ${original.title}`}
                  aria-pressed={liked}
                  onClick={() => toggleLike(original.slug)}
                >
                  <img src={loveIcon} alt="" aria-hidden="true" />
                  <span>{likes}</span>
                </button>
              </article>
            );
          })}
        </div>

        <p className="home-originals__note">
          <img src={calculatorIcon} alt="" aria-hidden="true" />
          <span>As quantidades de cada Original são calculadas para o perfil selecionado na próxima etapa.</span>
        </p>
      </section>
    </div>
  );
}
