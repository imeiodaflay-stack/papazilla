import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

/**
 * GET /api/dashboard-users?token=DASHBOARD_TOKEN
 *
 * Lista usuários cadastrados com e-mail, nome, data de cadastro,
 * status de assinatura e pets. Protegido pelo mesmo DASHBOARD_TOKEN.
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

    // listUsers via GoTrue admin (não usa PostgREST, precisa ser chamado separado)
    const listResult = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listResult.error) throw new Error('listUsers: ' + listResult.error.message);
    const authUsers = listResult.data.users;

    const [
      { data: profiles, error: profErr },
      { data: pets,     error: petsErr },
      { data: subs,     error: subsErr },
    ] = await Promise.all([
      admin.from('profiles').select('id, display_name, created_at'),
      admin.from('pets').select('id, owner_id, name, breed, sex, neutered, life_stage, weight_kg, created_at'),
      admin.from('subscriptions').select('user_id, status, created_at'),
    ]);

    if (profErr) throw new Error('profiles: ' + profErr.message);
    if (petsErr) throw new Error('pets: ' + petsErr.message);
    if (subsErr) throw new Error('subscriptions: ' + subsErr.message);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const subsMap    = new Map((subs ?? []).map(s => [s.user_id, s]));
    const petsMap    = new Map<string, typeof pets>();

    for (const pet of pets ?? []) {
      const list = petsMap.get(pet.owner_id) ?? [];
      list.push(pet);
      petsMap.set(pet.owner_id, list);
    }

    const users = authUsers.map(u => {
      const profile = profileMap.get(u.id);
      const sub     = subsMap.get(u.id);
      return {
        id:                  u.id,
        email:               u.email ?? null,
        display_name:        profile?.display_name ?? null,
        created_at:          u.created_at,
        subscription_status: (sub as { status?: string } | undefined)?.status ?? null,
        pets:                (petsMap.get(u.id) ?? []).map(p => ({
          id:         p.id,
          name:       p.name,
          breed:      p.breed      ?? null,
          sex:        p.sex        ?? null,
          neutered:   p.neutered   ?? null,
          life_stage: p.life_stage ?? null,
          weight_kg:  p.weight_kg  ?? null,
          created_at: p.created_at,
        })),
      };
    });

    // Mais recentes primeiro
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).json({ users, ts: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[dashboard-users]', msg);
    return res.status(500).json({ error: msg });
  }
}
