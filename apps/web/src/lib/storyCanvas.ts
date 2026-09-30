/**
 * Utilitários compartilhados das imagens de compartilhamento (formato
 * story/reels, 1080×1920): receita (`recipeStoryImage.ts`) e perfil do pet
 * (`petStoryImage.ts`).
 */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export const STORY_COLORS = {
  ink: '#4a2d22',
  inkMuted: '#7a5c50',
  inkLabel: '#8a6a5e',
  creme: '#fff8f3',
  surfaceSoft: '#fcede4',
  coral: '#f98b69',
  pessego: '#f7bda3',
  verde: '#adb047',
  verdeInk: '#4c5a16',
  verdeSoft: '#eaf0d4',
  mostarda: '#d3a038',
  chocolate: '#4a2d22',
  border: 'rgb(74 45 34 / 14%)',
};

/** Chamada fixa pro site no rodapé das imagens (Flay, 2026-09-30). */
export const STORY_CTA = 'Comida de verdade, na medida do seu cão.';
export const STORY_URL = 'papazilla.app';

export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    img.src = src;
  });
}

export async function ensureFontsReady(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('700 64px Fredoka'),
      document.fonts.load('600 44px Fredoka'),
      document.fonts.load('800 40px Nunito'),
      document.fonts.load('700 34px Nunito'),
      document.fonts.load('400 32px Nunito'),
      document.fonts.load('700 44px Caveat'),
    ]);
    await document.fonts.ready;
  } catch {
    /* segue com a fonte de sistema se o carregamento falhar */
  }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Traço curto e arredondado, os "riscos" decorativos da marca. */
export function drawDash(ctx: CanvasRenderingContext2D, cx: number, cy: number, len: number, angleDeg: number, color: string, width = 7): void {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = (Math.cos(rad) * len) / 2;
  const dy = (Math.sin(rad) * len) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.stroke();
  ctx.restore();
}

/** Sublinhado ondulado curto, tipo rabisco. */
export function drawSquiggle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + w * 0.25, y - 12, x + w * 0.5, y);
  ctx.quadraticCurveTo(x + w * 0.75, y + 12, x + w, y);
  ctx.stroke();
  ctx.restore();
}

/** Quebra `text` em até `maxLines` linhas que cabem em `maxWidth`; desenha e devolve o y final. */
export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Infinity,
): number {
  const lines = wrapLines(ctx, text, maxWidth, maxLines);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = Infinity): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const shown = lines.slice(0, maxLines);
  let last = shown[shown.length - 1]!;
  while (last.length > 0 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
  shown[shown.length - 1] = `${last}…`;
  return shown;
}

/** Wordmark centralizado no topo; devolve o y logo abaixo dele. */
export function drawWordmark(ctx: CanvasRenderingContext2D, wordmark: HTMLImageElement | null, y: number, width = 340): number {
  if (!wordmark) return y + 64;
  const h = (wordmark.height / wordmark.width) * width;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(wordmark, (STORY_WIDTH - width) / 2, y, width, h);
  ctx.restore();
  return y + h;
}

/** Rodapé com a chamada pro site. */
export function drawStoryFooter(ctx: CanvasRenderingContext2D, margin: number): void {
  const footerY = STORY_HEIGHT - 132;
  ctx.strokeStyle = STORY_COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, footerY - 60);
  ctx.lineTo(STORY_WIDTH - margin, footerY - 60);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = STORY_COLORS.ink;
  ctx.font = '700 36px Nunito';
  ctx.fillText(STORY_CTA, STORY_WIDTH / 2, footerY);
  ctx.fillStyle = STORY_COLORS.coral;
  ctx.font = '700 46px Fredoka';
  ctx.fillText(STORY_URL, STORY_WIDTH / 2, footerY + 60);
  ctx.textAlign = 'left';
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar a imagem.'));
    }, 'image/png');
  });
}

/**
 * Abre o menu de compartilhar do celular (Web Share API com arquivo), onde a
 * pessoa escolhe Instagram, TikTok, WhatsApp etc. Onde não há suporte
 * (computador, navegador antigo), baixa a imagem.
 */
export async function shareStoryBlob(blob: Blob, fileName: string, text: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: 'Papazilla', text });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      /* cai pro download se o compartilhamento falhar por outro motivo */
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
