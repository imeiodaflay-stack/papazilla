import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { findItem } from '@papazilla/nutrition-engine';
import { buildPetPlan, buildSharedRecipe } from '../lib/recipeEngine.js';
import { derivePredominantProtein } from '../lib/engineMapping.js';
import { getPet } from '../lib/petsStore.js';
import { getRecipe } from '../lib/recipeRepository.js';
import { displayRecipeTitle, formatGrams, mealsCount } from '../lib/recipeDisplay.js';
import { RecipePreparationSteps } from '../components/RecipePreparationSteps.js';
import './recipeShare.css';

/** Página imprimível: o tutor pode salvar como PDF e enviar ao veterinário. */
export function RecipeShareScreen() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const saved = recipeId ? getRecipe(recipeId) : undefined;
  const [message, setMessage] = useState('');
  if (!saved) return <Navigate to="/receitas" replace />;

  const pets = saved.petPlans?.map(({ pet }) => pet) ?? saved.petIds
    .map((id) => getPet(id)).filter((pet): pet is NonNullable<typeof pet> => Boolean(pet));
  if (pets.length === 0) return <Navigate to="/receitas" replace />;
  const proteinItems = saved.selection.proteins.map(findItem).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const choices = {
    formulation: saved.formulation, supplement: saved.supplement,
    predominantProtein: derivePredominantProtein(proteinItems),
  };
  const petPlans = saved.petPlans ?? pets.map((pet) => ({ pet, plan: buildPetPlan(pet, choices) }));
  const recipe = saved.result ?? buildSharedRecipe(petPlans.map(({ plan }) => plan), saved.selection, saved.days);
  const clinical = petPlans.some(({ plan }) => plan.clinicalReviewRequired);
  const title = displayRecipeTitle(saved);
  const created = new Date(saved.createdAt).toLocaleDateString('pt-BR');
  const rows = recipe.groups.flatMap((group) => group.rows.map((row) => ({ group: group.title, ...row })));
  const plainText = [
    `Papazilla — ${title}`, `Criada em ${created} · Motor ${recipe.engineVersion}`,
    `Rendimento: ${saved.days} dias · ${formatGrams(recipe.totalCookedGrams)} prontos no total`,
    ...petPlans.flatMap(({ pet, plan }) => [
      `\n${pet.name} — ${pet.age || 'idade não informada'}, ${pet.weight || 'peso não informado'} kg`,
      `Objetivo: ${pet.goal || 'não informado'}${pet.idealWeight ? ` · peso ideal ${pet.idealWeight} kg` : ''}`,
      `Condições: ${pet.healthConditions?.join(', ') || 'nenhuma informada'}`,
      `Medicamentos: ${pet.medicationName || (pet.medication === 'Sim' ? 'uso informado, sem nome' : 'nenhum informado')}`,
      `Porção: ${formatGrams(plan.totalGramsPerDay)}/dia em ${mealsCount(plan, pet)} refeições`,
      `Suplemento ${plan.supplement.name}: ${plan.supplement.doseGramsPerDay.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g/dia`,
      `Óleo vegetal: ${plan.vegetableOil.dose}. Óleo de peixe/krill: ${plan.fishOil.dose}.`,
      `Sal: ${plan.saltGuidance}`,
    ]),
    '\nIngredientes para todo o lote:',
    ...rows.map((row) => `${row.group}: ${row.label} — ${row.rawGrams !== undefined ? `≈ ${formatGrams(row.rawGrams)} cru · ` : ''}${row.cookedGrams !== undefined ? `${formatGrams(row.cookedGrams)} pronto` : row.note ?? ''}`),
    '\nPreparo: higienize mãos e bancada; corte em pedaços uniformes; cozinhe os grupos separadamente sem cebola, alho ou temperos prontos; confirme 74 °C no centro de carnes e vísceras; deixe amornar, misture e separe porções individuais; adicione suplementos e óleos apenas na hora de servir; refrigere em até 2 horas e congele o restante.',
    ...recipe.disclaimers,
    ...(clinical ? ['Esta receita não contempla ajustes clínicos individualizados. Leve este material ao médico-veterinário que acompanha o cão para revisão.'] : []),
    'Este resumo serve para revisão veterinária e não substitui a avaliação do profissional.',
  ].join('\n');

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: `Papazilla — ${title}`, text: plainText });
      else {
        await navigator.clipboard.writeText(plainText);
        setMessage('Resumo copiado. Você já pode enviá-lo ao veterinário.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Não foi possível compartilhar. Use Imprimir ou salvar PDF.');
    }
  }

  return (
    <div className="recipe-share-page">
      <header className="recipe-share-toolbar">
        <button type="button" onClick={() => navigate(`/receitas/${saved.id}`)}>← Voltar</button>
        <button type="button" onClick={() => { void share(); }}>Compartilhar</button>
        <button type="button" onClick={() => window.print()}>Imprimir ou salvar PDF</button>
      </header>
      {message ? <p role="status">{message}</p> : null}
      <main className="recipe-share-sheet">
        <p className="eyebrow">Papazilla · resumo da receita</p>
        <h1>{title}</h1>
        <p>Gerada em {created} · Motor de cálculo {recipe.engineVersion}</p>
        {clinical ? <p className="recipe-share-alert"><strong>Para revisão veterinária.</strong> A receita não contempla ajustes clínicos individualizados.</p> : null}
        <h2>Pets e porções</h2>
        {petPlans.map(({ pet, plan }) => (
          <section key={pet.id} className="recipe-share-pet">
            <h3>{pet.name}</h3>
            <p>Idade: {pet.age || 'não informada'} · Peso atual: {pet.weight || 'não informado'} kg · Objetivo: {pet.goal || 'não informado'}{pet.idealWeight ? ` · Peso ideal: ${pet.idealWeight} kg` : ''}</p>
            <p>Condições informadas: {pet.healthConditions?.join(', ') || 'nenhuma'} · Medicamentos: {pet.medicationName || (pet.medication === 'Sim' ? 'uso informado, sem nome' : 'nenhum informado')}</p>
            <p><strong>{formatGrams(plan.totalGramsPerDay)}/dia</strong> em {mealsCount(plan, pet)} refeições · Suplemento {plan.supplement.name}: {plan.supplement.doseGramsPerDay.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g/dia</p>
            <p>Óleo vegetal: {plan.vegetableOil.dose} · Óleo de peixe/krill: {plan.fishOil.dose}</p>
            <p>Sal: {plan.saltGuidance}</p>
          </section>
        ))}
        <h2>Receita e quantidades</h2>
        <p>{saved.days} dias · {formatGrams(recipe.totalCookedGrams)} prontos no total · {formatGrams(recipe.cookedGramsPerDay)} por dia</p>
        <table><thead><tr><th>Grupo e ingrediente</th><th>Peso cru estimado</th><th>Peso pronto</th></tr></thead><tbody>
          {rows.map((row) => <tr key={`${row.group}-${row.id}`}><td>{row.group} · {row.label}</td><td>{row.rawGrams === undefined ? row.note ?? '—' : `≈ ${formatGrams(row.rawGrams)}`}</td><td>{row.cookedGrams === undefined ? '—' : formatGrams(row.cookedGrams)}</td></tr>)}
        </tbody></table>
        <RecipePreparationSteps petPlans={petPlans} days={saved.days} />
        <h2>Orientação de revisão</h2>
        {recipe.disclaimers.map((text) => <p key={text}>{text}</p>)}
        <p>Este resumo serve para revisão veterinária e não substitui a avaliação do profissional.</p>
      </main>
    </div>
  );
}
