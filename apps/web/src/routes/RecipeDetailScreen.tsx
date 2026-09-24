import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { findItem } from '@papazilla/nutrition-engine';
import potinhoIcon from '../assets/icons/potinho.png';
import sucessoIcon from '../assets/icons/sucesso.png';
import infoIcon from '../assets/icons/info.png';
import { getPet } from '../lib/petsStore.js';
import { deleteRecipe, getRecipe, renameRecipe, setRecipeFavorite, updateCookLogPhoto } from '../lib/recipeRepository.js';
import { PhotoUploadError, uploadPhoto } from '../lib/photoUpload.js';
import { derivePredominantProtein } from '../lib/engineMapping.js';
import { buildPetPlan, buildSharedRecipe } from '../lib/recipeEngine.js';
import { displayRecipeTitle, formatGrams, orderDisclaimers, recipeIngredientSummary } from '../lib/recipeDisplay.js';
import { describePet, joinPt } from '../lib/petLabel.js';
import { RecipeFinalizers } from '../components/RecipeFinalizers.js';
import { RecipeIngredientTable } from '../components/RecipeIngredientTable.js';
import { RecipePreparationSteps } from '../components/RecipePreparationSteps.js';
import galeriaIcon from '../assets/icons/galeria.svg';

/**
 * Detalhe de uma receita salva — fiel à tela "recipe-detail" de
 * `papazilla-prototype`, com o resultado congelado no momento do salvamento e
 * "•••" de verdade: Renomear, Favoritar/Desfavoritar e Excluir (no protótipo
 * era só um toast).
 *
 * Diferenças conscientes do protótipo:
 * - Sem "A preferida da Mel": o eyebrow usa o nome do(s) pet(s); "favorita"
 *   agora é um estado real que o tutor liga/desliga, não um texto fixo.
 * - Sem foto: nenhuma receita real tem foto capturada ainda.
 * - "Já virou tradição" só aparece quando há pelo menos um preparo
 *   registrado; sem preparo nenhum, mostra um convite pra registrar o
 *   primeiro em vez de inventar um histórico.
 */
