/**
 * Sessão simulada localmente (Fase 0), espelhando `papazilla.authenticated` do
 * protótipo. Só roteia a experiência de primeiro uso. Será substituída pela sessão
 * real do Supabase quando a autenticação entrar. Todo acesso é protegido por
 * try/catch (janela privada, storage bloqueado).
 */
const AUTH_KEY = 'papazilla.authenticated';
const ONBOARDING_KEY = 'papazilla.seenOnboarding';
const PET_KEY = 'papazilla.hasPet';
const CURRENT_PET_KEY = 'papazilla.currentPet';

export interface CurrentPet {
  name: string;
  sex: string;
}

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function write(key: string, value: boolean): void {
  try {
    if (value) localStorage.setItem(key, 'true');
    else localStorage.removeItem(key);
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

export function isAuthenticated(): boolean {
  return read(AUTH_KEY);
}

export function setAuthenticated(value: boolean): void {
  write(AUTH_KEY, value);
}

export function hasSeenOnboarding(): boolean {
  return read(ONBOARDING_KEY);
}

export function setSeenOnboarding(): void {
  write(ONBOARDING_KEY, true);
}

export function hasPet(): boolean {
  return read(PET_KEY);
}

export function setHasPet(): void {
  write(PET_KEY, true);
}

/**
 * Único pet "registrado" nesta sessão (Fase 0, sem Supabase). Serve só para a
 * área Papá cumprimentar pelo nome; a área Pets com matilha real entra depois.
 */
export function getCurrentPet(): CurrentPet | null {
  try {
    const raw = localStorage.getItem(CURRENT_PET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CurrentPet>;
    if (typeof parsed.name !== 'string' || typeof parsed.sex !== 'string') return null;
    return { name: parsed.name, sex: parsed.sex };
  } catch {
    return null;
  }
}

export function setCurrentPet(pet: CurrentPet): void {
  try {
    localStorage.setItem(CURRENT_PET_KEY, JSON.stringify(pet));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}
