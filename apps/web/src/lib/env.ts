/** Leitura tipada das variáveis públicas. Valores reais vêm do .env.local / Vercel. */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);
