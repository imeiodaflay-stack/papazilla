/**
 * Assinatura real via API de pagamentos (substitui a simulação em `localStorage` da
 * Fase 0 — qualquer pessoa podia "assinar de graça" editando o navegador).
 *
 * `cachedSubscription` é carregado da tabela `subscriptions` (Supabase) por
 * `loadSubscriptionForOwner`, chamada por `session.ts` no mesmo fluxo que já
 * carrega a matilha — pelo `main.tsx` esperar `initAuth()` antes do primeiro
 * render, o cache já está pronto quando qualquer tela lê `getSubscription()`
 * de forma síncrona (mesma convenção de `petsStore.ts`).
 *
 * Sem Supabase configurado, ou sem sessão, não existe assinatura — ao
 * contrário de pets, não há fallback local: pagamento de verdade só pode vir
 * confirmado pelo servidor (webhook → `/api/webhooks-asaas`), nunca
 * inventado no navegador.
 *
 * Decisão de produto (Flay, 2026-09): oferta única, Papazilla Anual R$99,99,
 * cobrança recorrente automática no cartão, ou pagamento anual por Pix com
 * renovação manual. Sem parcelamento no MVP.
 */
import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';

export const ANNUAL_PRICE = 99.99;

export type SubscriptionStatus = 'none' | 'pending' | 'active' | 'past_due' | 'canceled';

export interface Subscription {
  status: SubscriptionStatus;
  plan: 'annual';
  currentPeriodEnd: string | null;
  paymentMethod: 'credit_card' | 'pix' | null;
}

interface SubscriptionRow {
  status: SubscriptionStatus;
  plan: string;
  current_period_end: string | null;
  payment_method: 'credit_card' | 'pix' | null;
}

let cachedSubscription: Subscription | null = null;
let ownerId: string | null = null;

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    status: row.status,
    plan: 'annual',
    currentPeriodEnd: row.current_period_end,
    paymentMethod: row.payment_method,
  };
}

/** Chamada por `session.ts` a cada mudança de sessão, igual `loadPetsForOwner`. */
export async function loadSubscriptionForOwner(userId: string | null): Promise<void> {
  ownerId = userId;
  if (!isSupabaseConfigured || !supabase || !userId) {
    cachedSubscription = null;
    return;
  }
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end, payment_method')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[subscription] Falha ao carregar a assinatura', error);
    return;
  }
  cachedSubscription = data ? rowToSubscription(data as SubscriptionRow) : null;
}

/** Leitura síncrona do cache em memória — ver nota de arquivo sobre `main.tsx`/`initAuth()`. */
export function getSubscription(): Subscription | null {
  return cachedSubscription;
}

/**
 * Acesso liberado: assinatura ativa, ou cancelada mas ainda dentro do
 * período já pago (o cancelamento pára a próxima cobrança, não corta o
 * acesso do período corrente — mesma promessa que já fazíamos na Fase 0).
 */
export function hasActiveAccess(subscription: Subscription | null): boolean {
  return Boolean(
    subscription && ['active', 'canceled'].includes(subscription.status) &&
    subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).getTime() > Date.now(),
  );
}

export function formatRenewalDate(subscription: Subscription): string {
  if (!subscription.currentPeriodEnd) return '—';
  return new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function authedFetch(path: string, body?: unknown): Promise<Response> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  return fetch(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Envia os dados do checkout próprio à Function segura, sem persistir cartão no navegador ou banco. */
export interface TransparentPaymentInput {
  method: 'credit_card' | 'pix';
  payer: {
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone: string;
    postalCode?: string;
    addressNumber?: string;
  };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
}

export interface PaymentCreationResult {
  status: 'processing' | 'awaiting_payment';
  pix?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
}

export async function createTransparentPayment(input: TransparentPaymentInput): Promise<PaymentCreationResult> {
  const res = await authedFetch('/api/payment-create', input);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) throw new Error(body?.error || 'Não foi possível processar o pagamento.');
  return body as PaymentCreationResult;
}

/** Cancela a renovação automática no processador e atualiza o cache local. */
export async function cancelSubscription(): Promise<void> {
  const res = await authedFetch('/api/subscription-cancel');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Não foi possível cancelar a renovação.');
  }
  await loadSubscriptionForOwner(ownerId);
}
