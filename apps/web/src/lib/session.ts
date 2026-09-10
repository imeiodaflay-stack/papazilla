/**
 * Sessão simulada localmente (Fase 0), espelhando `papazilla.authenticated` do
 * protótipo. Só roteia a experiência de primeiro uso. Será substituída pela sessão
 * real do Supabase quando a autenticação entrar. Todo acesso é protegido por
 * try/catch (janela privada, storage bloqueado).
 */
const AUTH_KEY = 'papazilla.authenticated';
const ONBOARDING_KEY = 'papazilla.seenOnboarding';

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
