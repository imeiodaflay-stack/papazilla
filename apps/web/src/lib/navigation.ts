import type { NavigateFunction } from 'react-router-dom';

/**
 * Botão "Voltar" das telas internas: volta uma posição no histórico quando
 * existe tela anterior dentro do app; se a pessoa abriu a tela direto (link,
 * recarga), vai para `fallback` substituindo a entrada atual.
 *
 * Evita o loop Conta → Termos → Voltar → Conta → Voltar → Termos, que acontecia
 * porque o voltar das subtelas empurrava uma nova entrada `/conta` no histórico
 * em vez de voltar para a que já existia.
 */
export function goBackOr(navigate: NavigateFunction, fallback: string): void {
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (idx > 0) navigate(-1);
  else navigate(fallback, { replace: true });
}
