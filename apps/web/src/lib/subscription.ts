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
}

export function getSubscription(): Subscription | null {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Subscription>;
    if (parsed.plan !== 'annual' && parsed.plan !== 'monthly') return null;
    if (!parsed.payment) return null;
    return { plan: parsed.plan, payment: parsed.payment };
  } catch {
    return null;
  }
}

export function setSubscription(subscription: Subscription): void {
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}
