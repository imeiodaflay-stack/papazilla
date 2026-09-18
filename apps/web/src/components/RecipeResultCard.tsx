import { useState } from 'react';
import type { DailyPlan, FormulationId, Recipe } from '@papazilla/nutrition-engine';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import type { StoredPet } from '../lib/petsStore.js';
import { joinPt } from '../lib/petLabel.js';
import { matchDietPreferences } from '../lib/dietPreferences.js';
import { digestionContextFor, hasDigestiveSensitivity } from '../lib/digestionSensitivity.js';
import { FORMULATION_LABELS, formatGrams, formulationSummary, mealSize, orderDisclaimers } from '../lib/recipeDisplay.js';
import { shareRecipeStoryImage } from '../lib/recipeStoryImage.js';
import { RecipeFinalizers } from './RecipeFinalizers.js';
import { RecipeIngredientTable } from './RecipeIngredientTable.js';
import { RecipePreparationSteps } from './RecipePreparationSteps.js';

/**
 * Corpo do resultado de uma receita — total, proporção, "o que pesar",
 * suplementos/finalização por pet, modo de preparo e disclaimers.
 * Compartilhado entre a última etapa do wizard (`ReceitaScreen`) e a tela
 * de detalhe de uma receita já salva (`RecipeDetailScreen`).
 *
 * "O que pesar" e "Por dia/refeição" ficam sempre visíveis — são a
 * informação mais acionável. Tudo que é contexto/observação (gostos do
 * pet, limite de petiscos, notas educacionais) vai pra dentro de um único
 * acordeão fechado por padrão, pra tela não competir com o que importa
 * (Flay, 2026-09).
 */
