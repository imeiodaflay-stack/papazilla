/**
 * Matilha local (Fase 0, sem Supabase ainda). Guarda o subconjunto das respostas
 * da anamnese que a área Pets exibe hoje — não é o registro completo que um dia
 * vai para `pet_anamneses` no Supabase (ver `arquitetura-tecnica.md`).
 * Tudo protegido por try/catch (janela privada, storage bloqueado).
 */
const PETS_KEY = 'papazilla.pets';
const ACTIVE_PET_KEY = 'papazilla.activePetId';

export interface StoredPet {
  id: string;
  name: string;
  sex: string;
  neutered: string;
  breed: string;
  age: string;
  weight: string;
  goal: string;
  idealWeight: string;
  bodyTop: string;
  weightChange: string;
  activityTime: string;
  activityType: string;
  appetite: string;
  currentMeals: string;
  stool: string;
  healthConditions: string[];
  medication: string;
  medicationName: string;
  proteins: string[];
  vegetableFavorites: string[];
  avoidProteinName: string;
  avoidVegetableName: string;
  intoleranceName: string;
  cookingMethod: string;
  recipeFormat: string;
  createdAt: string;
  updatedAt: string;
}

function readPets(): StoredPet[] {
  try {
    const raw = localStorage.getItem(PETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPet[]) : [];
  } catch {
    return [];
  }
}

function writePets(pets: StoredPet[]): void {
  try {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

export function listPets(): StoredPet[] {
  return readPets();
}

export function getPet(id: string): StoredPet | undefined {
  return readPets().find((p) => p.id === id);
}

export function addPet(data: Omit<StoredPet, 'id' | 'createdAt' | 'updatedAt'>): StoredPet {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `pet_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const pet: StoredPet = { ...data, id, createdAt: now, updatedAt: now };
  const pets = readPets();
  pets.push(pet);
  writePets(pets);
  setActivePetId(id);
  return pet;
}

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
  const pets = readPets();
  if (pets.length === 0) return null;
  const activeId = getActivePetId();
  return pets.find((p) => p.id === activeId) ?? pets[pets.length - 1] ?? null;
}
