import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asaasFetch } from './_lib/asaas.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { activatePeriod } from './_lib/subscriptionPeriod.js';
import { CARD_MAX_INSTALLMENTS, CARD_TOTAL } from '../apps/web/src/lib/pricing.js';

/**
 * Renovação automática do cartão parcelado (Flay, 2026-10-05). Roda uma vez
 * por dia pelo Vercel Cron (`vercel.json`). Para cada assinatura no cartão com
 * renovação ligada e período terminando nos próximos 2 dias, cria um novo
 * parcelamento de R$ 118,80 no mesmo número de parcelas, com o token do
 * cartão guardado na primeira compra.
 *
 * Cada fim de período é tentado uma vez só (`renewal_attempted_for`). Se o
 * cartão recusar, a renovação é desligada e o acesso termina no fim do
 * período já pago; a pessoa pode assinar de novo pelo app.
 *
 * Proteção: a Vercel manda `Authorization: Bearer <CRON_SECRET>`; a variável
 * `CRON_SECRET` precisa existir no projeto.
 */
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

interface RenewRow {
  user_id: string;
  asaas_customer_id: string | null;
  installment_count: number | null;
  current_period_end: string | null;
  renewal_attempted_for: string | null;
}

interface AsaasCardPayment {
  id: string;
  status?: string;
  installment?: string | null;
}

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Não autorizado.' });

  const admin = supabaseAdmin();
  const limit = new Date(Date.now() + WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from('subscriptions')
    .select('user_id, asaas_customer_id, installment_count, current_period_end, renewal_attempted_for')
    .eq('auto_renew', true)
    .eq('payment_method', 'credit_card')
    .eq('status', 'active')
    .lte('current_period_end', limit);
  if (error) {
    console.error('[subscription-renew]', error.message);
    return res.status(500).json({ error: 'Falha ao listar renovações.' });
  }

  const results: { userId: string; result: string }[] = [];
  for (const row of (data ?? []) as RenewRow[]) {
    if (!row.current_period_end || row.renewal_attempted_for === row.current_period_end) continue;
    const mark = { renewal_attempted_for: row.current_period_end };
    try {
      const { data: tokenRow, error: tokenError } = await admin
        .from('subscription_card_tokens')
        .select('asaas_credit_card_token')
        .eq('user_id', row.user_id)
        .maybeSingle();
      if (tokenError) throw tokenError;
      if (!tokenRow?.asaas_credit_card_token || !row.asaas_customer_id) {
        await admin.from('subscriptions').update({ ...mark, auto_renew: false }).eq('user_id', row.user_id);
        results.push({ userId: row.user_id, result: 'sem_token' });
        continue;
      }

      const installmentCount = row.installment_count ?? CARD_MAX_INSTALLMENTS;
      const payment = await asaasFetch<AsaasCardPayment>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: row.asaas_customer_id,
          billingType: 'CREDIT_CARD',
          dueDate: todayInSaoPaulo(),
          description: 'Papazilla Anual (renovação)',
          externalReference: row.user_id,
          ...(installmentCount > 1 ? { installmentCount, totalValue: CARD_TOTAL } : { value: CARD_TOTAL }),
          creditCardToken: tokenRow.asaas_credit_card_token,
          remoteIp: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        }),
      });
      await admin.from('subscriptions')
        .update({ ...mark, asaas_payment_id: payment.id, asaas_installment_id: payment.installment ?? null })
        .eq('user_id', row.user_id);
      if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
        await activatePeriod(admin, row.user_id, payment.installment ?? payment.id);
      }
      results.push({ userId: row.user_id, result: payment.status ?? 'criado' });
    } catch (err) {
      console.error('[subscription-renew]', row.user_id, err instanceof Error ? err.message : err);
      await admin.from('subscriptions').update({ ...mark, auto_renew: false }).eq('user_id', row.user_id);
      results.push({ userId: row.user_id, result: 'recusado' });
    }
  }
  return res.status(200).json({ processed: results.length, results });
}
