import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import calculatorIcon from '../assets/icons/calculator.webp';
import lockedIcon from '../assets/icons/locked.webp';
import loveIcon from '../assets/icons/love.webp';
import { ORIGINAL_RECIPES } from '../lib/originalRecipes.js';
import { getSubscription, hasActiveAccess } from '../lib/subscription.js';
import { listPets } from '../lib/petsStore.js';
import { listRecipes } from '../lib/recipeRepository.js';
import { displayRecipeTitle, latestRecipePhotoPath, relativeTimeLabel } from '../lib/recipeDisplay.js';
import { joinPt } from '../lib/petLabel.js';
import { draftFromRecipe } from '../lib/fornalhaFlow.js';
import { getPapaSelectedPets, getStock } from '../lib/fornalhaStore.js';
import { StockStrip } from '../components/FornalhaUi.js';

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
    /* segue sem persistir */
  }
}

/**
 * Planejar (1 e 1a): repetir a última receita, criar uma nova, começar por
 * uma Papazilla Original ou enviar prescrição.
 */
export function PlanejarScreen() {
  const navigate = useNavigate();
  const pets = listPets();
  const selectedIds = getPapaSelectedPets()?.filter((id) => pets.some((p) => p.id === id)) ?? [];
  const petIds = selectedIds.length > 0 ? selectedIds : pets.map((p) => p.id);
  const petNames = joinPt(pets.filter((p) => petIds.includes(p.id)).map((p) => p.name));
  const hasSubscription = hasActiveAccess(getSubscription());
  const last = listRecipes()[0];
  const stock = getStock();
  const [likedOriginals, setLikedOriginals] = useState<string[]>(readLikedOriginals);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2800);
  }

  function gate(path: string, returnTo: string, state?: unknown) {
    if (hasSubscription) navigate(path, state ? { state } : undefined);
    else navigate(`/assinatura?returnTo=${encodeURIComponent(returnTo)}`);
  }

  function repeatLast() {
    if (!last) return;
    draftFromRecipe(last, petIds);
    gate('/receita', 'recipe', { editing: true });
  }

  function toggleLike(slug: string) {
    setLikedOriginals((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      storeLikedOriginals(next);
      return next;
    });
  }

  const lastPhoto = last ? latestRecipePhotoPath(last) : null;

  return (
    <div className="home-content home-showcase fz-stack">
      {stock ? <StockStrip stock={stock} onClick={() => navigate('/papa')} /> : null}

      {last ? (
        <section className="fz-card" style={{ padding: 0, overflow: 'hidden' }} aria-labelledby="fz-ultima">
          {lastPhoto ? <img src={lastPhoto} alt="" style={{ display: 'block', width: '100%', height: 150, objectFit: 'cover' }} /> : null}
          <div className="fz-stack" style={{ gap: '0.4rem', padding: '1.1rem 1.2rem 1.2rem' }}>
            <p className="fz-kicker">Última receita</p>
            <h1 id="fz-ultima" className="fz-h2">{displayRecipeTitle(last)}</h1>
            <p className="fz-muted">{relativeTimeLabel(last.createdAt)} · {last.days} dias</p>
            <button type="button" className="pz-button pz-button--primary wide" style={{ marginTop: '0.4rem' }} onClick={repeatLast}>Repetir a última <span aria-hidden="true">→</span></button>
            <p className="fz-muted" style={{ textAlign: 'center', fontSize: '0.8125rem' }}>Você confere a matilha e pode trocar ingredientes.</p>
          </div>
        </section>
      ) : null}

      <section className="fz-card fz-card--soft fz-stack" aria-labelledby="fz-nova" style={{ gap: '0.75rem' }}>
        <h2 id="fz-nova" className="fz-h2">{last ? 'Ou crie uma receita nova' : `Vamos criar a primeira fornalha de ${petNames}?`}</h2>
        <p className="fz-muted">Você escolhe os ingredientes e o Papazilla calcula a porção de cada um.</p>
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => gate('/receita', 'recipe', { petIds })}>
          Criar receita nova <span aria-hidden="true">→</span>
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
                  onClick={() => gate(`/papa/original/${encodeURIComponent(original.slug)}`, `original:${original.slug}`)}
                >
                  <span className="home-original__photo">
                    <img className="home-original__dish" src={original.image} alt="" />
                    {!hasSubscription ? <img className="home-original__locked" src={lockedIcon} alt="" aria-hidden="true" /> : null}
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

      <button type="button" className="pz-button pz-button--outline wide" onClick={() => toast('Enviar prescrição chega numa próxima versão do teste.')}>
        Enviar prescrição
      </button>
      {toastMsg ? <div className="pz-toast is-visible" role="status">{toastMsg}</div> : null}
    </div>
  );
}
