/** Prévia local com dados ilustrativos para revisar a tela e o story; não entra no fluxo do produto. */
import { createRoot } from 'react-dom/client';
import { buildRecipe, calculateDailyPlan } from '@papazilla/nutrition-engine';
import '@papazilla/design-system/tokens.css';
import '@papazilla/design-system/reset.css';
import './app.css';
import type { StoredPet } from './lib/petsStore.js';
import { RecipeResultCard } from './components/RecipeResultCard.js';
import { generateRecipeStoryImage } from './lib/recipeStoryImage.js';

const pet = {
  id: 'qa', name: 'Mocha', weight: '12', healthConditions: [], treats: '', familyFood: '',
  proteins: [], vegetableFavorites: [], carbs: [], avoidProteinName: '',
  avoidVegetableName: '', intoleranceName: '', stool: '', digestionSigns: [],
} as unknown as StoredPet;
const plan = calculateDailyPlan({
  currentWeightKg: 12, goal: 'quality', lifeStage: 'adult', weightTendency: 'normal',
  season: 'mild', formulation: 'padrao', supplement: 'food-dog', predominantProtein: 'chicken-pork',
});
const recipe = buildRecipe({
  plan, days: 7,
  selection: { proteins: ['frango_peito'], organs: [], carbs: ['batata_doce'], vegetables: ['cenoura'], herbs: [] },
});
const data = { recipe, petPlans: [{ pet, plan }], formulation: 'padrao' as const, format: 'Os dois' };

createRoot(document.getElementById('root')!).render(
  <>
    <main style={{ width: 390, maxWidth: '100%', margin: '20px auto 70px' }}>
      <div className="flow-intro"><p className="eyebrow">Porção na medida</p><h1>A fornalha da Mocha está pronta!</h1><p>Receita para 7 dias.</p></div>
      <RecipeResultCard {...data} days={7} />
    </main>
    <div style={{ width: 390, maxWidth: '100%', margin: 'auto' }}><h2>Imagem vertical escolhida</h2><img id="qa-story" alt="Imagem vertical da receita da Mocha" style={{ width: '100%' }} /></div>
  </>,
);

void generateRecipeStoryImage(data).then((blob) => {
  const img = document.getElementById('qa-story') as HTMLImageElement;
  img.src = URL.createObjectURL(blob);
});
