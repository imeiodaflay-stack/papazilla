import type { DailyPlan } from '@papazilla/nutrition-engine';
import zillaIcon from '../assets/icons/zilla.png';
import addIcon from '../assets/icons/adicionar.png';
import infoIcon from '../assets/icons/info.png';
import type { StoredPet } from '../lib/petsStore.js';
import { formatGrams, mealSize } from '../lib/recipeDisplay.js';

/**
 * Suplementos e finalização por pet (accordion) — dose do vitamínico-
 * mineral, óleo vegetal, óleo de peixe e sal, tudo calculado por
 * `calculateDailyPlan`. Compartilhado entre o resultado do wizard
 * (`RecipeResultCard`) e a receita salva (`RecipeDetailScreen`).
 */
export function RecipeFinalizers({ petPlans }: { petPlans: { pet: StoredPet; plan: DailyPlan }[] }) {
  return (
    <div className="supplement-result">
      <div className="supplement-result__title">
        <img src={addIcon} alt="" />
        <span>
          <small>Também entra no potinho</small>
          <h3>Suplementos e finalização</h3>
        </span>
      </div>
      <p className="supplement-context">
        {petPlans.length > 1
          ? 'A base é compartilhada; as doses continuam separadas por pet.'
          : `Dose calculada sobre a porção pronta de ${petPlans[0]?.pet.name ?? 'o Monstrinho'}.`}
      </p>
      <div className="pet-finalizers">
        {petPlans.map(({ pet, plan }, index) => (
          <details key={pet.id} className="pet-finalizer-card" open={petPlans.length === 1 || index === 0}>
            <summary>
              <span className="pet-finalizer-card__pet">
                <i className="recipe-pet-avatar">
                  <img src={zillaIcon} alt="" />
                </i>
                <span>
                  <strong>{pet.name}</strong>
                  <small>
                    {formatGrams(plan.totalGramsPerDay)}/dia · {formatGrams(mealSize(plan, pet))} por refeição
                  </small>
                </span>
              </span>
              <b aria-hidden="true">⌄</b>
            </summary>
            <div className="pet-finalizer-card__doses">
              <p>
                <span>
                  <strong>{plan.supplement.name}</strong>
                  <small>{plan.supplement.ramp}</small>
                </span>
                <b>{plan.supplement.doseGramsPerDay.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g/dia</b>
              </p>
              <p>
                <span>
                  <strong>Óleo vegetal</strong>
                  <small>{plan.vegetableOil.note}</small>
                </span>
                <b>{plan.vegetableOil.dose}</b>
              </p>
              <p>
                <span>
                  <strong>Óleo de peixe ou krill</strong>
                  <small>Diário ou 3× por semana</small>
                </span>
                <b>{plan.fishOil.dose}</b>
              </p>
              <p className="pet-finalizer-card__salt">
                <span>
                  <strong>Sal integral</strong>
                  <small>{plan.saltGuidance}</small>
                </span>
                <b>Opcional</b>
              </p>
            </div>
          </details>
        ))}
      </div>
      {petPlans.length > 1 ? (
        <aside className="shared-finalizer-warning">
          <img src={infoIcon} alt="" />
          <span>Separe as porções de cada pet antes de adicionar suplementos, óleos e doses individuais.</span>
        </aside>
      ) : null}
    </div>
  );
}
