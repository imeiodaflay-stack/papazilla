/**
 * Gera a imagem de compartilhamento da receita (formato story/TikTok,
 * 1080×1920) via Canvas 2D — sem depender de renderizar e rasterizar DOM
 * (mais previsível: sem CORS de fonte, sem layout escondido pra medir).
 * Usada pelo botão "Compartilhar" no resultado do wizard (`RecipeResultCard`).
 */
import type { DailyPlan, FormulationId, Recipe } from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import wordmarkUrl from '../assets/papazilla-wordmark.png';
import { FORMULATION_LABELS, formatGrams, formulationSummary, mealSize } from './recipeDisplay.js';

const WIDTH = 1080;
const HEIGHT = 1920;
const MARGIN = 88;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;

const INK = '#4a2d22';
const INK_MUTED = '#7a5c50';
const INK_LABEL = '#8a6a5e';
const CREME = '#fff8f3';
const SURFACE_SOFT = '#fcede4';
const CORAL = '#f98b69';
const PESSEGO = '#f7bda3';
const BORDER = 'rgb(74 45 34 / 14%)';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    img.src = src;
  });
}

async function ensureFontsReady(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('800 64px Fredoka'),
      document.fonts.load('600 44px Fredoka'),
      document.fonts.load('800 40px Nunito'),
      document.fonts.load('700 34px Nunito'),
      document.fonts.load('400 32px Nunito'),
    ]);
    await document.fonts.ready;
  } catch {
    /* segue com a fonte de sistema se o carregamento falhar */
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Quebra `text` em linhas que cabem em `maxWidth`; desenha e devolve o y final. */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Infinity,
): number {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  let cursorY = y;
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i]!;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = words[i]!;
      cursorY += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) {
        const rest = words.slice(i).join(' ');
        ctx.fillText(rest.length > 0 ? `${line} ${rest}`.trim() : line, x, cursorY);
        return cursorY + lineHeight;
      }
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

export interface RecipeStoryData {
  recipe: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  formulation: FormulationId;
}

