/**
 * Sessão de autenticação. Quando `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`
 * estão configuradas, `isAuthenticated()` reflete a sessão real do Supabase
 * (cacheada em memória por `initAuth()` + `onAuthStateChange`, pra continuar
 * síncrona nos pontos que já dependiam disso, como `SplashScreen`). Sem
 * chaves configuradas, cai de volta no flag simulado em `localStorage` da
 * Fase 0 — mantém o app utilizável sem um projeto Supabase real.
 *
 * `hasSeenOnboarding` continua só local (não faz parte da autenticação em
 * si). `hasPet` deriva direto de `listPets()` — não é mais um flag manual
 * separado: antes disso, um usuário que cadastrasse um pet num aparelho e
 * abrisse o app noutro só veria a matilha se tivesse clicado o botão certo
 * que ligava esse flag no primeiro aparelho, o que não faz sentido agora que
 * a matilha sincroniza de verdade pelo Supabase. Todo acesso a `localStorage`
 * é protegido por try/catch (janela privada, storage bloqueado).
 */
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';
import { syncProfileFromAuthUser } from './userProfile.js';
import { listPets, loadPetsForOwner } from './petsStore.js';
import { loadSubscriptionForOwner } from './subscription.js';

const AUTH_KEY = 'papazilla.authenticated';
const ONBOARDING_KEY = 'papazilla.seenOnboarding';

let cachedUser: User | null = null;
let initPromise: Promise<void> | null = null;

async function applySession(user: User | null): Promise<void> {
  cachedUser = user;
  if (user) syncProfileFromAuthUser(user);
  await Promise.all([loadPetsForOwner(user?.id ?? null), loadSubscriptionForOwner(user?.id ?? null)]);
}

/**
 * Resolve a sessão inicial do Supabase e mantém `cachedUser` em dia depois
 * disso. Idempotente — quem chama (`SplashScreen`) pode confiar que, quando
 * a promise resolve, tanto a sessão quanto a matilha (`petsStore.ts`) já
 * estão carregadas, não só a sessão.
 */
export function initAuth(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return Promise.resolve();
  if (!initPromise) {
    const client = supabase;
    initPromise = client.auth.getSession().then(({ data }) => applySession(data.session?.user ?? null));
    client.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null);
    });
  }
  return initPromise;
}

// `cachedUser` só existe em memória (reseta a cada carregamento da página).
// Chamar aqui garante que qualquer rota — não só Splash/AuthCallback — comece
// a resolver a sessão real assim que o módulo carrega, sem esperar um efeito
// em algum componente específico rodar primeiro.
void initAuth();

/** Provedor usado no login real (`google`, `apple`, `email`...), ou `null` sem sessão/Supabase configurado. */
export function getAuthProvider(): string | null {
  return cachedUser?.app_metadata?.provider ?? null;
}

/** Id do usuário autenticado, ou `null` sem sessão — usado por quem precisa recarregar dados próprios (ex.: `subscription.ts`). */
export function getUserId(): string | null {
  return cachedUser?.id ?? null;
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
  return isSupabaseConfigured ? Boolean(cachedUser) : read(AUTH_KEY);
}

export function setAuthenticated(value: boolean): void {
  if (isSupabaseConfigured && supabase) {
    if (!value) {
      cachedUser = null;
      void loadPetsForOwner(null);
      void supabase.auth.signOut();
    }
    return;
  }
  write(AUTH_KEY, value);
}

export function hasSeenOnboarding(): boolean {
  return read(ONBOARDING_KEY);
}

export function setSeenOnboarding(): void {
  write(ONBOARDING_KEY, true);
}

export function hasPet(): boolean {
  return listPets().length > 0;
}
