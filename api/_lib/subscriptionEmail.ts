import type { SupabaseClient } from '@supabase/supabase-js';
import { appUrl, emailConfigured, escapeHtml, sendEmail } from './email.js';
import { asaasFetch } from './asaas.js';
import { CARD_TOTAL, PIX_PRICE } from '../../apps/web/src/lib/pricing.js';

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
}

/**
 * Confirmação da assinatura por e-mail, logo depois de `activatePeriod`
 * liberar o ano. Melhor esforço: se o envio falhar, o acesso já está
 * liberado e o erro só vai para o log.
 */
export async function sendSubscriptionEmail(admin: SupabaseClient, userId: string): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const [{ data: userData }, { data: sub }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from('subscriptions').select('current_period_end, payment_method, installment_count, asaas_payment_id').eq('user_id', userId).maybeSingle(),
    ]);
    const email = userData?.user?.email;
    if (!email || !sub?.current_period_end) return;
    const name = (userData.user?.user_metadata?.full_name as string | undefined)?.split(' ')[0];

    // Comprovante do Asaas (as notificações do Asaas ficam desligadas, então o link vai aqui).
    let receiptUrl: string | null = null;
    if (sub.asaas_payment_id) {
      try {
        const p = await asaasFetch<{ transactionReceiptUrl?: string | null }>(`/payments/${encodeURIComponent(sub.asaas_payment_id)}`);
        receiptUrl = p.transactionReceiptUrl?.startsWith('https://') ? p.transactionReceiptUrl : null;
      } catch {
        receiptUrl = null;
      }
    }

    const count = Number(sub.installment_count) || 1;
    const payment = sub.payment_method === 'pix'
      ? `${brl(PIX_PRICE)} no Pix`
      : count > 1
        ? `${count}x de ${brl(Math.round((CARD_TOTAL / count) * 100) / 100)} no cartão`
        : `${brl(CARD_TOTAL)} no cartão`;

    await sendEmail(email, {
      subject: 'Sua assinatura do Papazilla está ativa',
      title: name ? `Prontinho, ${name}! Assinatura ativa` : 'Prontinho! Assinatura ativa',
      paragraphs: [
        'Que bom ter você no Papazilla. Agora as receitas completas na medida de cada cão e as Papazilla Originals estão liberadas.',
        'A assinatura vale por 12 meses e não renova sozinha.',
      ],
      rows: [
        ['Plano', 'Papazilla Anual'],
        ['Pagamento', payment],
        ['Acesso até', day(sub.current_period_end)],
      ],
      button: { label: 'Abrir o Papazilla', href: `${appUrl()}/papa` },
      footer: `${receiptUrl ? `<a href="${escapeHtml(receiptUrl)}" style="color:#b84726">Ver o comprovante do pagamento</a>. ` : ''}Dúvidas? Responda este e-mail ou escreva para hello@papazilla.app.`,
    }, 'Papazilla <hello@papazilla.app>');
  } catch (err) {
    console.error('[subscription-email]', err);
  }
}
