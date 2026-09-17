import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';

/** Dados locais continuam exportáveis no modo de demonstração desconectado. */
function papazillaKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith('papazilla.')) keys.push(key);
  }
  return keys;
}

export function collectAccountData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of papazillaKeys()) {
    const raw = localStorage.getItem(key);
    try {
      data[key] = raw === null ? null : JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }
  return data;
}

async function authedRequest(path: string, method: 'GET' | 'POST'): Promise<Record<string, unknown>> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  const response = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ confirm: true }) } : {}),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Não foi possível concluir a solicitação.');
  return body as Record<string, unknown>;
}

/** Baixa um .json da conta remota, ou dos dados locais no modo desconectado. */
export async function downloadAccountData(): Promise<void> {
  const data = isSupabaseConfigured
    ? { ...(await authedRequest('/api/account-export', 'GET')), nesteAparelho: collectAccountData() }
    : collectAccountData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `papazilla-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Apaga apenas o cache deste aparelho, depois que o servidor confirmou a exclusão. */
export function deleteAccountData(): void {
  for (const key of papazillaKeys()) localStorage.removeItem(key);
}

export async function deleteAccount(): Promise<void> {
  if (isSupabaseConfigured) await authedRequest('/api/account-delete', 'POST');
  deleteAccountData();
  if (supabase) await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}
