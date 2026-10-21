import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env.js';

/**
 * Cliente Supabase do frontend. Usa a chave publishable/anon; RLS protege os dados.
 * Enquanto as chaves não estiverem no .env.local, `supabase` é null e a UI opera
 * em modo desconectado (útil na Fase 0).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // PKCE: o login só conclui no navegador que o iniciou. No fluxo implícito
        // (padrão), um link com tokens no fragmento trocaria a conta de quem o abre.
        flowType: 'pkce',
      },
    })
  : null;
