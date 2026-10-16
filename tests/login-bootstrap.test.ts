import { afterEach, describe, expect, it, vi } from 'vitest';

const { render, initAuth } = vi.hoisted(() => ({ render: vi.fn(), initAuth: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render }) }));
vi.mock('react-router-dom', () => ({ RouterProvider: () => null }));
vi.mock('../apps/web/src/App.js', () => ({ router: {} }));
vi.mock('../apps/web/src/lib/session.js', () => ({ initAuth }));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); vi.resetModules(); });

describe('inicialização do login', () => {
  it.each(['/signup', '/signup/', '/entrar'])('exibe %s mesmo com sessão pendente', async (pathname) => {
    initAuth.mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('document', { getElementById: () => ({}) });
    vi.stubGlobal('window', { location: { pathname } });
    await import('../apps/web/src/main.js');
    expect(render).toHaveBeenCalledOnce();
  });

  it('aguarda os dados da conta antes de exibir uma rota interna', async () => {
    let resolve!: () => void;
    initAuth.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    vi.stubGlobal('document', { getElementById: () => ({}) });
    vi.stubGlobal('window', { location: { pathname: '/zilla' } });
    await import('../apps/web/src/main.js');
    expect(render).not.toHaveBeenCalled();
    resolve();
    await Promise.resolve();
    expect(render).toHaveBeenCalledOnce();
  });
});
