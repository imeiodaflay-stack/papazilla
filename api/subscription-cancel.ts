import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';
import { asaasFetch } from './_lib/asaas.js';

/**
 * Cancela a renovação automática. Na assinatura antiga do Asaas, chama a API
 * pra parar as cobranças de verdade. No cartão parcelado (2026-10-05), a
 * renovação é feita pelo nosso cron: desliga `auto_renew` e apaga o token.
 * As parcelas já contratadas do ano corrente continuam na fatura. O acesso do período já
 * pago continua até `current_period_end` — ver `hasActiveAccess` em
 * `subscription.ts`.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const user = await requireUser(req.headers.authorization);
    const admin = supabaseAdmin();

    const { data: row, error } = await admin
      .from('subscriptions')
      .select('asaas_subscription_id, auto_renew')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!row?.asaas_subscription_id && !row?.auto_renew) throw new HttpError(400, 'Nenhuma renovação automática encontrada.');

    // Assinaturas antigas (anteriores ao parcelamento) ainda vivem no Asaas.
    if (row?.asaas_subscription_id) {
      await asaasFetch(`/subscriptions/${encodeURIComponent(row.asaas_subscription_id)}`, { method: 'DELETE' });
    }

    // Cartão parcelado: a renovação é nossa. Desliga e apaga o token do cartão.
    const { error: updateError } = await admin
      .from('subscriptions')
      .update({ status: 'canceled', auto_renew: false })
      .eq('user_id', user.id);
    if (updateError) throw updateError;
    const { error: tokenError } = await admin.from('subscription_card_tokens').delete().eq('user_id', user.id);
    if (tokenError) throw tokenError;

    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[subscription-cancel]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado ao cancelar.' });
  }
}
