import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

/**
 * GET /api/dashboard-stats?token=DASHBOARD_TOKEN
 *
 * Métricas de lançamento agregadas para o painel interno de Flay.
 * Protegido por `DASHBOARD_TOKEN` (variável de ambiente na Vercel).
 * Não exige sessão de usuário; a chave service_role ignora o RLS.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const expected = process.env.DASHBOARD_TOKEN;
  if (!expected) return res.status(503).json({ error: 'DASHBOARD_TOKEN não configurado no servidor.' });
  const token = req.query.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token !== expected) return res.status(401).json({ error: 'Token inválido.' });

  try {
    const admin = supabaseAdmin();

    // ── Supabase queries em paralelo ──────────────────────────────────────────
    const [
      { count: cadastros, error: e1 },
      { data: petRows,    error: e2 },
      { count: compras,   error: e3 },
      { count: cliques,   error: e4 },
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('pets').select('owner_id'),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    if (e4) throw e4;

    const petsAtivados = new Set(petRows?.map((r) => r.owner_id as string)).size;

    return res.status(200).json({
      cadastros: cadastros ?? 0,
      pets:      petsAtivados,
      compras:   compras   ?? 0,
      cliques:   cliques   ?? 0,
      ts:        new Date().toISOString(),
    });
  } catch (err) {
    console.error('[dashboard-stats]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Erro ao consultar o banco.' });
  }
}