export async function generateRecipeStoryImage({ recipe, petPlans, formulation }: RecipeStoryData): Promise<Blob> {
  await ensureFontsReady();
  const wordmark = await loadImage(wordmarkUrl).catch(() => null);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  // Fundo
  ctx.fillStyle = CREME;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  let y = 112;

  // Wordmark
  if (wordmark) {
    const w = 360;
    const h = (wordmark.height / wordmark.width) * w;
    ctx.drawImage(wordmark, (WIDTH - w) / 2, y, w, h);
    y += h + 64;
  } else {
    y += 64;
  }

  // Total da receita — cartão hero em gradiente
  const heroH = 300;
  const heroGrad = ctx.createLinearGradient(MARGIN, y, WIDTH - MARGIN, y + heroH);
  heroGrad.addColorStop(0, '#fce6db');
  heroGrad.addColorStop(1, PESSEGO);
  ctx.fillStyle = heroGrad;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, heroH, 36);
  ctx.fill();

  ctx.fillStyle = INK_MUTED;
  ctx.font = '700 32px Nunito';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Total da receita', MARGIN + 56, y + 92);

  ctx.fillStyle = INK;
  ctx.font = '800 108px Fredoka';
  ctx.fillText(formatGrams(recipe.totalCookedGrams), MARGIN + 56, y + 210);

  ctx.fillStyle = INK_MUTED;
  ctx.font = '700 32px Nunito';
  ctx.fillText('prontos', MARGIN + 56, y + 258);

  y += heroH + 48;

  // Proporção escolhida
  const presetH = 176;
  ctx.fillStyle = SURFACE_SOFT;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, presetH, 28);
  ctx.fill();

  ctx.fillStyle = INK_LABEL;
  ctx.font = '700 30px Nunito';
  ctx.fillText('Proporção escolhida', MARGIN + 44, y + 62);

  ctx.fillStyle = INK;
  ctx.font = '800 40px Nunito';
  ctx.fillText(FORMULATION_LABELS[formulation], MARGIN + 44, y + 108);

  ctx.fillStyle = INK_MUTED;
  ctx.font = '400 28px Nunito';
  drawWrappedText(ctx, formulationSummary(formulation), MARGIN + 44, y + 148, CONTENT_WIDTH - 88, 36, 1);

  y += presetH + 48;

  // Reserva de espaço pro rodapé (divisória + duas linhas de texto) e pro bloco de
  // estatísticas, calculado ANTES de decidir quantas linhas de ingrediente cabem —
  // assim a tabela nunca cresce por cima de nada, mesmo com muitos ingredientes ou
  // muitos pets (formato story é fixo, não dá pra crescer o canvas).
  const FOOTER_RESERVED = 250;
  const contentBottom = HEIGHT - FOOTER_RESERVED;
  const GAP = 48;

  const MAX_PETS_SHOWN = 5;
  const visiblePetPlans = petPlans.slice(0, MAX_PETS_SHOWN);
  const extraPetsCount = petPlans.length - visiblePetPlans.length;
  const petRowH = 96;
  const statH =
    petPlans.length === 1
      ? 220
      : 60 + visiblePetPlans.length * petRowH + (extraPetsCount > 0 ? 56 : 0);

  // O que pesar
  const rows = recipe.groups.filter((g) => g.key !== 'herbs').flatMap((g) => g.rows);
  const rowH = 76;
  const tableBudget = contentBottom - y - GAP - statH;
  const tableHeightFor = (n: number, hasExtra: boolean) => 92 + n * rowH + (hasExtra ? 56 : 0) + 24;
  let visibleCount = rows.length;
  while (visibleCount > 0 && tableHeightFor(visibleCount, visibleCount < rows.length) > tableBudget) {
    visibleCount -= 1;
  }
  if (rows.length > 0) visibleCount = Math.max(visibleCount, 1);
  const visibleRows = rows.slice(0, visibleCount);
  const extraCount = rows.length - visibleRows.length;
  const tableH = tableHeightFor(visibleRows.length, extraCount > 0);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, tableH, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = '800 40px Nunito';
  ctx.fillText('O que pesar', MARGIN + 44, y + 68);

  let rowY = y + 92;
  ctx.font = '700 32px Nunito';
  for (const row of visibleRows) {
    rowY += rowH;
    ctx.strokeStyle = BORDER;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 44, rowY - rowH + 20);
    ctx.lineTo(WIDTH - MARGIN - 44, rowY - rowH + 20);
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = '700 32px Nunito';
    ctx.textAlign = 'left';
    const label = row.label.length > 30 ? `${row.label.slice(0, 29)}…` : row.label;
    ctx.fillText(label, MARGIN + 44, rowY - 12);

    const amountTxt =
      row.cookedGrams !== undefined
        ? `≈ ${formatGrams(row.cookedGrams)}`
        : row.rawGrams !== undefined
          ? `≈ ${formatGrams(row.rawGrams)}`
          : row.note ?? '—';
    ctx.fillStyle = INK;
    ctx.font = '800 32px Nunito';
    ctx.textAlign = 'right';
    ctx.fillText(amountTxt, WIDTH - MARGIN - 44, rowY - 12);
    ctx.textAlign = 'left';
  }
  if (extraCount > 0) {
    rowY += 56;
    ctx.fillStyle = INK_LABEL;
    ctx.font = '700 28px Nunito';
    ctx.fillText(`+ ${extraCount} ${extraCount === 1 ? 'ingrediente' : 'ingredientes'}`, MARGIN + 44, rowY - 12);
  }

  y += tableH + 48;

  // Por dia / Por refeição
  if (petPlans.length === 1) {
    const { pet, plan } = petPlans[0]!;
    ctx.fillStyle = '#eaf0d4';
    roundRect(ctx, MARGIN, y, CONTENT_WIDTH, statH, 28);
    ctx.fill();

    const colW = CONTENT_WIDTH / 2;
    const stats: [string, string][] = [
      ['Por dia', formatGrams(plan.totalGramsPerDay)],
      ['Por refeição', formatGrams(mealSize(plan, pet))],
    ];
    stats.forEach(([label, value], i) => {
      const cx = MARGIN + colW * i + colW / 2;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4c5a16';
      ctx.font = '700 30px Nunito';
      ctx.fillText(label, cx, y + 92);
      ctx.font = '800 64px Fredoka';
      ctx.fillText(value, cx, y + 168);
      ctx.textAlign = 'left';
    });
  } else {
    ctx.fillStyle = '#eaf0d4';
    roundRect(ctx, MARGIN, y, CONTENT_WIDTH, statH, 28);
    ctx.fill();
    let py = y + 30;
    for (const { pet, plan } of visiblePetPlans) {
      py += petRowH;
      ctx.fillStyle = '#4c5a16';
      ctx.font = '800 36px Nunito';
      ctx.textAlign = 'left';
      ctx.fillText(pet.name, MARGIN + 44, py - 40);
      ctx.font = '700 30px Nunito';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${formatGrams(plan.totalGramsPerDay)}/dia · ${formatGrams(mealSize(plan, pet))}/ref.`,
        WIDTH - MARGIN - 44,
        py - 40,
      );
      ctx.textAlign = 'left';
    }
    if (extraPetsCount > 0) {
      py += 56;
      ctx.fillStyle = '#4c5a16';
      ctx.font = '700 28px Nunito';
      ctx.textAlign = 'left';
      ctx.fillText(`+ ${extraPetsCount} ${extraPetsCount === 1 ? 'monstrinho' : 'monstrinhos'}`, MARGIN + 44, py - 12);
    }
  }
  y += statH + GAP;

  // Rodapé — branding
  const footerY = HEIGHT - 140;
  ctx.strokeStyle = BORDER;
  ctx.beginPath();
  ctx.moveTo(MARGIN, footerY - 56);
  ctx.lineTo(WIDTH - MARGIN, footerY - 56);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = '700 34px Nunito';
  ctx.fillText('Receita feita no Papazilla.', WIDTH / 2, footerY);
  ctx.fillStyle = CORAL;
  ctx.font = '800 34px Nunito';
  ctx.fillText('Baixe o app → papazilla.app', WIDTH / 2, footerY + 52);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar a imagem.'));
    }, 'image/png');
  });
}

/** Baixa ou compartilha (Web Share API com arquivo, quando suportado) a imagem gerada. */
export async function shareRecipeStoryImage(data: RecipeStoryData): Promise<void> {
  const blob = await generateRecipeStoryImage(data);
  const file = new File([blob], 'papazilla-receita.png', { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: 'Papazilla', text: 'Receita feita no Papazilla' });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      /* cai pro download se o compartilhamento falhar por outro motivo */
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'papazilla-receita.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
