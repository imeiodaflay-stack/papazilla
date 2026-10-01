/** Prévia isolada dos PNGs sociais; não entra nas rotas do produto. */
import { buildRecipe, calculateDailyPlan } from '@papazilla/nutrition-engine';
import '@papazilla/design-system/tokens.css';
import type { StoredPet } from './lib/petsStore.js';
import { generatePetStoryImage } from './lib/petStoryImage.js';
import { generateRecipeStoryImage } from './lib/recipeStoryImage.js';
import mochaPhoto from './assets/preview/mocha.webp';

const kind = new URLSearchParams(location.search).get('kind') ?? 'pet-photo';
const base = {
  id: 'preview', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  name: 'Mocha', sex: 'Fêmea', breed: 'Cavalier King Charles Spaniel', age: '3', lifeStage: 'Adulto', senior: 'Não',
  weight: '8,5', goal: 'Manter o peso atual', appetite: 'Gosta bastante de comer', photoPath: mochaPhoto,
  healthConditions: [], treats: '', familyFood: '', proteins: [], vegetableFavorites: [], carbs: [],
  avoidProteinName: '', avoidVegetableName: '', intoleranceName: '', stool: '', digestionSigns: [],
} as unknown as StoredPet;

async function render(): Promise<void> {
  let blob: Blob;
  if (kind === 'pet-empty') {
    blob = await generatePetStoryImage({ ...base, name: 'Thor', sex: 'Macho', breed: 'SRD', age: '0,5', lifeStage: 'Filhote', weight: '6', goal: 'Ganhar peso', appetite: 'Parece estar sempre com fome', photoPath: '' });
  } else if (kind === 'recipe') {
    const plan = calculateDailyPlan({ currentWeightKg: 8.5, goal: 'maintain', lifeStage: 'adult', weightTendency: 'normal', season: 'mild', formulation: 'padrao', supplement: 'food-dog', predominantProtein: 'chicken-pork' });
    const recipe = buildRecipe({ plan, days: 7, selection: { proteins: ['frango_peito'], organs: ['figado_frango'], carbs: ['arroz_branco'], vegetables: ['cenoura', 'abobrinha'], herbs: [] } });
    blob = await generateRecipeStoryImage({ recipe, petPlans: [{ pet: base, plan }], formulation: 'padrao', format: 'Os dois', title: 'Frango com arroz branco' });
  } else {
    blob = await generatePetStoryImage(base);
  }
  (document.getElementById('story') as HTMLImageElement).src = URL.createObjectURL(blob);
}

void render();
