import { describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../api/_lib/supabaseAdmin.js', () => ({ supabaseAdmin: () => ({ rpc }) }));

import handler from '../api/auth-providers.js';

function call(email: unknown) {
  const res: { statusCode?: number; body?: unknown; status: (code: number) => typeof res; json: (body: unknown) => typeof res } = {
    status(code) { res.statusCode = code; return res; },
    json(body) { res.body = body; return res; },
  };
  const started = performance.now();
  const done = handler({ method: 'POST', body: { email } } as never, res as never);
  return Promise.resolve(done).then(() => ({ res, ms: performance.now() - started }));
}

describe('API de provedores por e-mail', () => {
  it('rejeita e-mail enorme e malicioso sem travar o servidor', async () => {
    const { res, ms } = await call('a' + '@.'.repeat(1000) + ' a');
    expect(res.statusCode).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(ms).toBeLessThan(200);
  });

  it('rejeita e-mail acima de 254 caracteres', async () => {
    const { res } = await call(`${'a'.repeat(250)}@x.com`);
    expect(res.statusCode).toBe(400);
  });

  it.each(['ana@exemplo.com', 'nome+tag@sub.dominio.com.br'])('continua aceitando %s', async (email) => {
    rpc.mockResolvedValueOnce({ data: ['google'], error: null });
    const { res } = await call(email);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ providers: ['google'] });
  });

  it.each(['sem-arroba.com', 'a@b', 'a b@c.com', ''])('rejeita %j', async (email) => {
    const { res } = await call(email);
    expect(res.statusCode).toBe(400);
  });
});
