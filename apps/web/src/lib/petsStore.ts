import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';

/**
 * Matilha do tutor. Com Supabase configurado e sessão real, `cachedPets` é
 * carregado da tabela `pets` (ver `supabase/migrations/`) por
 * `loadPetsForOwner` — chamada por `session.ts` toda vez que a sessão de auth
 * muda, então o resto do app nunca precisa saber de userId ou de promises
 * aqui. Sem Supabase configurado (ou sem sessão), cai de volta no
 * `localStorage` puro da Fase 0.
 *
 * As leituras (`listPets`, `getPet`, `getActivePet`) continuam síncronas de
 * propósito — hoje 19 arquivos chamam essas funções direto no corpo do
 * componente, sem `useEffect`; trocar a API pra async exigiria reescrever
 * todos eles. Em vez disso, `cachedPets` é um cache em memória: escritas
 * (`addPet`/`updatePet`/`deletePet`) atualizam esse cache e o localStorage na
 * hora (o app continua parecendo instantâneo) e disparam a gravação real no
 * Supabase em segundo plano.
 *
 * Só `name`/`breed`/`sex`/`neutered`/`lifeStage` viram colunas de verdade em
 * `pets` (identidade, como `arquitetura-tecnica.md` pede). Todo o resto —
 * idade, peso, rotina, saúde, preferências — ainda não tem uma tabela própria
 * (`pet_anamneses`, versionada, é trabalho futuro) e por enquanto viaja
 * inteiro dentro de `anamnesis_snapshot` (jsonb). Tudo protegido por
 * try/catch nos acessos a localStorage (janela privada, storage bloqueado).
 */
const PETS_KEY = 'papazilla.pets';
const ACTIVE_PET_KEY = 'papazilla.activePetId';

export interface StoredPet {
  id: string;
  name: string;
  /** URL pública da foto no bucket `pet-photos` (Storage) — ou uma data URL local quando não há Supabase/sessão. */
  photoPath: string;
  sex: string;
  neutered: string;
  /** "Sim"/"Não" — junto de `neutered`, alimenta o ajuste percentual do motor. */
  senior: string;
  /** "Adulto" | "Filhote". */
  lifeStage: string;
  /** Preenchido só quando `lifeStage === 'Filhote'`. */
  puppyAgeBand: string;
  /** Preenchido só quando `lifeStage === 'Filhote'`. */
  expectedAdultSize: string;
  /**
   * Tendência de peso/atividade — mesma faixa da calculadora original.
   * Não é mais perguntada direto: `deriveWeightTendency` (`lib/weightTendency.ts`)
   * a calcula a partir de `bodyTop`/`ribs`/`belly` (Condição corporal) e
   * `activityTime`/`activityType` (Atividade) — avaliação objetiva em vez de
   * autodeclaração solta.
   */
  weightTendency: string;
  breed: string;
  age: string;
  weight: string;
  goal: string;
  idealWeight: string;
  bodyTop: string;
  ribs: string;
  belly: string;
  /** Sinais de perda de músculo (Passo 4). Vazio ou só "Nenhuma dessas mudanças"/"Não sei avaliar" = sem sinal. */
  muscleChangeSigns: string[];
  /** "Pequena"/"Moderada"/"Bem evidente"/"Não sei" — só relevante quando `muscleChangeSigns` indica alguma mudança real. */
  muscleChangeSeverity: string;
  weightChange: string;
  /** "Sim"/"Não sei" — sabe o peso anterior. `previousWeight` só é preenchido quando "Sim". */
  previousWeightKnown: string;
  previousWeight: string;
  activityTime: string;
  activityType: string;
  appetite: string;
  /** O que come hoje — Passo 8, só informativo pra transição, não entra no cálculo da receita nova. */
  currentFood: string;
  currentMeals: string;
  currentAmountKnown: string;
  currentAmount: string;
  /** Frequência de petiscos (Passo 9) — cruzada com o teto de petiscos (10–15% do total) na receita. */
  treats: string;
  /** "Nunca"/"Às vezes"/"Frequentemente" — comida da família, mesmo cruzamento de `treats`. */
  familyFood: string;
  stool: string;
  stoolFrequency: string;
  /** Sinais digestivos (Passo 10) — cruzados com avisos de vísceras musculares/vegetais que soltam o intestino na receita. */
  digestionSigns: string[];
  /** Só preenchido quando "Pancreatite" está em `healthConditions`. */
  pancreatitisHistory: string;
  /** Só preenchido quando "Cálculos ou cristais urinários" está em `healthConditions`. */
  urinaryType: string;
  /** Só preenchido quando "Doença renal" está em `healthConditions`. */
  renalStage: string;
  healthConditions: string[];
  medication: string;
  medicationName: string;
  supplementsUse: string;
  currentSupplements: string[];
  otherSupplementName: string;
  /** Última consulta veterinária (Passo 14) — cruzado com a recomendação de checkup anual (AAHA). */
  lastVet: string;
  bloodTests: string;
  bloodNotes: string;
  /** "Sim"/"Não" — se "Sim", `avoidProteinName` traz qual. */
  avoidProtein: string;
  proteins: string[];
  vegetableFavorites: string[];
  /** Carboidratos favoritos (Passo 16) — cruzado com a seleção do wizard da receita. */
  carbs: string[];
  avoidProteinName: string;
  /** "Sim"/"Não" — se "Sim", `avoidVegetableName` traz qual. */
  avoidVegetable: string;
  avoidVegetableName: string;
  /** "Sim"/"Não" — se "Sim", `intoleranceName` traz qual. */
  intolerance: string;
  intoleranceName: string;
  cookingMethod: string;
  recipeFormat: string;
  /** "1"/"2"/"3"/"4"/"Quero que o Papazilla recomende" — usado no resultado da receita quando não é a última opção. */
  preferredMeals: string;
  createdAt: string;
  updatedAt: string;
}

