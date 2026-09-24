import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import potinhoIcon from '../assets/icons/potinho.png';
import addIcon from '../assets/icons/adicionar.png';
import zillaIcon from '../assets/icons/zilla.png';
import { getPet } from '../lib/petsStore.js';
import { addCookLog, getRecipe } from '../lib/recipeRepository.js';
import { recipeTitle } from '../lib/recipeDisplay.js';
import { fileToDataUrl, PhotoUploadError, uploadPhoto } from '../lib/photoUpload.js';
import { useScrollAwareFooter } from '../hooks/useScrollAwareFooter.js';

const RATING_CAPTIONS: Record<number, string> = {
  1: 'Não foi a favorita desta vez.',
  2: 'Não foi a favorita desta vez.',
  3: 'Curtiram a fornalha.',
  4: 'Curtiram a fornalha.',
  5: 'Amaram! Essa vai voltar para o potinho.',
};

/**
 * Registrar fornalha — fiel à tela "cook-log" de `papazilla-prototype`.
 * Preparo real: quem provou, avaliação, nota e foto entram de fato no
 * galeria persistida da receita (`recipeRepository.addCookLog`).
 */
export function RecipeCookLogScreen() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const storedRecipe = recipeId ? getRecipe(recipeId) : undefined;
  const pets = storedRecipe?.petPlans?.map(({ pet }) => pet) ?? storedRecipe?.petIds.map((id) => getPet(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)) ?? [];

  const [selectedPetIds, setSelectedPetIds] = useState<Set<string>>(() => new Set(pets.map((p) => p.id)));
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { bodyRef, dividerVisible, onBodyScroll } = useScrollAwareFooter();
  const toastTimer = useRef<number>();
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoUploading(true);
    try {
      setPhotoPath(await fileToDataUrl(file));
      setPhotoPath(await uploadPhoto('cook-photos', file));
    } catch (err) {
      setPhotoPath('');
      toast(err instanceof PhotoUploadError ? err.message : 'Não foi possível carregar a foto.');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function save() {
    if (saving || photoUploading || selectedPetIds.size === 0) return;
    setSaving(true);
    try {
      await addCookLog(storedRecipe!.id, {
        date: new Date().toISOString(), petIds: [...selectedPetIds],
        rating, note: note.trim().slice(0, 1000), photoPath,
      });
      toast('Preparo salvo com sucesso!');
      window.setTimeout(() => navigate(`/receitas/${storedRecipe!.id}`, { replace: true }), 900);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Não foi possível registrar a fornalha.');
      setSaving(false);
    }
  }

  return (
    <div className="flow-screen cook-log-view">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />
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

      <div className="flow-body cook-log-body" ref={bodyRef} onScroll={onBodyScroll}>
        <div className="flow-intro">
          <p className="eyebrow">Receita preparada</p>
          <h1>Como ficou essa fornalha?</h1>
          <p>Guarde a foto e a reação da matilha. Esse preparo entra na Galeria da receita.</p>
        </div>

        <button
          type="button"
          className="finished-photo-picker"
          onClick={() => photoInputRef.current?.click()}
          disabled={photoUploading}
        >
          <span>
            {photoPath ? (
              <img src={photoPath} alt="" className="photo-picker__preview" />
            ) : (
              <img src={addIcon} alt="" />
            )}
          </span>
          <strong>{photoUploading ? 'Enviando...' : photoPath ? 'Trocar foto do prato' : 'Adicionar foto do prato'}</strong>
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
          <span>{photoPath ? 'Legenda da foto' : 'Uma lembrança deste preparo'}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: a Mel comeu tudo e pediu mais..."
          />
        </label>
      </div>

      <footer className={`flow-footer scroll-aware-footer${dividerVisible ? ' is-divider-visible' : ''}`}>
        <button type="button" className="pz-button pz-button--outline" onClick={() => navigate(`/receitas/${storedRecipe.id}`)}>
          Agora não
        </button>
        <button type="button" className="pz-button pz-button--primary" disabled={rating === 0 || saving || photoUploading || selectedPetIds.size === 0} onClick={() => { void save(); }}>
          {saving ? 'Salvando…' : 'Salvar preparo'}
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
