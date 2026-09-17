import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CARBS, FORMULATIONS, ORGANS, PROTEINS, RECIPE_DAYS_MAX, RECIPE_DAYS_MIN,
  SUPPLEMENTS, VEGETABLES,
} from '@papazilla/nutrition-engine';
import type { FormulationId, RecipeSelection, SupplementId } from '@papazilla/nutrition-engine';
import type { StoredPet } from '../apps/web/src/lib/petsStore.js';
import { derivePredominantProtein, mapExpectedAdultSize, mapPuppyAgeBand } from '../apps/web/src/lib/engineMapping.js';
import { buildPetPlan, buildSharedRecipe, parseWeightKg } from '../apps/web/src/lib/recipeEngine.js';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATS = ['Quantidade dos alimentos crus', 'Quantidade dos alimentos prontos', 'Os dois'];
const GOALS = new Set([
  'Manter o peso atual', 'Emagrecer', 'Ganhar peso', 'Melhorar a qualidade da alimentação',
  'Ajudar a preservar músculos e disposição com a idade', 'Apoiar uma condição de saúde',
]);

function validateIds(value: unknown, allowed: Set<string>, required: boolean): string[] {
  if (!Array.isArray(value) || value.length > 30 || value.some((v) => typeof v !== 'string')) {
    throw new HttpError(400, 'Seleção de ingredientes inválida.');
  }
  const ids = value as string[];
  if ((required && ids.length === 0) || new Set(ids).size !== ids.length || ids.some((id) => !allowed.has(id))) {
    throw new HttpError(400, 'Seleção de ingredientes inválida.');
  }
  return ids;
}

export function validateBody(body: unknown): {
  petIds: string[]; formulation: FormulationId; supplement: SupplementId;
  selection: RecipeSelection; days: number; format: string;
} {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Dados da receita ausentes.');
  const input = body as Record<string, unknown>;
  const petIds = input.petIds;
  if (!Array.isArray(petIds) || petIds.length < 1 || petIds.length > 20 ||
      petIds.some((id) => typeof id !== 'string' || !UUID.test(id)) || new Set(petIds).size !== petIds.length) {
    throw new HttpError(400, 'Escolha de pets inválida.');
  }
  if (typeof input.formulation !== 'string' || !Object.hasOwn(FORMULATIONS, input.formulation) ||
      typeof input.supplement !== 'string' || !Object.hasOwn(SUPPLEMENTS, input.supplement)) {
    throw new HttpError(400, 'Proporção ou suplemento inválido.');
  }
  if (!Number.isInteger(input.days) || (input.days as number) < RECIPE_DAYS_MIN ||
      (input.days as number) > RECIPE_DAYS_MAX || !FORMATS.includes(String(input.format))) {
    throw new HttpError(400, 'Período ou formato inválido.');
  }
  const raw = input.selection;
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'Ingredientes ausentes.');
  const s = raw as Record<string, unknown>;
  return {
    petIds: petIds as string[],
    formulation: input.formulation as FormulationId,
    supplement: input.supplement as SupplementId,
    selection: {
      proteins: validateIds(s.proteins, new Set(PROTEINS.map((it) => it.id)), true),
      organs: validateIds(s.organs, new Set(ORGANS.map((it) => it.id)), false),
      carbs: validateIds(s.carbs, new Set(CARBS.map((it) => it.id)), true),
      vegetables: validateIds(s.vegetables, new Set(VEGETABLES.map((it) => it.id)), true),
      herbs: [],
    },
    days: input.days as number,
    format: input.format as string,
  };
}

