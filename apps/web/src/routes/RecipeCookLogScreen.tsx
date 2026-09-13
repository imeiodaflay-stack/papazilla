import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import potinhoIcon from '../assets/icons/potinho.png';
import addIcon from '../assets/icons/adicionar.png';
import zillaIcon from '../assets/icons/zilla.png';
import { getPet } from '../lib/petsStore.js';
import { addCookLog, getRecipe } from '../lib/recipesStore.js';
import { recipeTitle } from '../lib/recipeDisplay.js';

const RATING_CAPTIONS: Record<number, string> = {
  1: 'Não foi a favorita desta vez.',
  2: 'Não foi a favorita desta vez.',
  3: 'Curtiram a fornalha.',
  4: 'Curtiram a fornalha.',
  5: 'Amaram! Essa vai voltar para o potinho.',
};

/**
 * Registrar fornalha — fiel à tela "cook-log" de `papazilla-prototype`.
 * Preparo real: quem provou, avaliação e nota entram de fato no histórico
 * da receita (`recipesStore.addCookLog`). Foto fica só como toast — a
 * captura real de câmera/galeria não existe em nenhuma outra tela do app.
 */
export function RecipeCookLogScreen() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const storedRecipe = recipeId ? getRecipe(recipeId) : undefined;
  const pets = storedRecipe?.petIds.map((id) => getPet(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)) ?? [];

  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(() => new Set(pets.map((p) => p.id)));
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  if (!storedRecipe || pets.length === 0) return <Navigate to="/receitas" replace />;

  function togglePet(id: string) {
    setSelectedPetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    addCookLog(storedRecipe!.id, {
      date: new Date().toISOString(),
      petIds: [...selectedPetIds],
      rating,
      note: note.trim(),
    });
    toast('Preparo salvo com sucesso!');
    window.setTimeout(() => navigate(`/receitas/${storedRecipe!.id}`, { replace: true }), 900);
  }

  return (
    <div className="flow-screen cook-log-view">
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
          <span className="flow-header__eyebrow">{recipeTitle(storedRecipe.selection)}</span>
          <strong>Registrar fornalha</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={potinhoIcon} alt="" />
        </span>
      </header>

      <div className="flow-progress">
        <span style={{ width: '100%' }} />
      </div>

      <div className="flow-body cook-log-body">
        <div className="flow-intro">
          <p className="eyebrow">Receita preparada</p>
          <h1>Como ficou essa fornalha?</h1>
          <p>Guarde a foto e a reação da matilha. Esse preparo entra no histórico da receita.</p>
        </div>

        <button
          type="button"
          className="finished-photo-picker"
          onClick={() => toast('A câmera ou a galeria será aberta aqui.')}
        >
          <span>
            <img src={addIcon} alt="" />
          </span>
          <strong>Adicionar foto do prato</strong>
          <small>Tirar foto ou escolher da galeria · opcional</small>
        </button>

        {pets.length > 1 ? (
          <div className="question-block cook-pets">
            <h3>Quem provou?</h3>
            <div>
              {pets.map((pet) => {
                const isSelected = selectedPetIds.has(pet.id);
                return (
                  <button
                    key={pet.id}
                    type="button"
                    className={`cook-pet${isSelected ? ' is-selected' : ''}`}
                    onClick={() => togglePet(pet.id)}
                  >
                    <span>
                      <img src={zillaIcon} alt="" />
                    </span>
                    {pet.name} <i aria-hidden="true">✓</i>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="question-block">
          <h3>Os Monstrinhos curtiram?</h3>
          <div className="recipe-rating" role="group" aria-label="Avaliação da receita">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={value <= rating ? 'is-on' : undefined}
                aria-label={`${value} de 5`}
                onClick={() => setRating(value)}
              >
                ♥
              </button>
            ))}
          </div>
          {rating > 0 ? <p className="rating-caption">{RATING_CAPTIONS[rating]}</p> : null}
        </div>

        <label className="cook-note">
          <span>Uma lembrança deste preparo</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: a Mel comeu tudo e pediu mais..."
          />
        </label>
      </div>

      <footer className="flow-footer">
        <button type="button" className="pz-button pz-button--outline" onClick={() => navigate(`/receitas/${storedRecipe.id}`)}>
          Agora não
        </button>
        <button type="button" className="pz-button pz-button--primary" disabled={rating === 0} onClick={save}>
          Salvar preparo
        </button>
      </footer>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
