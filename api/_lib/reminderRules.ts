/**
 * Regras dos avisos da fornalha (Flay, 2026-11-10). Puras, para testar sem
 * banco. No máximo um aviso por pessoa por dia e cada tipo uma vez por
 * fornalha (a tabela `notification_log` guarda o que já saiu).
 */
export type ReminderKind = 'plan_next' | 'shopping_waiting' | 'overdue';

export interface FornalhaForRules {
  id: string;
  stage: 'shopping' | 'cooking' | 'stocked' | 'done';
  endDate?: string | null;
  createdAt: string;
  title: string;
  petNames: string[];
}

export interface Reminder {
  kind: ReminderKind;
  fornalhaId: string;
  title: string;
  body: string;
  path: string;
}

/** Antecedência do "planejar a próxima" (igual a `REMINDER_LEAD_DAYS` no app). */
export const PLAN_LEAD_DAYS = 3;
/** Lista parada há quantos dias. */
export const SHOPPING_WAIT_DAYS = 2;
/** Depois disso, não avisa mais de uma fornalha antiga. */
const STALE_DAYS = 14;

export function todayInBrazil(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
}

export function dayOf(iso: string): string {
  return iso.length === 10 ? iso : todayInBrazil(new Date(iso));
}

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${fromIso}T12:00:00Z`)) / 86_400_000);
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'sua matilha';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

const PRIORITY: ReminderKind[] = ['overdue', 'plan_next', 'shopping_waiting'];

/** O aviso de hoje para uma pessoa, ou nenhum. */
export function pickReminder(fornalhas: FornalhaForRules[], sent: Set<string>, today: string): Reminder | null {
  const candidates: Reminder[] = [];
  const inProgress = fornalhas.some((f) => f.stage === 'shopping' || f.stage === 'cooking');

  for (const f of fornalhas) {
    const names = joinNames(f.petNames);
    if (f.stage === 'stocked' && f.endDate) {
      const daysLeft = diffDays(today, f.endDate) + 1;
      if (daysLeft <= 0 && -daysLeft < STALE_DAYS) {
        candidates.push({
          kind: 'overdue', fornalhaId: f.id,
          title: 'Passou da data: ainda tem potinho?',
          body: `Conte os potinhos de ${names} e o Papazilla ajusta a data.`,
          path: '/papa',
        });
      } else if (!inProgress && daysLeft >= 1 && daysLeft <= PLAN_LEAD_DAYS) {
        candidates.push({
          kind: 'plan_next', fornalhaId: f.id,
          title: daysLeft === 1 ? 'Hoje é o último dia de comida' : `Faltam ${daysLeft} dias de comida`,
          body: `Bora planejar a próxima fornalha de ${names}?`,
          path: '/papa',
        });
      }
    }
    if (f.stage === 'shopping') {
      const waited = diffDays(dayOf(f.createdAt), today);
      if (waited >= SHOPPING_WAIT_DAYS && waited < STALE_DAYS) {
        candidates.push({
          kind: 'shopping_waiting', fornalhaId: f.id,
          title: 'Sua lista de compras está esperando',
          body: `${f.title} para ${names}. Já tem tudo? Bora para a panela.`,
          path: '/papa/compras',
        });
      }
    }
  }

  const fresh = candidates.filter((c) => !sent.has(`${c.fornalhaId}:${c.kind}`));
  fresh.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
  return fresh[0] ?? null;
}
