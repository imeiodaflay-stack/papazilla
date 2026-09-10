/**
 * Sessão simulada localmente (Fase 0), espelhando `papazilla.authenticated` do
 * protótipo. Só roteia a experiência de primeiro uso. Será substituída pela sessão
 * real do Supabase quando a autenticação entrar. Todo acesso é protegido por
 * try/catch (janela privada, storage bloqueado).
 */
const AUTH_KEY = 'papazilla.authenticated';

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAuthenticated(value: boolean): void {
  try {
    if (value) localStorage.setItem(AUTH_KEY, 'true');
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}
