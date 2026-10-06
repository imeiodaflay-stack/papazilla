import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Libera (ou estende) 12 meses de acesso a partir de um pagamento confirmado.
 *
 * Idempotente por `activationKey`, registrada em `subscription_activations`
 * (chave primária): no cartão parcelado é o id do parcelamento (as 12
 * parcelas e os eventos CONFIRMED/RECEIVED de cada uma contam uma vez só);
 * nos demais casos, o id do pagamento. Um aviso repetido ou atrasado, mesmo
 * de um ano anterior, nunca estende o acesso de novo.
 *
 * O novo fim de período parte do fim atual quando ele ainda está no futuro
 * (renovação feita alguns dias antes não perde dias) e de agora nos demais.
 */
export async function activatePeriod(
  admin: SupabaseClient,
  userId: string,
  activationKey: string,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  const { data: inserted, error: claimError } = await admin
    .from('subscription_activations')
    .upsert({ activation_key: activationKey, user_id: userId }, { onConflict: 'activation_key', ignoreDuplicates: true })
    .select('activation_key');
  if (claimError) throw claimError;
  if (!inserted?.length) return false;

  try {
    const { data: row, error } = await admin
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) return false;

    const currentEnd = row.current_period_end ? new Date(row.current_period_end).getTime() : 0;
    const base = new Date(Math.max(Date.now(), currentEnd));
    base.setFullYear(base.getFullYear() + 1);

    const { error: updateError } = await admin
      .from('subscriptions')
      .update({ ...extra, status: 'active', current_period_end: base.toISOString(), activated_payment_id: activationKey })
      .eq('user_id', userId);
    if (updateError) throw updateError;
    return true;
  } catch (err) {
    // Libera a chave para o próximo aviso tentar de novo.
    await admin.from('subscription_activations').delete().eq('activation_key', activationKey);
    throw err;
  }
}