export function RecipeResultCard({
  recipe,
  petPlans,
  formulation,
  days,
  format,
}: {
  recipe: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  formulation: FormulationId;
  days: number;
  format: string;
}) {
  const [sharingImage, setSharingImage] = useState(false);
  const [shareImageError, setShareImageError] = useState<string | null>(null);

  async function handleShareImage() {
    setSharingImage(true);
    setShareImageError(null);
    try {
      await shareRecipeStoryImage({ recipe, petPlans, formulation });
    } catch {
      setShareImageError('Não foi possível gerar a imagem agora. Tente de novo.');
    } finally {
      setSharingImage(false);
    }
  }

  const selectedPets = petPlans.map(({ pet }) => pet);
  const { ordered: orderedDisclaimers, clinicalRequired } = orderDisclaimers(petPlans);
  const treatsMin = petPlans.reduce((sum, { plan }) => sum + plan.treatsGramsPerDay.min, 0);
  const treatsMax = petPlans.reduce((sum, { plan }) => sum + plan.treatsGramsPerDay.max, 0);
  const petsWithFrequentExtras = selectedPets.filter(
    (pet) => pet.treats === 'Muitos ao longo do dia' || pet.familyFood === 'Frequentemente',
  );
  const rowLabels = recipe.groups.flatMap((g) => g.rows.map((r) => r.label));
  const dietPreferenceNotes = selectedPets
    .map((pet) => ({ pet, ...matchDietPreferences(pet, rowLabels) }))
    .filter((m) => m.liked.length > 0 || m.avoided.length > 0);
  const sensitivePetNames = selectedPets.filter(hasDigestiveSensitivity).map((pet) => pet.name);

  return (
    <div className="recipe-result-card">
      <div className="recipe-result-card__total">
        <span>
          <small>Total da receita</small>
          <strong>{formatGrams(recipe.totalCookedGrams)}</strong>
          <small>prontos</small>
        </span>
        <img src={potinhoIcon} alt="" />
      </div>
      <div className="recipe-share-image">
        <button type="button" className="pz-button pz-button--outline wide" disabled={sharingImage} onClick={() => { void handleShareImage(); }}>
          {sharingImage ? 'Gerando imagem…' : 'Compartilhar imagem da receita'}
        </button>
        {shareImageError ? <p className="recipe-share-image__error">{shareImageError}</p> : null}
      </div>
      <div className="recipe-preset-result">
        <small>Proporção escolhida</small>
        <strong>{FORMULATION_LABELS[formulation]}</strong>
        <span>{formulationSummary(formulation)}</span>
      </div>
      {selectedPets.length > 1 ? (
        <div className="pet-portion-breakdown">
          <div>
            <small>Uma base para</small>
            <strong>{joinPt(selectedPets.map((p) => p.name))}</strong>
          </div>
          {petPlans.map(({ pet, plan }) => (
            <span key={pet.id}>
              <b>{pet.name}</b>
              <small>
                {formatGrams(plan.totalGramsPerDay)}/dia · {formatGrams(mealSize(plan, pet))}/ref.
              </small>
            </span>
          ))}
        </div>
      ) : null}
      <RecipeIngredientTable groups={recipe.groups} format={format} />
      {selectedPets.length > 1 ? (
        <div className="portion-row">
          {petPlans.map(({ pet, plan }) => (
            <span key={pet.id}>
              <small>{pet.name}</small>
              <strong>{formatGrams(plan.totalGramsPerDay)}/dia</strong>
              <b>{formatGrams(mealSize(plan, pet))}/refeição</b>
            </span>
          ))}
        </div>
      ) : (
        <div className="portion-row">
          <span>
            <small>Por dia</small>
            <strong>{formatGrams(petPlans[0]!.plan.totalGramsPerDay)}</strong>
          </span>
          <span>
            <small>Por refeição</small>
            <strong>{formatGrams(mealSize(petPlans[0]!.plan, petPlans[0]!.pet))}</strong>
          </span>
        </div>
      )}
      {clinicalRequired && orderedDisclaimers[0] ? (
        <div className="clinical-warning">
          <img src={infoIcon} alt="" />
          <p>{orderedDisclaimers[0]}</p>
        </div>
      ) : null}
      <RecipeFinalizers petPlans={petPlans} />
      <RecipePreparationSteps petPlans={petPlans} days={days} />
      <details className="recipe-preparation">
        <summary>
          <span>
            <img src={infoIcon} alt="" />
            Mais sobre esta receita
          </span>
          <b aria-hidden="true">⌄</b>
        </summary>
        <div className="recipe-preparation__body recipe-more-info">
          {dietPreferenceNotes.length > 0 ? (
            <div className="result-group">
              <h3>Gostos do seu monstrinho</h3>
              {dietPreferenceNotes.map(({ pet, liked, avoided }) => (
                <div key={pet.id} className="shared-recipe-note">
                  <img src={infoIcon} alt="" />
                  <p>
                    {liked.length > 0 ? (
                      <>
                        Você contou que {pet.name} adora {joinPt(liked)} — essa receita tem!{' '}
                      </>
                    ) : null}
                    {avoided.length > 0 ? (
                      <>
                        Fique de olho: essa receita tem {joinPt(avoided)}, que você marcou como algo que{' '}
                        {pet.name} não deveria comer. Vale revisar antes de preparar.
                      </>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="result-group">
            <h3>Limite de petiscos</h3>
            <div>
              <span>Petiscos e mimos por fora da receita</span>
              <strong>até {formatGrams(treatsMin)}–{formatGrams(treatsMax)}/dia</strong>
            </div>
            <p className="pz-note">10% a 15% do total diário — inclui petiscos, comida da família e qualquer coisa fora do potinho.</p>
            {petsWithFrequentExtras.length > 0 ? (
              <div className="shared-recipe-note">
                <img src={infoIcon} alt="" />
                <p>
                  Você contou na Anamnese que {joinPt(petsWithFrequentExtras.map((p) => p.name))}{' '}
                  {petsWithFrequentExtras.length > 1 ? 'recebem' : 'recebe'} petiscos ou comida da família com
                  frequência — vale medir ou contar o quanto isso já soma antes de completar com essa receita, pra
                  não passar do limite.
                </p>
              </div>
            ) : null}
          </div>
          {recipe.notes.length > 0 ? (
            <div className="result-group">
              <h3>Vale saber</h3>
              {recipe.notes.map((note) => {
                const context = digestionContextFor(note, sensitivePetNames);
                return (
                  <div key={note.code} className="shared-recipe-note">
                    <img src={infoIcon} alt="" />
                    <p>
                      {note.text}
                      {context ? <><br />{context}</> : null}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
          {orderedDisclaimers.slice(clinicalRequired ? 1 : 0).map((text, i) => (
            <div key={i} className="shared-recipe-note">
              <img src={infoIcon} alt="" />
              <p>{text}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
