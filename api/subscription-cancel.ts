import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';
import { asaasFetch } from './_lib/asaas.js';

/**
 * Cancela a renovação automática. Chama o Asaas pra parar as cobranças de
 * verdade (não basta marcar como cancelada só no nosso banco, senão o
 * cartão continua sendo cobrado do lado do Asaas). O acesso do período já
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
      .select('asaas_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!row?.asaas_subscription_id) throw new HttpError(400, 'Nenhuma assinatura ativa encontrada.');

    await asaasFetch(`/subscriptions/${row.asaas_subscription_id}`, { method: 'DELETE' });

    const { error: updateError } = await admin.from('subscriptions').update({ status: 'canceled' }).eq('user_id', user.id);
    if (updateError) throw updateError;

    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[subscription-cancel]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado ao cancelar.' });
  }
}
