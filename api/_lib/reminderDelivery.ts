import type { SupabaseClient } from '@supabase/supabase-js';
import { PushGoneError, sendPush, vapidFromEnv } from './webPush.js';
import { sendReminderEmail } from './reminderEmail.js';

export interface Delivery {
  title: string;
  body: string;
  path: string;
  tag?: string;
}

/** Envia para todos os aparelhos da pessoa. Devolve quantos receberam. Apaga inscrições expiradas. */
export async function deliverPush(admin: SupabaseClient, ownerId: string, message: Delivery): Promise<number> {
  const keys = vapidFromEnv();
  if (!keys) throw new Error('VAPID não configurado (VITE_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).');
  const { data, error } = await admin.from('push_subscriptions').select('endpoint, p256dh, auth').eq('owner_id', ownerId);
  if (error) throw error;
  let delivered = 0;
  for (const target of data ?? []) {
    try {
      await sendPush(target, { title: message.title, body: message.body, url: message.path, tag: message.tag ?? 'papazilla' }, keys);
      delivered += 1;
    } catch (err) {
      if (err instanceof PushGoneError) {
        await admin.from('push_subscriptions').delete().eq('endpoint', target.endpoint);
      } else {
        console.error('[reminders] push', err);
      }
    }
  }
  return delivered;
}

export async function deliverEmail(admin: SupabaseClient, ownerId: string, message: Delivery): Promise<boolean> {
  const { data, error } = await admin.auth.admin.getUserById(ownerId);
  const email = data?.user?.email;
  if (error || !email) return false;
  await sendReminderEmail(email, message);
  return true;
}