export function RecipeDetailScreen() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const storedRecipe = recipeId ? getRecipe(recipeId) : undefined;
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const [showMore, setShowMore] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(storedRecipe ? displayRecipeTitle(storedRecipe) : '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [, setCoverRevision] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  if (!storedRecipe) return <Navigate to="/receitas" replace />;

  async function toggleFavorite() {
    try {
      const next = !storedRecipe!.favorite;
      await setRecipeFavorite(storedRecipe!.id, next);
      setShowMore(false);
      toast(next ? 'Adicionada aos favoritos.' : 'Removida dos favoritos.');
    } catch (error) { toast(error instanceof Error ? error.message : 'Não foi possível atualizar.'); }
  }

  async function saveRename() {
    try {
      await renameRecipe(storedRecipe!.id, titleInput);
      setRenaming(false);
      setShowMore(false);
      toast('Receita renomeada.');
    } catch (error) { toast(error instanceof Error ? error.message : 'Não foi possível renomear.'); }
  }

  async function confirmDelete() {
    try {
      await deleteRecipe(storedRecipe!.id);
      navigate('/receitas', { replace: true });
    } catch (error) { toast(error instanceof Error ? error.message : 'Não foi possível excluir.'); }
  }

  const pets = storedRecipe.petPlans?.map(({ pet }) => pet) ?? storedRecipe.petIds.map((id) => getPet(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (pets.length === 0) return <Navigate to="/receitas" replace />;

  const predominantProtein = derivePredominantProtein(
    storedRecipe.selection.proteins.map((id) => findItem(id)).filter((it): it is NonNullable<typeof it> => Boolean(it)),
  );
  const choices = { formulation: storedRecipe.formulation, supplement: storedRecipe.supplement, predominantProtein };
  const petPlans = storedRecipe.petPlans ?? pets.map((pet) => ({ pet, plan: buildPetPlan(pet, choices) }));
  const recipe = storedRecipe.result ?? buildSharedRecipe(petPlans.map((p) => p.plan), storedRecipe.selection, storedRecipe.days);
  const { ordered: orderedDisclaimers, clinicalRequired } = orderDisclaimers(petPlans);

  const cookCount = storedRecipe.cookLogs.length;
  const ratings = storedRecipe.cookLogs.map((l) => l.rating).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
  const galleryLogs = [...storedRecipe.cookLogs]
    .filter((log) => Boolean(log.photoPath))
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestCookLog = [...storedRecipe.cookLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const coverLog = galleryLogs[0];

  async function handleCoverPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    const targetLog = coverLog ?? latestCookLog;
    if (!file || !targetLog || coverUploading) return;

    setCoverUploading(true);
    try {
      const photoPath = await uploadPhoto('cook-photos', file);
      await updateCookLogPhoto(storedRecipe!.id, targetLog.id, photoPath);
      setCoverRevision((revision) => revision + 1);
      toast(coverLog ? 'Foto da receita atualizada.' : 'Foto adicionada à receita.');
    } catch (error) {
      toast(error instanceof PhotoUploadError || error instanceof Error ? error.message : 'Não foi possível atualizar a foto.');
    } finally {
      setCoverUploading(false);
    }
  }

  const headerTitle = pets.length > 1 ? `Para ${joinPt(pets.map((p) => p.name))}` : `Para ${describePet(pets[0]).article} ${pets[0]!.name}`;
  const eyebrowTitle =
    pets.length > 1
      ? `Receita de ${joinPt(pets.map((p) => p.name))}`
      : `Receita ${describePet(pets[0]).preposition} ${pets[0]!.name}`;

  return (
    <div className="flow-screen recipe-detail-view">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => { void handleCoverPhotoChange(event); }}
      />
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para receitas salvas"
          onClick={() => navigate('/receitas')}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Receita salva</span>
          <strong>{headerTitle}</strong>
        </div>
        <button
          type="button"
          className="flow-header__avatar recipe-detail-menu"
          aria-label="Mais opções"
          onClick={() => setShowMore((v) => !v)}
        >
          •••
        </button>
      </header>

      <div className="flow-body recipe-detail-body">
        {showMore ? (
          <div className="more-menu">
            <button
              type="button"
              className="more-menu__item"
              onClick={() => {
                setTitleInput(displayRecipeTitle(storedRecipe));
                setRenaming(true);
                setShowMore(false);
              }}
            >
              Renomear
            </button>
            <button type="button" className="more-menu__item" onClick={() => { void toggleFavorite(); }}>
              {storedRecipe.favorite ? 'Desfavoritar' : 'Favoritar'}
            </button>
            <button
              type="button"
              className="more-menu__item more-menu__item--danger"
              onClick={() => {
                setConfirmingDelete(true);
                setShowMore(false);
              }}
            >
              Excluir receita
            </button>
          </div>
        ) : null}

        {renaming ? (
          <div className="pet-section">
            <label className="profile-field profile-field--full">
              <span>Nome da receita</span>
              <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} autoFocus />
            </label>
            <div className="confirm-actions">
              <button type="button" className="pz-button pz-button--outline" onClick={() => setRenaming(false)}>
                Cancelar
              </button>
              <button type="button" className="pz-button pz-button--primary" disabled={!titleInput.trim()} onClick={() => { void saveRename(); }}>
                Salvar
              </button>
            </div>
          </div>
        ) : null}

        {confirmingDelete ? (
          <div className="pet-section">
            <div className="clinical-warning">
              <img src={infoIcon} alt="" />
              <p>
                <strong>Excluir esta receita?</strong>
                <span>Essa ação não pode ser desfeita. A receita e os preparos registrados nela serão apagados.</span>
              </p>
            </div>
            <div className="confirm-actions">
              <button type="button" className="pz-button pz-button--outline" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </button>
              <button type="button" className="pz-button pz-button--primary" onClick={() => { void confirmDelete(); }}>
                Sim, excluir
              </button>
            </div>
          </div>
        ) : null}

        {coverLog?.photoPath ? (
          <button
            type="button"
            className="recipe-detail-photo recipe-photo recipe-detail-photo--change"
            disabled={coverUploading}
            onClick={() => coverInputRef.current?.click()}
          >
            <img
              src={coverLog.photoPath}
              alt={`Foto de ${displayRecipeTitle(storedRecipe)}`}
              className="recipe-photo__cover"
            />
            <span>{coverUploading ? 'Enviando…' : 'Trocar foto'}</span>
          </button>
        ) : (
          <button
            type="button"
            className="recipe-detail-photo recipe-photo recipe-photo--empty recipe-detail-photo--add"
            disabled={coverUploading}
            onClick={() => latestCookLog ? coverInputRef.current?.click() : navigate(`/receitas/${storedRecipe.id}/preparo`)}
          >
            <img src={potinhoIcon} alt="" />
            <em>Sem foto ainda</em>
            <small>{coverUploading ? 'Enviando…' : 'Adicionar foto'}</small>
          </button>
        )}

        <div className="recipe-detail-title">
          <p className="eyebrow">
            {eyebrowTitle}
            {storedRecipe.favorite ? ' · ★ Favorita' : ''}
          </p>
          <h1>{displayRecipeTitle(storedRecipe)}</h1>
          <p>{recipeIngredientSummary(storedRecipe.selection)}</p>
        </div>

        {cookCount > 0 ? (
          <div className="times-cooked">
            <img src={sucessoIcon} alt="" />
            <span>
              <small>Já virou tradição</small>
              <strong>
                Você preparou esta receita <b>{cookCount === 1 ? '1 vez' : `${cookCount} vezes`}</b>
              </strong>
            </span>
          </div>
        ) : (
          <div className="shared-recipe-note">
            <img src={infoIcon} alt="" />
            <p>
              <strong>Ainda sem preparo registrado</strong>Depois de cozinhar, registre a fornalha para guardar esse momento na
              Galeria.
            </p>
          </div>
        )}

        <div className="recipe-quick-stats">
          <span>
            <small>Rendimento</small>
            <strong>
              {storedRecipe.days} {storedRecipe.days === 1 ? 'dia' : 'dias'}
            </strong>
          </span>
          <span>
            <small>Por dia</small>
            <strong>{formatGrams(recipe.cookedGramsPerDay)}</strong>
          </span>
          <span>
            <small>Avaliação</small>
            <strong>{avgRating !== null ? `♥ ${avgRating.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}` : '—'}</strong>
          </span>
        </div>

        <RecipeIngredientTable groups={recipe.groups} format={storedRecipe.format} />

        {recipe.notes.length > 0 ? (
          <div className="result-group">
            <h3>Vale saber</h3>
            {recipe.notes.map((note) => (
              <div key={note.code} className="shared-recipe-note">
                <img src={infoIcon} alt="" />
                <p>{note.text}</p>
              </div>
            ))}
          </div>
        ) : null}

        <RecipeFinalizers petPlans={petPlans} />
        <RecipePreparationSteps petPlans={petPlans} days={storedRecipe.days} />

        <section className="recipe-detail-actions" aria-label="Ações da receita">
          <button type="button" className="pz-button pz-button--outline wide" onClick={() => navigate(`/receitas/${storedRecipe.id}/compartilhar`)}>
            Compartilhar para revisão veterinária
          </button>
          <button
            type="button"
            className="pz-button pz-button--primary wide"
            onClick={() => navigate(`/receitas/${storedRecipe.id}/preparo`)}
          >
            Preparar novamente
          </button>
        </section>

        <section className="recipe-gallery" aria-labelledby="recipe-gallery-title">
          <div className="recipe-gallery__heading">
            <div>
              <p className="eyebrow">Galeria</p>
              <h2 id="recipe-gallery-title">Fornalhas dos seus Monstrinhos</h2>
            </div>
            <span>{galleryLogs.length} {galleryLogs.length === 1 ? 'foto' : 'fotos'}</span>
          </div>

          {galleryLogs.length > 0 ? (
            <div className="recipe-gallery__grid">
              {galleryLogs.map((log) => (
                <article key={log.id} className="recipe-gallery-card">
                  <div className="recipe-gallery-card__photo">
                    <img
                      src={log.photoPath}
                      alt={log.note ? `Fornalha: ${log.note}` : 'Foto de uma fornalha desta receita'}
                    />
                    <span aria-label={`Avaliação ${log.rating} de 5`}>♥ {log.rating}</span>
                  </div>
                  <time dateTime={log.date}>
                    {new Date(log.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </time>
                  {log.note ? <p>{log.note}</p> : <small>Sem legenda</small>}
                </article>
              ))}
            </div>
          ) : (
            <div className="recipe-gallery__empty">
              <span><img src={galeriaIcon} alt="" /></span>
              <h3>Sua galeria está começando</h3>
              <p>Adicione uma foto na próxima fornalha para guardar esse momento aqui.</p>
              <button type="button" onClick={() => navigate(`/receitas/${storedRecipe.id}/preparo`)}>
                Registrar uma fornalha
              </button>
            </div>
          )}
        </section>

        {orderedDisclaimers.map((text, i) => (
          <div key={i} className={i === 0 && clinicalRequired ? 'clinical-warning' : 'shared-recipe-note'}>
            <img src={infoIcon} alt="" />
            <p>{text}</p>
          </div>
        ))}
      </div>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
