/**
 * Dados pessoais do tutor (Fase 0, sem provedor de login real ainda — ver
 * `arquitetura-tecnica.md`). Nome e e-mail só existem se o próprio tutor os
 * preencher em "Dados pessoais"; nada aqui é pré-preenchido ou inventado.
 */
const PROFILE_KEY = 'papazilla.userProfile';

export interface UserProfile {
  name: string;
  email: string;
}

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (typeof parsed.name !== 'string' || typeof parsed.email !== 'string') return null;
    return { name: parsed.name, email: parsed.email };
  } catch {
    return null;
  }
}

export function setUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}
