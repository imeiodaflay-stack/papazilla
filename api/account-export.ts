import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';

async function ownRows(admin: SupabaseClient, table: 'pets' | 'recipes' | 'recipe_preparations', userId: string) {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0;; offset += 1000) {
    const { data, error } = await admin.from(table).select('*').eq('owner_id', userId)
      .order('id').range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

/** Exporta apenas dados da própria conta; o JWT é validado no servidor. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await requireUser(req.headers.authorization);
    const admin = supabaseAdmin();
    const [profile, pets, recipes, preparations, subscription] = await Promise.all([
      admin.from('profiles').select('id,display_name,avatar_url,created_at,updated_at').eq('id', user.id).maybeSingle(),
      ownRows(admin, 'pets', user.id),
      ownRows(admin, 'recipes', user.id),
      ownRows(admin, 'recipe_preparations', user.id),
      admin.from('subscriptions').select('status,plan,payment_method,current_period_end,created_at,updated_at').eq('user_id', user.id).maybeSingle(),
    ]);
    for (const result of [profile, subscription]) {
      if (result.error) throw result.error;
    }
    return res.status(200).json({
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, createdAt: user.created_at },
      profile: profile.data, pets, recipes,
      preparations, subscription: subscription.data,
    });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[account-export]', err);
    return res.status(500).json({ error: 'Não foi possível exportar os dados.' });
  }
}
