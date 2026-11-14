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

    // auth.users fica no schema 'auth' — acessível via service_role com schema()
    const [
      { data: authUsers, error: authErr },
      { data: profiles,  error: profErr },
      { data: pets,      error: petsErr },
      { data: subs,      error: subsErr },
    ] = await Promise.all([
      admin.schema('auth').from('users').select('id, email, created_at').order('created_at', { ascending: false }),
      admin.from('profiles').select('id, display_name, created_at'),
      admin.from('pets').select('id, owner_id, name, breed, sex, neutered, life_stage, birth_date, weight_kg, created_at'),
      admin.from('subscriptions').select('user_id, status, created_at'),
    ]);

    if (authErr) throw new Error('auth.users: ' + (authErr as { message?: string }).message);
    if (profErr) throw new Error('profiles: ' + profErr.message);
    if (petsErr) throw new Error('pets: ' + petsErr.message);
    if (subsErr) throw new Error('subscriptions: ' + subsErr.message);

    type AuthUser = { id: string; email: string | null; created_at: string };
    type PetRow   = { id: string; owner_id: string; name: string; breed: string | null;
                      sex: string | null; neutered: boolean | null; life_stage: string | null;
                      birth_date: string | null; weight_kg: number | null; created_at: string };

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const subsMap    = new Map((subs      ?? []).map(s => [s.user_id, s]));
    const petsMap    = new Map<string, PetRow[]>();

    for (const pet of (pets ?? []) as PetRow[]) {
      const list = petsMap.get(pet.owner_id) ?? [];
      list.push(pet);
      petsMap.set(pet.owner_id, list);
    }

    const users = ((authUsers ?? []) as AuthUser[]).map(u => {
      const profile = profileMap.get(u.id);
      const sub     = subsMap.get(u.id);
      return {
        id:                  u.id,
        email:               u.email ?? null,
        display_name:        profile?.display_name ?? null,
        created_at:          u.created_at,
        subscription_status: (sub as { status?: string } | undefined)?.status ?? null,
        pets:                (petsMap.get(u.id) ?? []).map((p: PetRow) => ({
          id:         p.id,
          name:       p.name,
          breed:      p.breed      ?? null,
          sex:        p.sex        ?? null,
          neutered:   p.neutered   ?? null,
          life_stage: p.life_stage ?? null,
          birth_date: p.birth_date ?? null,
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
