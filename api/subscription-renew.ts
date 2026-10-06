import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AsaasHttpError, asaasFetch } from './_lib/asaas.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { activatePeriod } from './_lib/subscriptionPeriod.js';
import { CARD_MAX_INSTALLMENTS, CARD_TOTAL } from '../apps/web/src/lib/pricing.js';

/**
 * Renovação automática do cartão parcelado (Flay, 2026-10-05). Roda uma vez
 * por dia pelo Vercel Cron (`vercel.json`). Para cada assinatura no cartão com
 * renovação ligada e período terminando nos próximos 2 dias (ou que terminou
 * há no máximo 3), cria um novo parcelamento de R$ 118,80 no mesmo número de
 * parcelas, com o token do cartão guardado na primeira compra.
 *
 * Segurança contra cobrança dupla: antes de cobrar, cada linha é "reservada"
 * com uma atualização condicional de `renewal_attempted_for` (só uma execução
 * consegue). Se o Asaas recusar de forma definitiva (4xx, ex.: cartão
 * negado), a renovação é desligada e o acesso termina no fim do período pago.
 * Em erro temporário (rede, 5xx), a reserva é desfeita e o dia seguinte tenta
 * de novo, dentro da janela.
 *
 * Assinaturas antigas, com recorrência do próprio Asaas
 * (`asaas_subscription_id`), ficam de fora: o Asaas renova essas sozinho.
 *
 * Proteção: a Vercel manda `Authorization: Bearer <CRON_SECRET>`; a variável
 * `CRON_SECRET` precisa existir no projeto.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

interface RenewRow {
  user_id: string;
  asaas_customer_id: string | null;
  installment_count: number | null;
  current_period_end: string;
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

function sameInstant(a: string | null, b: string | null): boolean {
  return Boolean(a && b && new Date(a).getTime() === new Date(b).getTime());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Não autorizado.' });

  const admin = supabaseAdmin();
  const now = Date.now();
  const { data, error } = await admin
    .from('subscriptions')
    .select('user_id, asaas_customer_id, installment_count, current_period_end, renewal_attempted_for')
    .eq('auto_renew', true)
    .eq('payment_method', 'credit_card')
    .eq('status', 'active')
    .is('asaas_subscription_id', null)
    .lte('current_period_end', new Date(now + 2 * DAY_MS).toISOString())
    .gte('current_period_end', new Date(now - 3 * DAY_MS).toISOString());
  if (error) {
    console.error('[subscription-renew]', error.message);
    return res.status(500).json({ error: 'Falha ao listar renovações.' });
  }

  const results: { userId: string; result: string }[] = [];
  for (const row of (data ?? []) as RenewRow[]) {
    if (sameInstant(row.renewal_attempted_for, row.current_period_end)) continue;

    // Reserva: só uma execução consegue marcar este fim de período.
    let claim = admin.from('subscriptions')
      .update({ renewal_attempted_for: row.current_period_end })
      .eq('user_id', row.user_id);
    claim = row.renewal_attempted_for
      ? claim.eq('renewal_attempted_for', row.renewal_attempted_for)
      : claim.is('renewal_attempted_for', null);
    const { data: claimed, error: claimError } = await claim.select('user_id');
    if (claimError) {
      console.error('[subscription-renew] reserva', row.user_id, claimError.message);
      continue;
    }
    if (!claimed?.length) continue;

    const release = () => admin.from('subscriptions')
      .update({ renewal_attempted_for: row.renewal_attempted_for })
      .eq('user_id', row.user_id);

    let payment: AsaasCardPayment;
    try {
      const { data: tokenRow, error: tokenError } = await admin
        .from('subscription_card_tokens')
        .select('asaas_credit_card_token, customer_ip')
        .eq('user_id', row.user_id)
        .maybeSingle();
      if (tokenError) throw tokenError;
      if (!tokenRow?.asaas_credit_card_token || !row.asaas_customer_id) {
        await admin.from('subscriptions').update({ auto_renew: false }).eq('user_id', row.user_id);
        results.push({ userId: row.user_id, result: 'sem_token' });
        continue;
      }

      const installmentCount = row.installment_count ?? CARD_MAX_INSTALLMENTS;
      payment = await asaasFetch<AsaasCardPayment>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: row.asaas_customer_id,
          billingType: 'CREDIT_CARD',
          dueDate: todayInSaoPaulo(),
          description: 'Papazilla Anual (renovação)',
          externalReference: row.user_id,
          ...(installmentCount > 1 ? { installmentCount, totalValue: CARD_TOTAL } : { value: CARD_TOTAL }),
          creditCardToken: tokenRow.asaas_credit_card_token,
          ...(tokenRow.customer_ip ? { remoteIp: tokenRow.customer_ip } : {}),
        }),
      });
    } catch (err) {
      const definitive = err instanceof AsaasHttpError && err.status >= 400 && err.status < 500;
      console.error('[subscription-renew]', row.user_id, err instanceof Error ? err.message : err);
      if (definitive) {
        await admin.from('subscriptions').update({ auto_renew: false }).eq('user_id', row.user_id);
        results.push({ userId: row.user_id, result: 'recusado' });
      } else {
        await release();
        results.push({ userId: row.user_id, result: 'tentar_de_novo' });
      }
      continue;
    }

    // Cobrança criada: daqui em diante nada desfaz a reserva (evita cobrar de novo).
    const { error: saveError } = await admin.from('subscriptions')
      .update({ asaas_payment_id: payment.id, asaas_installment_id: payment.installment ?? null })
      .eq('user_id', row.user_id);
    if (saveError) console.error('[subscription-renew] ids não salvos', row.user_id, saveError.message);
    const approved = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED';
    const activationKey = (row.installment_count ?? CARD_MAX_INSTALLMENTS) > 1 ? payment.installment : payment.id;
    if (approved && activationKey) {
      try {
        await activatePeriod(admin, row.user_id, activationKey);
      } catch (err) {
        // O webhook do Asaas libera de novo; a chave em subscription_activations evita somar duas vezes.
        console.error('[subscription-renew] ativação adiada para o webhook', row.user_id, err instanceof Error ? err.message : err);
      }
    }
    results.push({ userId: row.user_id, result: payment.status ?? 'criado' });
  }
  return res.status(200).json({ processed: results.length, results });
}
