import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { activatePeriod } from './_lib/subscriptionPeriod.js';

/**
 * Recebe a confirmação de pagamento do Asaas. É a ÚNICA coisa que libera
 * acesso de verdade — o redirecionamento de volta do Checkout (`successUrl`)
 * é só navegação, nunca confirmação (pode ser editado/forjado no navegador).
 *
 * Autenticação do webhook: header `asaas-access-token` com o valor
 * configurado ao registrar o webhook no painel do Asaas (`ASAAS_WEBHOOK_TOKEN`
 * aqui) — não é assinatura HMAC, é um token compartilhado fixo.
 *
 * Entrega é "at least once": o mesmo evento pode chegar mais de uma vez.
 * Todo handler abaixo é idempotente: a liberação de 12 meses passa por
 * `activatePeriod`, que conta cada pagamento (ou parcelamento) uma vez só.
 *
 * Cartão parcelado (2026-10-05): o Asaas manda um evento por parcela. Só a
 * parcela 1 libera o ano; as outras são ignoradas aqui.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

interface AsaasWebhookPayload {
  event?: string;
  checkout?: {
    id?: string;
    customer?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
    externalReference?: string | null;
  };
  payment?: {
    id?: string;
    subscription?: string;
    customer?: string;
    checkoutSession?: string;
    externalReference?: string | null;
    installment?: string | null;
    installmentNumber?: number | null;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const receivedToken = req.headers['asaas-access-token'];
  if (!process.env.ASAAS_WEBHOOK_TOKEN || receivedToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const payload = req.body as AsaasWebhookPayload;
  const admin = supabaseAdmin();

  try {
    switch (payload.event) {
      case 'CHECKOUT_PAID': {
        const checkoutId = payload.checkout?.id;
        if (!checkoutId) break;
        const { error } = await admin
          .from('subscriptions')
          .update({
            status: 'active',
            asaas_customer_id: payload.checkout?.customer ?? null,
            current_period_end: addYears(new Date(), 1),
          })
          .eq('asaas_checkout_id', checkoutId);
        if (error) throw error;
        break;
      }
      case 'SUBSCRIPTION_CREATED': {
        const subscriptionId = payload.subscription?.id;
        const customerId = payload.subscription?.customer;
        const externalReference = payload.subscription?.externalReference;
        if (!subscriptionId) break;
        let query = admin.from('subscriptions').update({ asaas_subscription_id: subscriptionId });
        if (externalReference) query = query.eq('user_id', externalReference);
        else if (customerId) query = query.eq('asaas_customer_id', customerId);
        else break;
        const { error } = await query;
        if (error) throw error;
        break;
      }
      case 'CHECKOUT_CANCELED':
      case 'CHECKOUT_EXPIRED': {
        const checkoutId = payload.checkout?.id;
        if (!checkoutId) break;
        // Só reverte se ainda estava pendente — não desfaz uma assinatura já
        // ativada por outro checkout enquanto este expirava.
        const { error } = await admin.from('subscriptions').update({ status: 'none' }).eq('asaas_checkout_id', checkoutId).eq('status', 'pending');
        if (error) throw error;
        break;
      }
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        const payment = payload.payment;
        if (!payment) break;
        if (payment.installment && (payment.installmentNumber ?? 1) !== 1) break;

        // Acha a linha da assinatura pelo vínculo mais específico disponível.
        // `externalReference` (user_id) é o último recurso, para quando o
        // webhook chega antes de o id do pagamento ser salvo.
        const matchers: [string, string | null | undefined][] = [
          ['asaas_payment_id', payment.id],
          ['asaas_installment_id', payment.installment],
          ['asaas_checkout_id', payment.checkoutSession],
          ['asaas_subscription_id', payment.subscription],
          ['user_id', UUID.test(payment.externalReference ?? '') ? payment.externalReference : null],
        ];
        let userId: string | null = null;
        for (const [column, value] of matchers) {
          if (!value) continue;
          const { data, error } = await admin.from('subscriptions').select('user_id').eq(column, value).limit(1);
          if (error) throw error;
          if (data?.[0]?.user_id) {
            userId = data[0].user_id as string;
            break;
          }
        }
        if (!userId) break;

        const activationKey = payment.installment || payment.id;
        if (!activationKey) break;
        await activatePeriod(admin, userId, activationKey, {
          ...(payment.subscription ? { asaas_subscription_id: payment.subscription } : {}),
          ...(payment.customer ? { asaas_customer_id: payment.customer } : {}),
        });
        break;
      }
      case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
      case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS': {
        // Cartão recusado depois da criação (análise de risco ou captura).
        // Desliga a renovação; uma compra nova que ainda estava pendente volta
        // para "sem assinatura". Um período já pago não é tocado.
        const payment = payload.payment;
        const filters: [string, string | null | undefined][] = [
          ['asaas_payment_id', payment?.id],
          ['asaas_installment_id', payment?.installment],
        ];
        for (const [column, value] of filters) {
          if (!value) continue;
          const { error } = await admin.from('subscriptions').update({ auto_renew: false }).eq(column, value);
          if (error) throw error;
          const { error: pendingError } = await admin.from('subscriptions').update({ status: 'none' }).eq(column, value).eq('status', 'pending');
          if (pendingError) throw pendingError;
        }
        break;
      }
      case 'PAYMENT_OVERDUE': {
        const subscriptionId = payload.payment?.subscription;
        if (!subscriptionId) break;
        const { error } = await admin.from('subscriptions').update({ status: 'past_due' }).eq('asaas_subscription_id', subscriptionId);
        if (error) throw error;
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhooks-asaas]', payload.event, err);
    return res.status(500).json({ error: 'Falha ao processar o evento.' });
  }
}
