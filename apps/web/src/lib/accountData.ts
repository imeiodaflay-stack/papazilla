/**
 * Exportar/excluir os dados locais da conta (Fase 0 — tudo vive em
 * `localStorage`, nada em Supabase ainda). Opera em qualquer chave prefixada
 * com `papazilla.`, então acompanha automaticamente novos módulos que
 * passarem a guardar dados aqui — não é uma lista fixa que fica desatualizada.
 */
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

/** Baixa um .json com todos os dados locais da conta. */
export function downloadAccountData(): void {
  const data = collectAccountData();
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

/** Apaga todos os dados locais da conta (pets, receitas, assinatura, sessão, perfil). Irreversível. */
export function deleteAccountData(): void {
  for (const key of papazillaKeys()) localStorage.removeItem(key);
}
