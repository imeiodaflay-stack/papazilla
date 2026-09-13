/**
 * Assinatura simulada localmente (Fase 0, sem provedor de pagamento real —
 * ver `arquitetura-tecnica.md`: "provedor e rota de pagamento" seguem em
 * aberto). Espelha `papazilla.subscription` do protótipo: só existe pra
 * a oferta e o gerenciamento terem estado pra reagir, nenhuma cobrança
 * acontece de verdade.
 */
const SUBSCRIPTION_KEY = 'papazilla.subscription';

export type SubscriptionPlan = 'annual' | 'monthly';
export type SubscriptionPayment = 'upfront' | 'installments' | 'monthly';

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
    if (parsed.plan !== 'annual' && parsed.plan !== 'monthly') return null;
    if (!parsed.payment) return null;
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

/** Data da próxima renovação simulada: +365 dias (anual) ou +30 dias (mensal). */
export function nextRenewalDate(subscription: Subscription): Date {
  const start = new Date(subscription.startedAt);
  const days = subscription.plan === 'annual' ? 365 : 30;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatRenewalDate(subscription: Subscription): string {
  return nextRenewalDate(subscription).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
