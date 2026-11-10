import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';
import { deliverEmail, deliverPush } from './_lib/reminderDelivery.js';

/**
 * Aviso de confirmação logo depois de a pessoa ligar os avisos: prova, na
 * hora, que o caminho até o aparelho (ou a caixa de e-mail) funciona.
 * Só para a própria conta e no canal que ela escolheu.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const user = await requireUser(req.headers.authorization);
    const admin = supabaseAdmin();
    const { data: pref, error } = await admin.from('notification_prefs').select('channel').eq('owner_id', user.id).maybeSingle();
    if (error) throw error;
    const message = {
      title: 'Pronto, avisos ligados',
      body: 'Eu te aviso antes da comida acabar, quando a lista ficar parada e se passar da data.',
      path: '/papa',
      tag: 'papazilla-teste',
    };
    if (pref?.channel === 'push') {
      const delivered = await deliverPush(admin, user.id, message);
      return res.status(200).json({ channel: 'push', delivered });
    }
    if (pref?.channel === 'email') {
      const delivered = await deliverEmail(admin, user.id, message);
      return res.status(200).json({ channel: 'email', delivered: delivered ? 1 : 0 });
    }
    throw new HttpError(400, 'Os avisos estão desligados.');
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[reminders-test]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado.' });
  }
}
