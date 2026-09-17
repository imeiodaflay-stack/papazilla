/**
 * Assinatura real via Asaas (substitui a simulação em `localStorage` da
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
 * confirmado pelo servidor (webhook do Asaas → `/api/webhooks-asaas`), nunca
 * inventado no navegador.
 *
 * Decisão de produto (Flay, 2026-09): oferta única, Papazilla Anual R$99,99,
 * cobrança recorrente automática só no cartão — sem parcelamento (o Asaas
 * não parcela cobrança recorrente; parcelar exigiria uma compra avulsa que
 * não renova sozinha, ver handover). Isso substitui a oferta "à vista ou 6x"
 * desenhada antes desta decisão.
 */
import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';

export const ANNUAL_PRICE = 99.99;

export type SubscriptionStatus = 'none' | 'pending' | 'active' | 'past_due' | 'canceled';

export interface Subscription {
  status: SubscriptionStatus;
  plan: 'annual';
  currentPeriodEnd: string | null;
}

interface SubscriptionRow {
  status: SubscriptionStatus;
  plan: string;
  current_period_end: string | null;
}

let cachedSubscription: Subscription | null = null;
let ownerId: string | null = null;

function rowToSubscription(row: SubscriptionRow): Subscription {
  return { status: row.status, plan: 'annual', currentPeriodEnd: row.current_period_end };
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
    .select('status, plan, current_period_end')
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

/**
 * Pede pro servidor criar o checkout no Asaas; devolve a URL da página de
 * pagamento hospedada. `returnTo` viaja no corpo pro servidor montar a
 * `successUrl` com ele — o Asaas não devolve query params que a gente
 * grudar na URL do checkout, só os que a gente configurou na criação.
 */
export async function createCheckoutSession(returnTo: string): Promise<string> {
  const res = await authedFetch('/api/checkout-create', { returnTo });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.url) throw new Error(body?.error || 'Não foi possível iniciar o pagamento.');
  return body.url as string;
}

/** Cancela a renovação automática no Asaas e atualiza o cache local. */
export async function cancelSubscription(): Promise<void> {
  const res = await authedFetch('/api/subscription-cancel');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Não foi possível cancelar a renovação.');
  }
  await loadSubscriptionForOwner(ownerId);
}
