/**
 * Espelho em JS dos tokens de `tokens.css`, para uso em lógica (ex.: cor de série
 * em gráfico, tema de status). A fonte de verdade continua sendo o CSS.
 */
export const color = {
  coral: '#f98b69',
  coralStrong: '#e9744f',
  coralHover: '#fba184',
  pessego: '#f7bda3',
  verde: '#adb047',
  verdeStrong: '#8c9038',
  verdeHover: '#c3c765',
  oliva: '#716a11',
  chocolate: '#4a2d22',
  creme: '#fff8f3',
  /** Coral e verde são cores de PREENCHIMENTO. Para texto/links use estes tons. */
  accentInk: '#b84726',
  secondaryInk: '#716a11',
} as const;

export const font = {
  display: "'Fredoka', ui-rounded, system-ui, sans-serif",
  support: "'Nunito', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
} as const;

export const radius = {
  sm: '0.75rem',
  md: '1.125rem',
  lg: '1.75rem',
  pill: '999px',
} as const;

export const duration = {
  tap: 120,
  enter: 220,
  celebrate: 320,
} as const;

/** Movimento é curto e decidido — nunca elástico/bounce (PRODUCT.md). */
export const easeEnter = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const touchMinPx = 44;
