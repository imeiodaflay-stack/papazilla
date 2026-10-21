import { afterEach, describe, expect, it, vi } from 'vitest';

const PET = {
  id: 'pet-da-ana', name: 'Rex', photoPath: '', sex: 'Macho', neutered: 'Sim', senior: 'Não', lifeStage: 'Adulto',
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
const PROFILE = { name: 'Ana', email: 'ana@example.com' };

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size; },
  };
}

/** Navegador onde a Ana entrou, usou o app e saiu: ficou o cache dela, mas não há sessão. */
function browserLeftByAna() {
  const local = fakeStorage({
    'papazilla.pets': JSON.stringify([PET]),
    'papazilla.activePetId': PET.id,
    'papazilla.userProfile': JSON.stringify(PROFILE),
    'papazilla.seenOnboarding': 'true',
  });
  const session = fakeStorage({ 'papazilla.recipeDraft': JSON.stringify({ petIds: [PET.id] }) });
  vi.stubEnv('VITE_SUPABASE_URL', 'https://projeto.supabase.test');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'chave-publica-de-teste');
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('document', { addEventListener: () => {}, removeEventListener: () => {}, visibilityState: 'visible' });
  vi.stubGlobal('window', {
    location: { href: 'https://app.test/zilla', pathname: '/zilla' },
    history: { replaceState: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal('fetch', async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  return { local, session };
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe('dados da conta anterior no navegador', () => {
  it('quem abre o app sem sessão não vê pets nem perfil de quem saiu antes', async () => {
    const { local, session } = browserLeftByAna();
    const { initAuth } = await import('../apps/web/src/lib/session.js');
    const { listPets } = await import('../apps/web/src/lib/petsStore.js');
    const { getUserProfile } = await import('../apps/web/src/lib/userProfile.js');
    await initAuth();
    expect(listPets()).toEqual([]);
    expect(getUserProfile()).toBeNull();
    expect(local.getItem('papazilla.pets')).toBeNull();
    expect(local.getItem('papazilla.activePetId')).toBeNull();
    expect(local.getItem('papazilla.userProfile')).toBeNull();
    expect(session.getItem('papazilla.recipeDraft')).toBeNull();
  });

  it('ao sair da conta, apaga o cache de pets e perfil deste aparelho', async () => {
    const { local } = browserLeftByAna();
    const { initAuth, setAuthenticated } = await import('../apps/web/src/lib/session.js');
    const { listPets } = await import('../apps/web/src/lib/petsStore.js');
    await initAuth();
    local.setItem('papazilla.pets', JSON.stringify([PET]));
    local.setItem('papazilla.userProfile', JSON.stringify(PROFILE));
    setAuthenticated(false);
    await Promise.resolve();
    expect(listPets()).toEqual([]);
    expect(local.getItem('papazilla.pets')).toBeNull();
    expect(local.getItem('papazilla.userProfile')).toBeNull();
  });

  it('não apaga o que é do aparelho e não da conta (onboarding já visto)', async () => {
    const { local } = browserLeftByAna();
    const { initAuth } = await import('../apps/web/src/lib/session.js');
    await initAuth();
    expect(local.getItem('papazilla.seenOnboarding')).toBe('true');
  });
});
