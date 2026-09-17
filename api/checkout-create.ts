import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';
import { asaasFetch } from './_lib/asaas.js';

const ANNUAL_PRICE = 99.99;

interface AsaasCheckout {
  id: string;
  link: string;
}

function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

/**
 * Cria uma sessão de Checkout hospedada pelo Asaas (assinatura recorrente
 * anual, só cartão — ver decisão de produto em `subscription.ts`) e devolve
 * a URL de pagamento. A assinatura só é liberada de verdade quando o Asaas
 * confirmar o pagamento pelo webhook (`webhooks-asaas.ts`), nunca aqui.
 *
 * MODO DEMONSTRAÇÃO (Flay, 2026-09-17): enquanto `ASAAS_API_KEY` não estiver
 * configurada, "Assinar" libera o acesso na hora, sem cobrança real — pedido
 * explícito pra poder demonstrar o app de ponta a ponta antes de ligar o
 * Asaas (uma das últimas peças do MVP). Não é um botão separado nem uma
 * bandeira no código: no dia em que a chave existir no ambiente, este mesmo
 * caminho passa a criar o Checkout de verdade automaticamente — nada a
 * lembrar de desligar.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const user = await requireUser(req.headers.authorization);
    const admin = supabaseAdmin();
    const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    const returnTo = ['papa', 'conta', 'recipe'].includes(req.body?.returnTo) ? req.body.returnTo : 'papa';

    if (!process.env.ASAAS_API_KEY) {
      const { error } = await admin.from('subscriptions').upsert(
        {
          user_id: user.id, status: 'active', plan: 'annual',
          current_period_end: addYears(new Date(), 1),
          asaas_checkout_id: null, asaas_subscription_id: null,
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
      return res.status(200).json({ url: `${appUrl}/assinatura/confirmando?returnTo=${returnTo}` });
    }

    const checkout = await asaasFetch<AsaasCheckout>('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['RECURRENT'],
        subscription: { cycle: 'YEARLY' },
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
          cancelUrl: `${appUrl}/assinatura`,
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

    return res.status(200).json({ url: checkout.link });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[checkout-create]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado ao iniciar o pagamento.' });
  }
}
