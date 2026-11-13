/** Canal de contato do Papazilla para problemas com compra e uso do app. */
export const SUPPORT_EMAIL = 'hello@papazilla.app';

/** Link `mailto:` com assunto pré-preenchido, para facilitar a triagem. */
export function supportMailto(subject = 'Ajuda com o Papazilla'): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
