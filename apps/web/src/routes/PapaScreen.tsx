import { useMemo } from 'react';
import { buildRecipe, calculateDailyPlan, type DailyPlanInput } from '@papazilla/nutrition-engine';

/**
 * Área Papá — criação de receita. Wizard (pets → proporção → ingredientes → dias →
 * resultado) e paywall na primeira receita entram nas próximas fatias.
 *
 * Abaixo, uma amostra do motor portado rodando dentro do app (12 kg, adulto), para
 * validar a integração `@papazilla/nutrition-engine` de ponta a ponta.
 */
const demoInput: DailyPlanInput = {
  currentWeightKg: 12,
  goal: 'quality',
  lifeStage: 'adult',
  weightTendency: 'normal',
  season: 'mild',
  formulation: 'padrao',
  supplement: 'food-dog',
  predominantProtein: 'chicken-pork',
};

export function PapaScreen() {
  const { plan, recipe } = useMemo(() => {
    const plan = calculateDailyPlan(demoInput);
    const recipe = buildRecipe({
      plan,
      days: 3,
      selection: {
        proteins: ['frango_peito', 'boi_musculo'],
        organs: ['figado'],
        carbs: ['batata_doce'],
        vegetables: ['cenoura', 'abobora'],
        herbs: ['salsinha'],
      },
    });
    return { plan, recipe };
  }, []);

  return (
    <section className="pz-screen">
      <h1>Criar receita</h1>
      <p>O wizard completo entra nas próximas fatias. Abaixo, o motor portado em ação.</p>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Amostra do motor (motor v{plan.engineVersion})</h2>
        <p>
          12 kg, adulto, proporção padrão — <strong>{plan.totalGramsPerDay} g/dia</strong> ({plan.percentOfWeight}% do peso),
          {' '}
          {plan.mealsPerDay} refeições.
        </p>
        <p>
          Suplemento {plan.supplement.name}: {plan.supplement.doseGramsPerDay.toFixed(1)} g/dia.
        </p>
        <p>
          Receita de {recipe.days} dias — total {Math.round(recipe.totalCookedGrams)} g prontos (≈
          {Math.round(recipe.totalRawGrams)} g crus).
        </p>
        <ul style={{ paddingLeft: '1.2rem' }}>
          {recipe.groups.map((g) => (
            <li key={g.key}>
              <strong>{g.title}:</strong>{' '}
              {g.rows
                .map((r) => (r.cookedGrams != null ? `${r.label} ${Math.round(r.cookedGrams)} g` : `${r.label} — ${r.note}`))
                .join('; ')}
            </li>
          ))}
        </ul>
        {recipe.notes.length > 0 && (
          <p className="pz-note">
            {recipe.notes.length} alerta(s) contextual(is): {recipe.notes.map((n) => n.code).join(', ')}
          </p>
        )}
      </div>
    </section>
  );
}
