/**
 * Cliente mínimo da API do Asaas (REST puro, sem SDK — a API é pequena o
 * bastante pra não valer a dependência). Autenticação por header
 * `access_token` (não é Bearer/OAuth — convenção própria do Asaas).
 *
 * `ASAAS_ENV=production` pra ambiente de produção; qualquer outro valor (ou
 * ausente) usa o sandbox — assim o padrão é sempre o lado seguro.
 */
const ASAAS_ENV = process.env.ASAAS_ENV === 'production' ? 'production' : 'sandbox';
const ASAAS_BASE_URL = ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error('ASAAS_API_KEY não configurada.');
  return key;
}

export async function asaasFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Papazilla/1.0 (contato@papazilla.app)',
      access_token: apiKey(),
      ...init.headers,
    },
  });
  const body: any = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.errors?.[0]?.description || `Asaas respondeu ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}
