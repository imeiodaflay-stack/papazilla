import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

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
 * Todo handler abaixo é idempotente por construção (são `update`s por
 * chave, não incrementos).
 */
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
        const paymentId = payload.payment?.id;
        const subscriptionId = payload.payment?.subscription;
        const checkoutId = payload.payment?.checkoutSession;
        const externalReference = payload.payment?.externalReference;
        if (!paymentId && !subscriptionId && !checkoutId && !externalReference) break;

        const values = {
          status: 'active',
          current_period_end: addYears(new Date(), 1),
          ...(subscriptionId ? { asaas_subscription_id: subscriptionId } : {}),
          ...(payload.payment?.customer ? { asaas_customer_id: payload.payment.customer } : {}),
        };

        // No primeiro pagamento, o Asaas pode enviar PAYMENT_CONFIRMED antes
        // de SUBSCRIPTION_CREATED. Nesse momento só conhecemos o checkout que
        // foi salvo ao iniciar a compra. Depois disso, renovações também podem
        // ser correlacionadas pelo id da assinatura já persistido.
        let matched = false;
        if (paymentId) {
          const { data, error } = await admin
            .from('subscriptions')
            .update(values)
            .eq('asaas_payment_id', paymentId)
            .select('user_id');
          if (error) throw error;
          matched = Boolean(data?.length);
        }
        if (checkoutId) {
          const { data, error } = await admin
            .from('subscriptions')
            .update(values)
            .eq('asaas_checkout_id', checkoutId)
            .select('user_id');
          if (error) throw error;
          matched = matched || Boolean(data?.length);
        }
        if (!matched && subscriptionId) {
          const { data, error } = await admin
            .from('subscriptions')
            .update(values)
            .eq('asaas_subscription_id', subscriptionId)
            .select('user_id');
          if (error) throw error;
          matched = Boolean(data?.length);
        }
        // `externalReference` recebe o user_id na criação da cobrança e é o
        // último vínculo seguro em caso de o webhook chegar antes de o ID do
        // pagamento/assinatura terminar de ser persistido.
        if (!matched && externalReference) {
          const { error } = await admin
            .from('subscriptions')
            .update(values)
            .eq('user_id', externalReference);
          if (error) throw error;
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
