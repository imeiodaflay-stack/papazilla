import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { pickReminder, todayInBrazil, type FornalhaForRules } from './_lib/reminderRules.js';
import { deliverEmail, deliverPush } from './_lib/reminderDelivery.js';

/**
 * Avisos da fornalha, uma vez por dia às 08h de Brasília (Vercel Schedules,
 * `avisos-da-fornalha` em `vercel.json`). Dá para rodar na hora pelo painel
 * (Schedules › Run Schedule) ou com `Authorization: Bearer $CRON_SECRET`
 * (e `?dry=1` para só ver o que sairia). Se a Vercel repetir uma execução, o
 * `notification_log` impede aviso em dobro.
 *
 * Para cada pessoa com avisos no celular e/ou por e-mail: escolhe no máximo um aviso
 * (`pickReminder`), reserva no `notification_log` (cada tipo uma vez por
 * fornalha, mesmo com duas execuções ao mesmo tempo), envia e, se nada
 * chegou, libera a reserva para tentar no dia seguinte.
 */
interface FornalhaRow {
  id: string;
  owner_id: string;
  stage: FornalhaForRules['stage'];
  end_date: string | null;
  created_at: string;
  data: { title?: string; pets?: { name?: string }[] } | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Não autorizado.' });
  const dry = req.query.dry === '1';

  try {
    const admin = supabaseAdmin();
    const today = todayInBrazil();

    const { data: prefs, error: prefsError } = await admin.from('notification_prefs').select('owner_id, push, email').or('push.eq.true,email.eq.true');
    if (prefsError) throw prefsError;
    const prefsOf = new Map((prefs ?? []).map((p) => [p.owner_id as string, { push: Boolean(p.push), email: Boolean(p.email) }]));
    const owners = [...prefsOf.keys()];
    if (owners.length === 0) return res.status(200).json({ today, sent: [], skipped: 0 });

    const fornalhas: FornalhaRow[] = [];
    for (let i = 0; i < owners.length; i += 200) {
      const { data, error } = await admin.from('fornalhas')
        .select('id, owner_id, stage, end_date, created_at, data')
        .in('owner_id', owners.slice(i, i + 200))
        .in('stage', ['shopping', 'cooking', 'stocked']);
      if (error) throw error;
      fornalhas.push(...((data ?? []) as FornalhaRow[]));
    }

    const ids = fornalhas.map((f) => f.id);
    const sent = new Set<string>();
    for (let i = 0; i < ids.length; i += 300) {
      const { data, error } = await admin.from('notification_log').select('fornalha_id, kind').in('fornalha_id', ids.slice(i, i + 300));
      if (error) throw error;
      for (const row of data ?? []) sent.add(`${row.fornalha_id}:${row.kind}`);
    }

    const byOwner = new Map<string, FornalhaForRules[]>();
    for (const f of fornalhas) {
      const list = byOwner.get(f.owner_id) ?? [];
      list.push({
        id: f.id, stage: f.stage, endDate: f.end_date, createdAt: f.created_at,
        title: f.data?.title || 'A receita', petNames: (f.data?.pets ?? []).map((p) => p.name || '').filter(Boolean),
      });
      byOwner.set(f.owner_id, list);
    }

    const report: { owner: string; kind: string; channel: string; ok: boolean }[] = [];
    for (const [owner, list] of byOwner) {
      const reminder = pickReminder(list, sent, today);
      const pref = prefsOf.get(owner);
      if (!reminder || !pref) continue;
      const channel = [pref.push ? 'push' : '', pref.email ? 'email' : ''].filter(Boolean).join(',');
      if (dry) {
        report.push({ owner, kind: reminder.kind, channel, ok: true });
        continue;
      }
      const { data: claimed, error: claimError } = await admin.from('notification_log')
        .upsert({ fornalha_id: reminder.fornalhaId, kind: reminder.kind, owner_id: owner, channel }, { onConflict: 'fornalha_id,kind', ignoreDuplicates: true })
        .select('fornalha_id');
      if (claimError) throw claimError;
      if (!claimed?.length) continue;

      // Celular e e-mail são independentes: basta um chegar para contar como enviado.
      let ok = false;
      if (pref.push) {
        try {
          ok = (await deliverPush(admin, owner, { ...reminder, tag: reminder.kind })) > 0 || ok;
        } catch (err) {
          console.error('[reminders-cron] push', owner, err);
        }
      }
      if (pref.email) {
        try {
          ok = (await deliverEmail(admin, owner, reminder)) || ok;
        } catch (err) {
          console.error('[reminders-cron] email', owner, err);
        }
      }
      if (!ok) await admin.from('notification_log').delete().eq('fornalha_id', reminder.fornalhaId).eq('kind', reminder.kind);
      report.push({ owner, kind: reminder.kind, channel, ok });
    }

    return res.status(200).json({ today, dry, sent: report });
  } catch (err) {
    console.error('[reminders-cron]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado.' });
  }
}
