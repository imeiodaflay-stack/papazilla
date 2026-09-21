import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';
import { asaasFetch } from './_lib/asaas.js';

const ANNUAL_PRICE = 99.99;

interface AsaasCheckout {
  id: string;
}

function asaasDateTimeNow(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')}`;
}

/**
 * Cria uma sessão de Checkout hospedada pelo Asaas (assinatura recorrente
 * anual, só cartão — ver decisão de produto em `subscription.ts`) e devolve
 * a URL de pagamento. A assinatura só é liberada de verdade quando o Asaas
 * confirmar o pagamento pelo webhook (`webhooks-asaas.ts`), nunca aqui.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const user = await requireUser(req.headers.authorization);
    const admin = supabaseAdmin();
    const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    const returnTo = ['papa', 'conta', 'recipe'].includes(req.body?.returnTo) ? req.body.returnTo : 'papa';

    const { data: existing, error: existingError } = await admin.from('subscriptions')
      .select('status,current_period_end').eq('user_id', user.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing && ['active', 'canceled'].includes(existing.status) && existing.current_period_end &&
        new Date(existing.current_period_end).getTime() > Date.now()) {
      throw new HttpError(409, 'Sua assinatura já está ativa.');
    }

    const checkout = await asaasFetch<AsaasCheckout>('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['RECURRENT'],
        minutesToExpire: 60,
        subscription: { cycle: 'YEARLY', nextDueDate: asaasDateTimeNow() },
        items: [
          {
            name: 'Papazilla Anual',
            description: 'Receitas de alimentação natural personalizadas — assinatura anual.',
            quantity: 1,
            value: ANNUAL_PRICE,
          },
        ],
        callback: {
          successUrl: `${appUrl}/assinatura/confirmando?returnTo=${returnTo}`,
          cancelUrl: `${appUrl}/assinatura?returnTo=${returnTo}`,
          expiredUrl: `${appUrl}/assinatura?returnTo=${returnTo}`,
        },
        externalReference: user.id,
        ...(user.email ? { customerData: { name: user.user_metadata?.full_name || user.email, email: user.email } } : {}),
      }),
    });

    const { error } = await admin
      .from('subscriptions')
      .upsert(
        { user_id: user.id, status: 'pending', plan: 'annual', asaas_checkout_id: checkout.id },
        { onConflict: 'user_id' },
      );
    if (error) throw error;

    return res.status(200).json({ url: `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkout.id)}` });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[checkout-create]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado ao iniciar o pagamento.' });
  }
}
