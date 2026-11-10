/** E-mail dos avisos da fornalha. */
import { appUrl, escapeHtml, sendEmail } from './email.js';

export { appUrl, emailConfigured } from './email.js';

export async function sendReminderEmail(to: string, reminder: { title: string; body: string; path: string }): Promise<void> {
  const base = appUrl();
  await sendEmail(to, {
    subject: reminder.title,
    title: reminder.title,
    paragraphs: [reminder.body],
    button: { label: 'Abrir o Papazilla', href: `${base}${reminder.path}` },
    footer: `Você recebe este aviso porque ligou os avisos da fornalha por e-mail. Para mudar ou desligar, abra <a href="${escapeHtml(`${base}/conta`)}" style="color:#b84726">Conta › Avisos da fornalha</a>.`,
  });
}
