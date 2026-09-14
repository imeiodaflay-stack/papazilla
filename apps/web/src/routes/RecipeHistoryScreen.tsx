import { Navigate, useNavigate, useParams } from 'react-router-dom';
import sheetIcon from '../assets/icons/sheet.png';
import { getPet } from '../lib/petsStore.js';
import { getRecipe } from '../lib/recipesStore.js';
import { displayRecipeTitle } from '../lib/recipeDisplay.js';
import { joinPt } from '../lib/petLabel.js';

/**
 * Histórico completo de fornalhas de uma receita — sem tela equivalente no
 * protótipo (lá "Ver todas" era só um toast "entra na próxima rodada").
 * Lista todo `cookLogs` real da receita, mais recente primeiro.
 */
export function RecipeHistoryScreen() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const storedRecipe = recipeId ? getRecipe(recipeId) : undefined;

  if (!storedRecipe) return <Navigate to="/receitas" replace />;

  const logs = [...storedRecipe.cookLogs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para a receita"
          onClick={() => navigate(`/receitas/${storedRecipe.id}`)}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">{displayRecipeTitle(storedRecipe)}</span>
          <strong>Histórico de fornalhas</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={sheetIcon} alt="" />
        </span>
      </header>

      <div className="flow-body">
        <div className="flow-intro">
          <p className="eyebrow">Todas as vezes</p>
          <h1>{logs.length} {logs.length === 1 ? 'fornalha registrada' : 'fornalhas registradas'}</h1>
          <p>Cada preparo que você registrou desta receita, mais recente primeiro.</p>
        </div>

        <div className="cook-history-list">
          {logs.map((log) => {
            const petNames = joinPt(log.petIds.map((id) => getPet(id)?.name).filter((n): n is string => Boolean(n)));
            return (
              <article key={log.id} className="cook-history-entry">
                <div className="cook-history-entry__top">
                  <strong>
                    {new Date(log.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                  <span className="cook-history-entry__rating" aria-label={`Avaliação ${log.rating} de 5`}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <b key={v} className={v <= log.rating ? 'is-on' : undefined}>
                        ♥
                      </b>
                    ))}
                  </span>
                </div>
                {petNames ? <small>{petNames}</small> : null}
                {log.note ? <p>{log.note}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
