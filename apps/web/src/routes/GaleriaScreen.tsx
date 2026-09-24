import { useNavigate } from 'react-router-dom';
import galeriaIcon from '../assets/icons/galeria.svg';
import { AppNav } from '../components/AppNav.js';
import { getPet } from '../lib/petsStore.js';
import { listRecipes } from '../lib/recipeRepository.js';
import { displayRecipeTitle } from '../lib/recipeDisplay.js';
import { joinPt } from '../lib/petLabel.js';

/** Todas as fotos reais registradas nas fornalhas da conta. */
export function GaleriaScreen() {
  const navigate = useNavigate();
  const photos = listRecipes()
    .flatMap((recipe) => recipe.cookLogs
      .filter((log) => Boolean(log.photoPath))
      .map((log) => {
        const petNames = joinPt(log.petIds
          .map((id) => recipe.petPlans?.find(({ pet }) => pet.id === id)?.pet.name ?? getPet(id)?.name)
          .filter((name): name is string => Boolean(name)));
        return { recipe, log, petNames };
      }))
    .sort((a, b) => b.log.date.localeCompare(a.log.date));

  return (
    <div className="app-view">
      <header className="app-header gallery-header">
        <div>
          <p className="eyebrow">Memórias da cozinha</p>
          <h1>Galeria</h1>
        </div>
      </header>

      <main className="app-view__main">
        {photos.length === 0 ? (
          <section className="gallery-empty">
            <span><img src={galeriaIcon} alt="" /></span>
            <h2>Sua galeria está começando</h2>
            <p>As fotos dos preparos dos seus Monstrinhos vão aparecer aqui.</p>
          </section>
        ) : (
          <section className="gallery-feed" aria-labelledby="gallery-feed-title">
            <div className="gallery-feed__heading">
              <div>
                <p className="eyebrow">Todas as receitas</p>
                <h2 id="gallery-feed-title">Fornalhas dos seus Monstrinhos</h2>
              </div>
              <span>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
            </div>

            <div className="gallery-feed__grid">
              {photos.map(({ recipe, log, petNames }) => (
                <button
                  key={log.id}
                  type="button"
                  className="gallery-feed-card"
                  aria-label={`Abrir ${displayRecipeTitle(recipe)}`}
                  onClick={() => navigate(`/receitas/${recipe.id}`)}
                >
                  <span className="gallery-feed-card__photo">
                    <img
                      src={log.photoPath}
                      alt={log.note ? `Fornalha: ${log.note}` : `Fornalha de ${displayRecipeTitle(recipe)}`}
                    />
                    <b aria-label={`Avaliação ${log.rating} de 5`}>♥ {log.rating}</b>
                  </span>
                  <strong>{displayRecipeTitle(recipe)}</strong>
                  <small>
                    {new Date(log.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                    {petNames ? ` · ${petNames}` : ''}
                  </small>
                  {log.note ? <em>{log.note}</em> : null}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <AppNav />
    </div>
  );
}
