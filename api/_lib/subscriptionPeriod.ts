import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Libera (ou estende) 12 meses de acesso a partir de um pagamento confirmado.
 *
 * Idempotente por `activationKey`: no cartão parcelado é o id do
 * parcelamento (as 12 parcelas e os eventos CONFIRMED/RECEIVED de cada uma
 * contam uma vez só); nos demais casos, o id do pagamento. A atualização é
 * condicional, então dois avisos simultâneos do mesmo pagamento não somam
 * dois anos.
 *
 * O novo fim de período parte do fim atual quando ele ainda está no futuro
 * (renovação feita alguns dias antes não perde dias) e de agora nos demais
 * casos.
 */
export async function activatePeriod(
  admin: SupabaseClient,
  userId: string,
  activationKey: string,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  const { data: row, error } = await admin
    .from('subscriptions')
    .select('current_period_end, activated_payment_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.activated_payment_id === activationKey) return false;

  const now = Date.now();
  const currentEnd = row.current_period_end ? new Date(row.current_period_end).getTime() : 0;
  const base = new Date(Math.max(now, currentEnd));
  base.setFullYear(base.getFullYear() + 1);

  const { data, error: updateError } = await admin
    .from('subscriptions')
    .update({ ...extra, status: 'active', current_period_end: base.toISOString(), activated_payment_id: activationKey })
    .eq('user_id', userId)
    .or(`activated_payment_id.is.null,activated_payment_id.neq.${activationKey}`)
    .select('user_id');
  if (updateError) throw updateError;
  return Boolean(data?.length);
}
