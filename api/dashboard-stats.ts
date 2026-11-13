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
  // CORS: o painel HTML é aberto localmente (file://) ou de outro domínio.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  // Auth: token na query string ou no header Authorization.
  const expected = process.env.DASHBOARD_TOKEN;
  if (!expected) return res.status(503).json({ error: 'DASHBOARD_TOKEN não configurado no servidor.' });
  const token = req.query.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token !== expected) return res.status(401).json({ error: 'Token inválido.' });

  try {
    const admin = supabaseAdmin();

    // ── Cadastros: um registro em `profiles` por usuário ──────────────────
    const { count: cadastros, error: e1 } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (e1) throw e1;

    // ── Pets cadastrados: usuários com pelo menos um pet ──────────────────
    // Supabase REST não expõe COUNT(DISTINCT), então puxa os owner_ids e
    // faz o distinct em JS (conjunto pequeno no lançamento).
    const { data: petRows, error: e2 } = await admin
      .from('pets')
      .select('owner_id');
    if (e2) throw e2;
    const petsAtivados = new Set(petRows?.map((r) => r.owner_id as string)).size;

    // ── Compras: assinaturas com acesso ativo ─────────────────────────────
    const { count: compras, error: e3 } = await admin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    if (e3) throw e3;

    // ── Cliques no botão de compra: todo registro em `subscriptions` ────────
    // Uma linha só é criada quando o usuário submete o formulário de checkout
    // (`payment-create.ts`). Nunca há linhas "vazias" nessa tabela.
    // Abandono = cliques − compras (calculado no frontend).
    const { count: cliques, error: e4 } = await admin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    if (e4) throw e4;

    return res.status(200).json({
      cadastros:    cadastros   ?? 0,
      pets:         petsAtivados,
      compras:      compras     ?? 0,
      cliques:      cliques     ?? 0,
      ts:           new Date().toISOString(),
      nota: {
        visitas:   'Manual — extrair do Vercel Analytics.',
        abandono:  'Calculado no frontend: cliques − compras.',
      },
    });
  } catch (err) {
    console.error('[dashboard-stats]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Erro ao consultar o banco.' });
  }
}