function petFromRow(row: Record<string, unknown>): StoredPet {
  const snapshot = row.anamnesis_snapshot && typeof row.anamnesis_snapshot === 'object'
    ? row.anamnesis_snapshot as Partial<StoredPet> : {};
  return {
    ...snapshot,
    id: String(row.id), name: String(row.name), breed: String(row.breed ?? ''),
    sex: String(row.sex ?? ''), neutered: row.neutered === null ? '' : row.neutered === true ? 'Sim' : 'Não',
    lifeStage: String(row.life_stage ?? ''), photoPath: String(row.photo_path ?? ''),
    weight: String(snapshot.weight ?? ''), goal: String(snapshot.goal ?? ''),
    idealWeight: String(snapshot.idealWeight ?? ''), senior: String(snapshot.senior ?? ''),
    puppyAgeBand: String(snapshot.puppyAgeBand ?? ''),
    expectedAdultSize: String(snapshot.expectedAdultSize ?? ''),
    weightTendency: String(snapshot.weightTendency ?? ''),
    healthConditions: Array.isArray(snapshot.healthConditions) ? snapshot.healthConditions : [],
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  } as StoredPet;
}

/** A API é a única origem de receitas novas: lê os pets do dono, calcula e grava um snapshot. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const user = await requireUser(req.headers.authorization);
    const input = validateBody(req.body);
    const admin = supabaseAdmin();
    const { data: sub, error: subError } = await admin.from('subscriptions')
      .select('status,current_period_end').eq('user_id', user.id).maybeSingle();
    if (subError) throw subError;
    if (!sub || !['active', 'canceled'].includes(sub.status) ||
        !sub.current_period_end || new Date(sub.current_period_end).getTime() <= Date.now()) {
      throw new HttpError(403, 'É necessária uma assinatura ativa para criar receitas.');
    }
    const { data: rows, error: petsError } = await admin.from('pets').select('*')
      .eq('owner_id', user.id).in('id', input.petIds);
    if (petsError) throw petsError;
    if (!rows || rows.length !== input.petIds.length) throw new HttpError(400, 'Um dos pets não pertence à sua conta.');
    const byId = new Map(rows.map((row) => [row.id as string, petFromRow(row)]));
    const pets = input.petIds.map((id) => byId.get(id)!);
    for (const pet of pets) {
      const weight = parseWeightKg(pet.weight);
      if (!weight || weight < 0.5 || weight > 90 ||
          (pet.goal === 'Emagrecer' && !parseWeightKg(pet.idealWeight))) {
        throw new HttpError(400, `Confira o peso informado para ${pet.name}.`);
      }
      if (!GOALS.has(pet.goal) || !['Adulto', 'Filhote'].includes(pet.lifeStage) ||
          !['Sim', 'Não'].includes(pet.neutered) ||
          !['Tende a engordar', 'Normal', 'Magro(a) / muito ativo(a)'].includes(pet.weightTendency) ||
          (pet.lifeStage === 'Filhote' && (!mapPuppyAgeBand(pet) || !mapExpectedAdultSize(pet)))) {
        throw new HttpError(400, `Revise a Anamnese de ${pet.name} antes de criar uma receita.`);
      }
    }
    const predominantProtein = derivePredominantProtein(PROTEINS.filter((it) => input.selection.proteins.includes(it.id)));
    const choices = { formulation: input.formulation, supplement: input.supplement, predominantProtein };
    const petPlans = pets.map((pet) => ({ pet, plan: buildPetPlan(pet, choices) }));
    if (petPlans.some(({ plan }) => !plan.valid)) throw new HttpError(400, 'Revise os dados dos pets antes de calcular.');
    const result = buildSharedRecipe(petPlans.map(({ plan }) => plan), input.selection, input.days);
    const { data, error } = await admin.from('recipes').insert({
      owner_id: user.id, engine_version: result.engineVersion, pet_ids: input.petIds,
      formulation: input.formulation, supplement: input.supplement, selection: input.selection,
      days: input.days, format: input.format, result, pet_plans: petPlans,
    }).select('*').single();
    if (error) throw error;
    return res.status(201).json({ recipe: data });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[recipes-create]', err);
    return res.status(500).json({ error: 'Não foi possível salvar a receita. Tente novamente.' });
  }
}
