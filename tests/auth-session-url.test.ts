import { afterEach, describe, expect, it, vi } from 'vitest';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

// O navegador da vítima abrindo um link em que o atacante colocou a própria sessão.
function openLinkWithSession(pathname: string) {
  const attackerUser = { id: 'atacante-id', aud: 'authenticated', email: 'atacante@example.com' };
  vi.stubEnv('VITE_SUPABASE_URL', 'https://projeto.supabase.test');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'chave-publica-de-teste');
  vi.stubGlobal('localStorage', fakeStorage());
  vi.stubGlobal('document', { addEventListener: () => {}, removeEventListener: () => {}, visibilityState: 'visible' });
  vi.stubGlobal('window', {
    location: {
      href: `https://app.test${pathname}#access_token=token-do-atacante&refresh_token=refresh-do-atacante&expires_in=3600&token_type=bearer`,
      pathname,
    },
    history: { replaceState: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  // Qualquer chamada de rede responde como se o token do atacante fosse válido.
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(attackerUser), {
    status: 200, headers: { 'content-type': 'application/json' },
  }));
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe('sessão vinda pela URL', () => {
  it('não troca a conta da vítima por uma sessão entregue num link qualquer', async () => {
    openLinkWithSession('/anamnese');
    const { supabase } = await import('../apps/web/src/lib/supabase.js');
    const { data } = await supabase!.auth.getSession();
    expect(data.session).toBeNull();
  });
});
