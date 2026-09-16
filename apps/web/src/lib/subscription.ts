/**
 * Assinatura simulada localmente (Fase 0, sem provedor de pagamento real —
 * ver `arquitetura-tecnica.md`: "provedor e rota de pagamento" seguem em
 * aberto). Espelha `papazilla.subscription` do protótipo: só existe pra
 * a oferta e o gerenciamento terem estado pra reagir, nenhuma cobrança
 * acontece de verdade.
 */
const SUBSCRIPTION_KEY = 'papazilla.subscription';

/**
 * Oferta única (decisão de produto, Flay 2026-09): sem plano mensal — só o
 * anual, com preço "de/por" e parcelamento. `plan` continua existindo como
 * campo pra não forçar uma migração de forma nos outros lugares que leem
 * `Subscription`, mas hoje só tem um valor possível.
 */
export type SubscriptionPlan = 'annual';
export type SubscriptionPayment = 'upfront' | 'installments';

export const ANNUAL_ORIGINAL_PRICE = 149.99;
export const ANNUAL_PRICE = 99.99;
export const INSTALLMENTS_COUNT = 6;
export const INSTALLMENT_PRICE = ANNUAL_PRICE / INSTALLMENTS_COUNT;

export interface Subscription {
  plan: SubscriptionPlan;
  payment: SubscriptionPayment;
  /** Quando a assinatura simulada começou — base para calcular a "próxima renovação". */
  startedAt: string;
}

export function getSubscription(): Subscription | null {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Subscription>;
    if (parsed.plan !== 'annual') return null;
    if (parsed.payment !== 'upfront' && parsed.payment !== 'installments') return null;
    return { plan: parsed.plan, payment: parsed.payment, startedAt: parsed.startedAt ?? new Date().toISOString() };
  } catch {
    return null;
  }
}

export function setSubscription(input: { plan: SubscriptionPlan; payment: SubscriptionPayment }): void {
  const subscription: Subscription = { ...input, startedAt: new Date().toISOString() };
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

/** Data da próxima renovação simulada: +365 dias. */
export function nextRenewalDate(subscription: Subscription): Date {
  const start = new Date(subscription.startedAt);
  return new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
}

export function formatRenewalDate(subscription: Subscription): string {
  return nextRenewalDate(subscription).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
