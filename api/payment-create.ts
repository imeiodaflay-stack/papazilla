import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asaasFetch } from './_lib/asaas.js';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';

const ANNUAL_PRICE = 99.99;

type PaymentMethod = 'credit_card' | 'pix';

interface PayerInput {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
}

interface CreditCardInput {
  holderName?: string;
  number?: string;
  expiryMonth?: string;
  expiryYear?: string;
  ccv?: string;
}

interface AsaasCustomer {
  id: string;
}

interface AsaasSubscription {
  id: string;
}

interface AsaasPayment {
  id: string;
}

interface PixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

function digits(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function requiredText(value: unknown, label: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HttpError(400, `Preencha ${label}.`);
  return text;
}

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function requestIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

function publicPaymentError(error: unknown): string {
  if (!(error instanceof Error)) return 'Não foi possível processar o pagamento.';
  if (error.message.includes('ASAAS_API_KEY')) return 'O pagamento está temporariamente indisponível.';
  return error.message.replace(/asaas/gi, 'processador de pagamentos');
}

async function ensureCustomer(
  user: Awaited<ReturnType<typeof requireUser>>,
  payer: PayerInput,
  existingCustomerId: string | null,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const cpfCnpj = digits(payer.cpfCnpj);
  const mobilePhone = digits(payer.mobilePhone);
  if (![11, 14].includes(cpfCnpj.length)) throw new HttpError(400, 'Informe um CPF ou CNPJ válido.');
  if (mobilePhone.length < 10) throw new HttpError(400, 'Informe um celular válido.');

  const customer = await asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: requiredText(payer.name, 'o nome completo'),
      email: requiredText(payer.email || user.email, 'o e-mail'),
      cpfCnpj,
      mobilePhone,
      externalReference: user.id,
      notificationDisabled: true,
    }),
  });
  return customer.id;
}

/**
 * Checkout transparente do Papazilla. Os dados do cartão passam somente por
 * esta Function HTTPS e seguem direto para a API de pagamentos; não são
 * persistidos, registrados em log ou devolvidos ao navegador.
 *
 * Crédito cria uma assinatura anual com renovação automática. Pix cria uma
 * cobrança anual avulsa: libera os mesmos 12 meses, com renovação manual por
 * um novo Pix ao fim do período.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const user = await requireUser(req.headers.authorization);
    const method = req.body?.method as PaymentMethod | undefined;
    const payer = (req.body?.payer ?? {}) as PayerInput;
    const creditCard = (req.body?.creditCard ?? {}) as CreditCardInput;
    if (method !== 'credit_card' && method !== 'pix') throw new HttpError(400, 'Escolha Pix ou cartão de crédito.');

    const admin = supabaseAdmin();
    const { data: existing, error: existingError } = await admin
      .from('subscriptions')
      .select('status,current_period_end,asaas_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing && ['active', 'canceled'].includes(existing.status) && existing.current_period_end &&
        new Date(existing.current_period_end).getTime() > Date.now()) {
      throw new HttpError(409, 'Sua assinatura já está ativa.');
    }

    const customerId = await ensureCustomer(user, payer, existing?.asaas_customer_id ?? null);
    const pendingBase = {
      user_id: user.id,
      status: 'pending',
      plan: 'annual',
      payment_method: method,
      asaas_customer_id: customerId,
      asaas_checkout_id: null,
      current_period_end: null,
    };

    if (method === 'credit_card') {
      const cpfCnpj = digits(payer.cpfCnpj);
      const mobilePhone = digits(payer.mobilePhone);
      const postalCode = digits(payer.postalCode);
      const number = digits(creditCard.number);
      const expiryMonth = digits(creditCard.expiryMonth);
      let expiryYear = digits(creditCard.expiryYear);
      const ccv = digits(creditCard.ccv);
      if (expiryYear.length === 2) expiryYear = `20${expiryYear}`;
      if (number.length < 13 || number.length > 19) throw new HttpError(400, 'Informe um número de cartão válido.');
      if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth) || expiryYear.length !== 4) throw new HttpError(400, 'Informe uma validade válida.');
      if (ccv.length < 3 || ccv.length > 4) throw new HttpError(400, 'Informe um código de segurança válido.');
      if (postalCode.length !== 8) throw new HttpError(400, 'Informe um CEP válido.');

      const { error: pendingError } = await admin.from('subscriptions').upsert(
        { ...pendingBase, asaas_payment_id: null, asaas_subscription_id: null },
        { onConflict: 'user_id' },
      );
      if (pendingError) throw pendingError;

      const subscription = await asaasFetch<AsaasSubscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          billingType: 'CREDIT_CARD',
          value: ANNUAL_PRICE,
          nextDueDate: todayInSaoPaulo(),
          cycle: 'YEARLY',
          description: 'Papazilla Anual',
          externalReference: user.id,
          creditCard: {
            holderName: requiredText(creditCard.holderName, 'o nome impresso no cartão'),
            number,
            expiryMonth,
            expiryYear,
            ccv,
          },
          creditCardHolderInfo: {
            name: requiredText(payer.name, 'o nome completo'),
            email: requiredText(payer.email || user.email, 'o e-mail'),
            cpfCnpj,
            postalCode,
            addressNumber: requiredText(payer.addressNumber, 'o número do endereço'),
            mobilePhone,
          },
          remoteIp: requestIp(req),
        }),
      });

      const { error: updateError } = await admin
        .from('subscriptions')
        .update({ asaas_subscription_id: subscription.id })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
      return res.status(200).json({ status: 'processing' });
    }

    const { error: pendingError } = await admin.from('subscriptions').upsert(
      { ...pendingBase, asaas_payment_id: null, asaas_subscription_id: null },
      { onConflict: 'user_id' },
    );
    if (pendingError) throw pendingError;

    const payment = await asaasFetch<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: ANNUAL_PRICE,
        dueDate: todayInSaoPaulo(),
        description: 'Papazilla Anual',
        externalReference: user.id,
      }),
    });
    const { error: updateError } = await admin
      .from('subscriptions')
      .update({ asaas_payment_id: payment.id })
      .eq('user_id', user.id);
    if (updateError) throw updateError;

    const qrCode = await asaasFetch<PixQrCode>(`/payments/${encodeURIComponent(payment.id)}/pixQrCode`, { method: 'GET' });
    return res.status(200).json({
      status: 'awaiting_payment',
      pix: {
        encodedImage: qrCode.encodedImage,
        payload: qrCode.payload,
        expirationDate: qrCode.expirationDate,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[payment-create]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: publicPaymentError(err) });
  }
}
