/**
 * Preços do Papazilla Anual (Flay, 2026-10-05). Usado pelo app e pelas
 * Vercel Functions (`api/payment-create.ts`, `api/subscription-renew.ts`),
 * então não importa nada do navegador.
 *
 * - Cartão: até 12x de R$ 9,90 (total R$ 118,80), renovação automática.
 * - Pix: R$ 99,90 à vista, sem renovação automática.
 * Sem promoção de lançamento.
 */
export const PIX_PRICE = 99.9;
export const CARD_MAX_INSTALLMENTS = 12;
export const CARD_INSTALLMENT_VALUE = 9.9;
export const CARD_TOTAL = Math.round(CARD_INSTALLMENT_VALUE * CARD_MAX_INSTALLMENTS * 100) / 100;

/** Valor de cada parcela para `count` parcelas (o total no cartão é sempre o mesmo). */
export function cardInstallmentValue(count: number): number {
  return Math.round((CARD_TOTAL / count) * 100) / 100;
}

/** Número de parcelas válido (1 a 12); qualquer coisa fora disso vira 12. */
export function normalizeInstallments(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= CARD_MAX_INSTALLMENTS ? n : CARD_MAX_INSTALLMENTS;
}
