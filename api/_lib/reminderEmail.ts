/** E-mail dos avisos pelo Resend (REST, sem SDK). */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

export function appUrl(): string {
  const configured = process.env.REMINDER_APP_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : 'https://papazilla.app';
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendReminderEmail(to: string, reminder: { title: string; body: string; path: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY não configurada.');
  const base = appUrl();
  const link = `${base}${reminder.path}`;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#fff8f3;font-family:Nunito,Arial,sans-serif;color:#4a2d22">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font:800 20px/1 Arial,sans-serif;color:#4a2d22">Papazilla</p>
<h1 style="margin:0 0 12px;font:700 26px/1.2 Arial,sans-serif">${escapeHtml(reminder.title)}</h1>
<p style="margin:0 0 24px;font:400 16px/1.5 Arial,sans-serif;color:#6b4a3e">${escapeHtml(reminder.body)}</p>
<a href="${escapeHtml(link)}" style="display:inline-block;padding:16px 28px;border-radius:22px;background:#f98b69;color:#4a2d22;font:800 16px/1 Arial,sans-serif;text-decoration:none">Abrir o Papazilla</a>
<p style="margin:32px 0 0;font:400 13px/1.5 Arial,sans-serif;color:#7a5c50">Você recebe este aviso porque escolheu os avisos da fornalha por e-mail. Para mudar ou desligar, abra <a href="${escapeHtml(`${base}/conta`)}" style="color:#b84726">Conta › Avisos da fornalha</a>.</p>
</div></body></html>`;
  const text = `${reminder.title}\n\n${reminder.body}\n\nAbrir o Papazilla: ${link}\n\nPara mudar ou desligar os avisos: ${base}/conta`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.REMINDER_EMAIL_FROM || 'Papazilla <avisos@papazilla.app>',
      to: [to],
      subject: reminder.title,
      html,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Resend recusou (${res.status}): ${(await res.text().catch(() => '')).slice(0, 200)}`);
}
