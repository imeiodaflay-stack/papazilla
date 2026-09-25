import type { DailyPlan } from '@papazilla/nutrition-engine';
import zillaIcon from '../assets/icons/zilla.png';
import addIcon from '../assets/icons/adicionar.png';
import infoIcon from '../assets/icons/info.png';
import type { StoredPet } from '../lib/petsStore.js';
import { formatGrams, mealSize } from '../lib/recipeDisplay.js';

/**
 * Suplementos e finalização por pet — dose do vitamínico-mineral, óleo
 * vegetal, óleo de peixe e sal, tudo calculado por `calculateDailyPlan`.
 * Compartilhado entre o resultado do wizard (`RecipeResultCard`) e a
 * receita salva (`RecipeDetailScreen`).
 *
 * Acordeão de seção no mesmo modelo de `RecipePreparationSteps` (fechado
 * por padrão, reaproveita `.recipe-preparation`) — pedido da Flay pra ficar
 * consistente com "Modo de preparo" (2026-09). Cada pet continua com seu
 * próprio acordeão por dentro quando há mais de um.
 */
export function RecipeFinalizers({ petPlans }: { petPlans: { pet: StoredPet; plan: DailyPlan }[] }) {
  return (
    <details className="recipe-preparation">
      <summary>
        <span>
          <img src={addIcon} alt="" />
          Suplementos e finalização
        </span>
        <b aria-hidden="true">⌄</b>
      </summary>
      <div className="recipe-preparation__body">
        <p className="recipe-preparation__intro">
          {petPlans.length > 1
            ? 'A base é compartilhada; as doses continuam separadas por pet.'
            : `Dose calculada sobre a porção pronta de ${petPlans[0]?.pet.name ?? 'o Monstrinho'}.`}
        </p>
        <div className="shared-recipe-note">
          <img src={infoIcon} alt="" />
          <p>
            <strong>Não aqueça o suplemento.</strong>Recomendamos adicionar Food Dog e Nutroplus só à porção já fria ou
            morna, na hora de servir — nunca direto na panela.
          </p>
        </div>
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
                <p>
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
    </details>
  );
}
