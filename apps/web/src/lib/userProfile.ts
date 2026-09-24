import type { User } from '@supabase/supabase-js';

/**
 * Dados pessoais do tutor. Sem login real configurado, só existem se o
 * próprio tutor os preencher em "Dados pessoais" — nada é pré-preenchido ou
 * inventado. Com login real (Google, depois Apple/e-mail), `syncProfileFromAuthUser`
 * copia nome/e-mail vindos do provedor pra cá, então o resto do app (Minha
 * conta, etc.) continua lendo só esta store, sem precisar saber de sessão.
 */
const PROFILE_KEY = 'papazilla.userProfile';

export interface UserProfile {
  name: string;
  email: string;
  /** URL pública da foto no bucket `avatars`, ou data URL local sem Supabase/sessão. */
  avatarUrl?: string;
}

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (typeof parsed.name !== 'string' || typeof parsed.email !== 'string') return null;
    return { name: parsed.name, email: parsed.email, avatarUrl: parsed.avatarUrl || undefined };
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

/** Só a foto — preserva nome/e-mail já salvos em vez de pedir o objeto inteiro de volta. */
export function setUserAvatar(avatarUrl: string): void {
  const current = getUserProfile();
  setUserProfile({ name: current?.name ?? '', email: current?.email ?? '', avatarUrl });
}

/** Copia nome/e-mail/foto reais do provedor. Uma foto escolhida no Papazilla tem prioridade. */
export function syncProfileFromAuthUser(user: User): void {
  const providerName =
    (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? '';
  const providerAvatar =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    '';
  const current = getUserProfile();
  const name = providerName || current?.name || '';
  const email = user.email || current?.email || '';
  const avatarUrl = current?.avatarUrl || providerAvatar || undefined;
  if (!name && !email) return;
  if (current?.name === name && current?.email === email && current?.avatarUrl === avatarUrl) return;
  setUserProfile({ name, email, avatarUrl });
}
