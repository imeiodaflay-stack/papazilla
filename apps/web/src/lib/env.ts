/** Leitura tipada das variáveis públicas. Valores reais vêm do .env.local / Vercel. */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  /** Chave pública VAPID dos avisos (Web Push). Sem ela, só o aviso por e-mail. */
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);
