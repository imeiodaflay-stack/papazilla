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

    // ── Vercel context: busca teamId uma vez, compartilhado entre fetchVisitas e fetchScores ──
    interface VercelCtx { vercelToken: string; projectId: string; teamId: string }
    async function getVercelCtx(): Promise<VercelCtx | null> {
      const vercelToken = process.env.VERCEL_API_TOKEN;
      const projectId   = process.env.VERCEL_PROJECT_ID;
      if (!vercelToken || !projectId) return null;
      try {
        const r = await fetch(
          `https://api.vercel.com/v9/projects/${projectId}`,
          { headers: { Authorization: `Bearer ${vercelToken}` } }
        );
        if (!r.ok) return null;
        const proj = await r.json() as { accountId?: string };
        if (!proj.accountId) return null;
        return { vercelToken, projectId, teamId: proj.accountId };
      } catch { return null; }
    }

    // ── Visitas ao site: Vercel Web Analytics — últimos 30 dias ──────────────
    async function fetchVisitas(ctx: VercelCtx): Promise<number | null> {
      try {
        const to   = Date.now();
        const from = to - 30 * 24 * 60 * 60 * 1000;
        const params = new URLSearchParams({
          projectId: ctx.projectId,
          teamId:    ctx.teamId,
          from:      String(from),
          to:        String(to),
          filter:    '{}',
          tz:        'America/Sao_Paulo',
        });
        const r = await fetch(
          `https://vercel.com/api/v1/web-analytics/stats?${params}`,
          { headers: { Authorization: `Bearer ${ctx.vercelToken}` } }
        );
        if (!r.ok) return null;
        const d = await r.json() as { pageViews?: number; visitors?: number };
        return d.pageViews ?? d.visitors ?? null;
      } catch { return null; }
    }

    // ── Real Experience Score: Vercel Speed Insights — últimos 7 dias ────────
    // Retorna score 0-100 separado por device type (mobile / desktop).
    interface ScoreResult { mobile: number | null; desktop: number | null }
    async function fetchExperienceScores(ctx: VercelCtx): Promise<ScoreResult> {
      try {
        const to   = Date.now();
        const from = to - 7 * 24 * 60 * 60 * 1000;
        const params = new URLSearchParams({
          projectId: ctx.projectId,
          teamId:    ctx.teamId,
          from:      String(from),
          to:        String(to),
          filter:    '{}',
        });
        const r = await fetch(
          `https://vercel.com/api/v1/speed-insights/checks?${params}`,
          { headers: { Authorization: `Bearer ${ctx.vercelToken}` } }
        );
        if (!r.ok) return { mobile: null, desktop: null };
        const d = await r.json() as {
          mobile?:  { score?: number };
          desktop?: { score?: number };
          data?: {
            mobile?:  { score?: number };
            desktop?: { score?: number };
          };
        };
        const mobile  = d?.mobile?.score  ?? d?.data?.mobile?.score  ?? null;
        const desktop = d?.desktop?.score ?? d?.data?.desktop?.score ?? null;
        return { mobile, desktop };
      } catch { return { mobile: null, desktop: null }; }
    }

    // ── Supabase queries e Vercel calls em paralelo ───────────────────────────
    const [
      { count: cadastros, error: e1 },
      { data: petRows,    error: e2 },
      { count: compras,   error: e3 },
      { count: cliques,   error: e4 },
      vercelCtx,
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('pets').select('owner_id'),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }),
      getVercelCtx(),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    if (e4) throw e4;

    const petsAtivados = new Set(petRows?.map((r) => r.owner_id as string)).size;

    // Vercel calls em paralelo (null se token não configurado)
    const [visitas, scores] = vercelCtx
      ? await Promise.all([fetchVisitas(vercelCtx), fetchExperienceScores(vercelCtx)])
      : [null, { mobile: null, desktop: null }];

    return res.status(200).json({
      cadastros:        cadastros      ?? 0,
      pets:             petsAtivados,
      compras:          compras        ?? 0,
      cliques:          cliques        ?? 0,
      visitas,
      experienceScore:  scores,
      ts:               new Date().toISOString(),
      nota: {
        visitas:         visitas === null
          ? 'Adicione VERCEL_API_TOKEN nas variáveis de ambiente para ativar.'
          : 'Vercel Web Analytics — últimos 30 dias.',
        experienceScore: scores.mobile === null
          ? 'Adicione VERCEL_API_TOKEN para ativar Speed Insights.'
          : 'Vercel Speed Insights — últimos 7 dias.',
        abandono:        'Calculado no frontend: cliques − compras.',
      },
    });
  } catch (err) {
    console.error('[dashboard-stats]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Erro ao consultar o banco.' });
  }
}
