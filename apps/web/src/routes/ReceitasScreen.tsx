import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import buscaIcon from '../assets/icons/busca.png';
import potinhoIcon from '../assets/icons/potinho.png';
import { AppNav } from '../components/AppNav.js';
import { listPets } from '../lib/petsStore.js';
import { listRecipes } from '../lib/recipesStore.js';
import { joinPt } from '../lib/petLabel.js';
import { recipeTitle, relativeTimeLabel } from '../lib/recipeDisplay.js';

/**
 * Receitas salvas — fiel à tela "saved-recipes" de `papazilla-prototype`,
 * mas 100% com dados reais: nenhuma foto, contagem de preparo ou avaliação
 * é inventada. `recipesStore.ts` só guarda o que o wizard e o registro de
 * fornalha (`RecipeCookLogScreen`) realmente gravaram.
 *
 * Diferença consciente: o protótipo mostrava fotos ilustrativas e "Feita 4
 * vezes"/"♥ 5" fixos. Aqui toda receita nova aparece sem foto (estado
 * "Sem foto ainda", que já existia no próprio protótipo pra um dos casos) e
 * sem preparo registrado até o tutor de fato usar "Registrar fornalha".
 */
export function ReceitasScreen() {
  const navigate = useNavigate();
  const pets = listPets();
  const recipes = listRecipes();
  const [filter, setFilter] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const visible = filter === 'all' ? recipes : recipes.filter((r) => r.petIds.includes(filter));

  return (
    <div className="app-view">
      <header className="app-header saved-header">
        <div>
          <p className="eyebrow">Sua cozinha</p>
          <h1>Receitas salvas</h1>
        </div>
        <button
          type="button"
          className="recipe-search"
          aria-label="Buscar receitas"
          onClick={() => toast('A busca por nome ou ingrediente será aberta aqui.')}
        >
          <img src={buscaIcon} alt="" />
        </button>
      </header>

      <main className="app-view__main">
        <div className="saved-content">
          {recipes.length === 0 ? (
            <div className="pz-card">
              <p>Nenhuma receita salva ainda.</p>
              <p className="pz-note">Monte uma receita no Papá para ela aparecer aqui.</p>
            </div>
          ) : (
            <>
              {pets.length > 0 ? (
                <div className="recipe-filters" role="group" aria-label="Filtrar receitas por pet">
                  <button type="button" className={filter === 'all' ? 'is-selected' : undefined} onClick={() => setFilter('all')}>
                    Todas
                  </button>
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      className={filter === pet.id ? 'is-selected' : undefined}
                      onClick={() => setFilter(pet.id)}
                    >
                      {pet.name}
                    </button>
                  ))}
                </div>
              ) : null}

              <p className="saved-count">
                {visible.length} {visible.length === 1 ? 'receita' : 'receitas'} na sua coleção
              </p>

              <div className="saved-recipe-list">
                {visible.map((recipe) => {
                  const recipePets = pets.filter((p) => recipe.petIds.includes(p.id));
                  const petNames = recipePets.length > 0 ? joinPt(recipePets.map((p) => p.name)) : 'matilha';
                  const cookCount = recipe.cookLogs.length;
                  const ratings = recipe.cookLogs.map((l) => l.rating).filter((r) => r > 0);
                  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      className="saved-recipe-card"
                      onClick={() => navigate(`/receitas/${recipe.id}`)}
                    >
                      <span className="recipe-photo recipe-photo--empty">
                        <img src={potinhoIcon} alt="" />
                        <em>Sem foto ainda</em>
                      </span>
                      <span className="saved-recipe-card__body">
                        <small>
                          Para {petNames} · {relativeTimeLabel(recipe.createdAt)}
                        </small>
                        <strong>{recipeTitle(recipe.selection)}</strong>
                        <span className="recipe-card-meta">
                          <b>{cookCount === 0 ? 'Ainda não preparada' : cookCount === 1 ? 'Feita 1 vez' : `Feita ${cookCount} vezes`}</b>
                          {avgRating !== null ? <b>♥ {avgRating.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</b> : null}
                        </span>
                      </span>
                      <span className="saved-recipe-card__arrow" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <AppNav />

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
