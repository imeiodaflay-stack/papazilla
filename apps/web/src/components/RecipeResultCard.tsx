import type { DailyPlan, FormulationId, Recipe } from '@papazilla/nutrition-engine';
import potinhoIcon from '../assets/icons/potinho.png';
import infoIcon from '../assets/icons/info.png';
import type { StoredPet } from '../lib/petsStore.js';
import { joinPt } from '../lib/petLabel.js';
import {
  FORMULATION_LABELS,
  formatGrams,
  formatRowAmount,
  formulationSummary,
  mealSize,
  orderDisclaimers,
} from '../lib/recipeDisplay.js';
import { RecipeFinalizers } from './RecipeFinalizers.js';
import { RecipePreparationSteps } from './RecipePreparationSteps.js';

/**
 * Corpo do resultado de uma receita — total, proporção, "o que pesar",
 * suplementos/finalização por pet, modo de preparo e disclaimers.
 * Compartilhado entre a última etapa do wizard (`ReceitaScreen`) e a tela
 * de detalhe de uma receita já salva (`RecipeDetailScreen`).
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
  const selectedPets = petPlans.map(({ pet }) => pet);
  const { ordered: orderedDisclaimers, clinicalRequired } = orderDisclaimers(petPlans);
  const treatsMin = petPlans.reduce((sum, { plan }) => sum + plan.treatsGramsPerDay.min, 0);
  const treatsMax = petPlans.reduce((sum, { plan }) => sum + plan.treatsGramsPerDay.max, 0);
  const petsWithFrequentExtras = selectedPets.filter(
    (pet) => pet.treats === 'Muitos ao longo do dia' || pet.familyFood === 'Frequentemente',
  );

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
                {formatGrams(plan.totalGramsPerDay)}/dia · {formatGrams(mealSize(plan))}/ref.
              </small>
            </span>
          ))}
        </div>
      ) : null}
      <div className="result-group">
        <h3>O que pesar</h3>
        {recipe.groups
          .filter((g) => g.key !== 'herbs')
          .map((group) => (
            <div key={group.key}>
              <span>{group.rows.map((r) => r.label).join(', ')}</span>
              <strong>{group.rows.map((r) => formatRowAmount(r, format)).join(' + ')}</strong>
            </div>
          ))}
      </div>
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
          {recipe.notes.map((note) => (
            <div key={note.code} className="shared-recipe-note">
              <img src={infoIcon} alt="" />
              <p>{note.text}</p>
            </div>
          ))}
        </div>
      ) : null}
      <RecipeFinalizers petPlans={petPlans} />
      <RecipePreparationSteps petPlans={petPlans} days={days} />
      {selectedPets.length > 1 ? (
        <div className="portion-row">
          {petPlans.map(({ pet, plan }) => (
            <span key={pet.id}>
              <small>{pet.name}</small>
              <strong>{formatGrams(plan.totalGramsPerDay)}/dia</strong>
              <b>{formatGrams(mealSize(plan))}/refeição</b>
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
            <strong>{formatGrams(mealSize(petPlans[0]!.plan))}</strong>
          </span>
        </div>
      )}
      {orderedDisclaimers.map((text, i) => (
        <div key={i} className={i === 0 && clinicalRequired ? 'clinical-warning' : 'shared-recipe-note'}>
          <img src={infoIcon} alt="" />
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}
