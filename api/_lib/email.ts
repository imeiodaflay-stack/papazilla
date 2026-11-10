/** Envio de e-mail pelo Resend (REST, sem SDK) com o layout do Papazilla. */
export function escapeHtml(value: string): string {
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

export interface EmailContent {
  subject: string;
  title: string;
  /** Parágrafos já em texto puro (escapados aqui). */
  paragraphs: string[];
  /** Linhas de resumo (rótulo, valor), opcionais. */
  rows?: [string, string][];
  button?: { label: string; href: string };
  footer: string;
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  const rows = content.rows?.length
    ? `<table role="presentation" style="width:100%;margin:0 0 24px;border-collapse:collapse;background:#ffffff;border-radius:16px">${content.rows.map(([label, value]) => `<tr><td style="padding:12px 16px;font:400 14px/1.4 Arial,sans-serif;color:#7a5c50;border-bottom:1px solid #f3e4da">${escapeHtml(label)}</td><td style="padding:12px 16px;font:700 14px/1.4 Arial,sans-serif;color:#4a2d22;text-align:right;border-bottom:1px solid #f3e4da">${escapeHtml(value)}</td></tr>`).join('')}</table>`
    : '';
  const button = content.button
    ? `<a href="${escapeHtml(content.button.href)}" style="display:inline-block;padding:16px 28px;border-radius:22px;background:#f98b69;color:#4a2d22;font:800 16px/1 Arial,sans-serif;text-decoration:none">${escapeHtml(content.button.label)}</a>`
    : '';
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#fff8f3;font-family:Arial,sans-serif;color:#4a2d22">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font:800 20px/1 Arial,sans-serif;color:#4a2d22">Papazilla</p>
<h1 style="margin:0 0 12px;font:700 26px/1.2 Arial,sans-serif">${escapeHtml(content.title)}</h1>
${content.paragraphs.map((p) => `<p style="margin:0 0 16px;font:400 16px/1.5 Arial,sans-serif;color:#6b4a3e">${escapeHtml(p)}</p>`).join('\n')}
${rows}
${button}
<p style="margin:32px 0 0;font:400 13px/1.5 Arial,sans-serif;color:#7a5c50">${content.footer}</p>
</div></body></html>`;
  const text = [
    content.title, '',
    ...content.paragraphs.flatMap((p) => [p, '']),
    ...(content.rows ?? []).map(([label, value]) => `${label}: ${value}`),
    ...(content.button ? ['', `${content.button.label}: ${content.button.href}`] : []),
    '', content.footer.replace(/<[^>]+>/g, ''),
  ].join('\n');
  return { html, text };
}

export async function sendEmail(to: string, content: EmailContent, from = process.env.REMINDER_EMAIL_FROM || 'Papazilla <avisos@papazilla.app>'): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY não configurada.');
  const { html, text } = renderEmail(content);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: 'hello@papazilla.app', subject: content.subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend recusou (${res.status}): ${(await res.text().catch(() => '')).slice(0, 200)}`);
}
