import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asaasFetch } from './_lib/asaas.js';
import { HttpError, requireUser, supabaseAdmin } from './_lib/supabaseAdmin.js';

const PHOTO_BUCKETS = ['pet-photos', 'cook-photos', 'avatars'];

/** Exclui Storage, Auth e dados relacionados depois de interromper a cobrança. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const user = await requireUser(req.headers.authorization);
    if (req.body?.confirm !== true) throw new HttpError(400, 'Confirme a exclusão da conta.');
    const admin = supabaseAdmin();
    const { data: sub, error: subError } = await admin.from('subscriptions')
      .select('asaas_subscription_id,asaas_checkout_id,asaas_payment_id,payment_method,status').eq('user_id', user.id).maybeSingle();
    if (subError) throw subError;
    if (sub?.status === 'active' && sub.payment_method !== 'pix' && !sub.asaas_subscription_id) {
      throw new HttpError(409, 'A assinatura precisa ser conferida antes da exclusão. Entre em contato com o suporte.');
    }

    // A exclusão não pode ocultar uma cobrança recorrente ainda ativa no Asaas.
    if (sub?.asaas_subscription_id && sub.status !== 'canceled') {
      await asaasFetch(`/subscriptions/${encodeURIComponent(sub.asaas_subscription_id)}`, { method: 'DELETE' });
      const { error } = await admin.from('subscriptions')
        .update({ status: 'canceled', asaas_subscription_id: null }).eq('user_id', user.id);
      if (error) throw error;
    }
    if (sub?.status === 'pending' && sub.asaas_checkout_id) {
      await asaasFetch(`/checkouts/${encodeURIComponent(sub.asaas_checkout_id)}/cancel`, { method: 'POST' });
      const { error } = await admin.from('subscriptions')
        .update({ status: 'none', asaas_checkout_id: null }).eq('user_id', user.id);
      if (error) throw error;
    }
    if (sub?.status === 'pending' && sub.asaas_payment_id) {
      await asaasFetch(`/payments/${encodeURIComponent(sub.asaas_payment_id)}`, { method: 'DELETE' });
      const { error } = await admin.from('subscriptions')
        .update({ status: 'none', asaas_payment_id: null }).eq('user_id', user.id);
      if (error) throw error;
    }

    for (const bucket of PHOTO_BUCKETS) {
      // Os uploads atuais ficam em <user-id>/<uuid>.<ext>. Sempre buscamos a
      // primeira página: após remover, a próxima toma seu lugar.
      for (;;) {
        const { data, error } = await admin.storage.from(bucket).list(user.id, { limit: 100 });
        if (error) {
          if (/bucket not found/i.test(error.message)) break;
          throw error;
        }
        if (!data?.length) break;
        const paths = data.filter((item) => item.name).map((item) => `${user.id}/${item.name}`);
        if (!paths.length) break;
        const removed = await admin.storage.from(bucket).remove(paths);
        if (removed.error) throw removed.error;
      }
    }

    // profiles/pets/recipes/preparations/subscriptions possuem FK com CASCADE.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    return res.status(200).json({ deleted: true });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('[account-delete]', err);
    return res.status(500).json({ error: 'Não foi possível excluir a conta. Nenhum dado local foi apagado; tente novamente ou entre em contato.' });
  }
}
