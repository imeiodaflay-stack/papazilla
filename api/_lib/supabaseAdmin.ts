import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

/**
 * Cliente Supabase server-side (`service_role` — ignora RLS). Só roda aqui,
 * nas Vercel Functions; a chave nunca vai pro bundle do navegador (ver
 * `.env.example`, `SUPABASE_SERVICE_ROLE_KEY` fica fora do prefixo `VITE_`).
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase não configurado no servidor (VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).');
  return createClient(url, key, { auth: { persistSession: false } });
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Valida o JWT do header `Authorization: Bearer <token>` e devolve o usuário autenticado. */
export async function requireUser(authHeader: string | string[] | undefined): Promise<User> {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = header?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Não autenticado.');
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Sessão inválida ou expirada.');
  return data.user;
}