interface PetRow {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  sex: string | null;
  neutered: boolean | null;
  life_stage: string | null;
  photo_path: string | null;
  anamnesis_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function readLocalPets(): StoredPet[] {
  try {
    const raw = localStorage.getItem(PETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPet[]) : [];
  } catch {
    return [];
  }
}

function writeLocalPets(pets: StoredPet[]): void {
  try {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

function rowToStoredPet(row: PetRow): StoredPet {
  const snapshot = (row.anamnesis_snapshot ?? {}) as Partial<StoredPet>;
  return {
    id: row.id,
    name: row.name,
    photoPath: row.photo_path ?? '',
    breed: row.breed ?? '',
    sex: row.sex ?? '',
    neutered: row.neutered === null ? '' : row.neutered ? 'Sim' : 'Não',
    lifeStage: row.life_stage ?? '',
    senior: snapshot.senior ?? '',
    puppyAgeBand: snapshot.puppyAgeBand ?? '',
    expectedAdultSize: snapshot.expectedAdultSize ?? '',
    weightTendency: snapshot.weightTendency ?? '',
    age: snapshot.age ?? '',
    weight: snapshot.weight ?? '',
    goal: snapshot.goal ?? '',
    idealWeight: snapshot.idealWeight ?? '',
    bodyTop: snapshot.bodyTop ?? '',
    ribs: snapshot.ribs ?? '',
    belly: snapshot.belly ?? '',
    muscleChangeSigns: snapshot.muscleChangeSigns ?? [],
    muscleChangeSeverity: snapshot.muscleChangeSeverity ?? '',
    weightChange: snapshot.weightChange ?? '',
    previousWeightKnown: snapshot.previousWeightKnown ?? '',
    previousWeight: snapshot.previousWeight ?? '',
    activityTime: snapshot.activityTime ?? '',
    activityType: snapshot.activityType ?? '',
    appetite: snapshot.appetite ?? '',
    currentFood: snapshot.currentFood ?? '',
    currentMeals: snapshot.currentMeals ?? '',
    currentAmountKnown: snapshot.currentAmountKnown ?? '',
    currentAmount: snapshot.currentAmount ?? '',
    treats: snapshot.treats ?? '',
    familyFood: snapshot.familyFood ?? '',
    stool: snapshot.stool ?? '',
    stoolFrequency: snapshot.stoolFrequency ?? '',
    digestionSigns: snapshot.digestionSigns ?? [],
    pancreatitisHistory: snapshot.pancreatitisHistory ?? '',
    urinaryType: snapshot.urinaryType ?? '',
    renalStage: snapshot.renalStage ?? '',
    healthConditions: snapshot.healthConditions ?? [],
    medication: snapshot.medication ?? '',
    medicationName: snapshot.medicationName ?? '',
    supplementsUse: snapshot.supplementsUse ?? '',
    currentSupplements: snapshot.currentSupplements ?? [],
    otherSupplementName: snapshot.otherSupplementName ?? '',
    lastVet: snapshot.lastVet ?? '',
    bloodTests: snapshot.bloodTests ?? '',
    bloodNotes: snapshot.bloodNotes ?? '',
    avoidProtein: snapshot.avoidProtein ?? '',
    proteins: snapshot.proteins ?? [],
    vegetableFavorites: snapshot.vegetableFavorites ?? [],
    carbs: snapshot.carbs ?? [],
    avoidProteinName: snapshot.avoidProteinName ?? '',
    avoidVegetable: snapshot.avoidVegetable ?? '',
    avoidVegetableName: snapshot.avoidVegetableName ?? '',
    intolerance: snapshot.intolerance ?? '',
    intoleranceName: snapshot.intoleranceName ?? '',
    cookingMethod: snapshot.cookingMethod ?? '',
    recipeFormat: snapshot.recipeFormat ?? '',
    preferredMeals: snapshot.preferredMeals ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(pet: StoredPet, owner: string): Omit<PetRow, 'created_at' | 'updated_at'> {
  const {
    id,
    name,
    photoPath,
    breed,
    sex,
    neutered,
    lifeStage,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...snapshot
  } = pet;
  return {
    id,
    owner_id: owner,
    name,
    photo_path: photoPath || null,
    breed: breed || null,
    sex: sex || null,
    neutered: neutered === '' ? null : neutered === 'Sim',
    life_stage: lifeStage || null,
    anamnesis_snapshot: snapshot,
  };
}

let cachedPets: StoredPet[] = readLocalPets();
let ownerId: string | null = null;

/** Chamada por `session.ts` a cada mudança de sessão. Sem Supabase/usuário, mantém o cache local de sempre. */
export async function loadPetsForOwner(userId: string | null): Promise<void> {
  ownerId = userId;
  if (!isSupabaseConfigured || !supabase || !userId) {
    cachedPets = readLocalPets();
    return;
  }
  const { data, error } = await supabase.from('pets').select('*').eq('owner_id', userId).order('created_at', { ascending: true });
  if (error || !data) {
    console.error('[petsStore] Falha ao carregar a matilha do Supabase', error);
    return;
  }
  cachedPets = (data as PetRow[]).map(rowToStoredPet);
  writeLocalPets(cachedPets);
}

const pendingPetWrites = new Set<Promise<void>>();

/** Garante que uma receita nova leia no servidor o perfil recém-cadastrado/editado. */
export async function waitForPendingPetWrites(): Promise<void> {
  await Promise.all([...pendingPetWrites]);
}

function persistPet(pet: StoredPet): void {
  if (!isSupabaseConfigured || !supabase || !ownerId) return;
  const write = Promise.resolve(supabase.from('pets').upsert(toRow(pet, ownerId)))
    .then(({ error }) => {
      if (error) throw new Error(`Falha ao salvar ${pet.name} no servidor.`);
    });
  pendingPetWrites.add(write);
  void write.catch((error) => console.error('[petsStore]', error)).finally(() => pendingPetWrites.delete(write));
}

function persistDelete(id: string): void {
  if (!isSupabaseConfigured || !supabase || !ownerId) return;
  void supabase
    .from('pets')
    .delete()
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error('[petsStore] Falha ao excluir o pet no Supabase', error);
    });
}

export function listPets(): StoredPet[] {
  return cachedPets;
}

export function getPet(id: string): StoredPet | undefined {
  return cachedPets.find((p) => p.id === id);
}

export function addPet(data: Omit<StoredPet, 'id' | 'createdAt' | 'updatedAt'>): StoredPet {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `pet_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const pet: StoredPet = { ...data, id, createdAt: now, updatedAt: now };
  cachedPets = [...cachedPets, pet];
  writeLocalPets(cachedPets);
  setActivePetId(id);
  persistPet(pet);
  return pet;
}

/** Atualiza campos de um pet existente (edição de dados principais). Não mexe em id/createdAt. */
export function updatePet(id: string, patch: Partial<Omit<StoredPet, 'id' | 'createdAt'>>): StoredPet | undefined {
  const index = cachedPets.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  const current = cachedPets[index]!;
  const updated: StoredPet = { ...current, ...patch, updatedAt: new Date().toISOString() };
  cachedPets = cachedPets.map((p, i) => (i === index ? updated : p));
  writeLocalPets(cachedPets);
  persistPet(updated);
  return updated;
}

/**
 * Remove um pet da matilha (irreversível — sem "lixeira"). Se era o pet
 * ativo, o trocador de pet passa a apontar pro mais recente restante. Não
 * mexe em receitas salvas que citam esse pet — elas continuam existindo e
 * cada tela lida com o `petId` órfão na hora de ler (ver `RecipeDetailScreen`).
 */
export function deletePet(id: string): void {
  cachedPets = cachedPets.filter((p) => p.id !== id);
  writeLocalPets(cachedPets);
  if (getActivePetId() === id) {
    const next = cachedPets[cachedPets.length - 1];
    if (next) setActivePetId(next.id);
  }
  persistDelete(id);
}

/** Trocador de pet: preferência só local (por aparelho), não sincroniza pelo Supabase. */
export function getActivePetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PET_KEY);
  } catch {
    return null;
  }
}

export function setActivePetId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PET_KEY, id);
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

/** Pet ativo: o escolhido pelo trocador de pet, com fallback pro mais recente da matilha. */
export function getActivePet(): StoredPet | null {
  if (cachedPets.length === 0) return null;
  const activeId = getActivePetId();
  return cachedPets.find((p) => p.id === activeId) ?? cachedPets[cachedPets.length - 1] ?? null;
}
