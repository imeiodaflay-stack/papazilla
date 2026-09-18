/**
 * Gera a imagem de compartilhamento da receita (formato story/TikTok,
 * 1080×1920) via Canvas 2D — sem depender de renderizar e rasterizar DOM
 * (mais previsível: sem CORS de fonte, sem layout escondido pra medir).
 * Usada pelo botão "Compartilhar" no resultado do wizard (`RecipeResultCard`).
 */
import type { DailyPlan, FormulationId, Recipe } from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import wordmarkUrl from '../assets/papazilla-wordmark.png';
import mascotUrl from '../assets/papazilla-lockup.png';
import bowlIconUrl from '../assets/icons/potinho.png';
import calendarIconUrl from '../assets/icons/calendario.png';
import { joinPt } from './petLabel.js';
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
      document.fonts.load('700 44px Caveat'),
    ]);
    await document.fonts.ready;
  } catch {
    /* segue com a fonte de sistema se o carregamento falhar */
  }
}

/** Traço curto e arredondado — os "riscos" decorativos do mockup de referência. */
function drawDash(ctx: CanvasRenderingContext2D, cx: number, cy: number, len: number, angleDeg: number, color: string): void {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = (Math.cos(rad) * len) / 2;
  const dy = (Math.sin(rad) * len) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.stroke();
  ctx.restore();
}

/** Sublinhado ondulado curto, tipo rabisco, sob "prontos". */
function drawSquiggle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string): void {
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Quebra `text` em até `maxLines` linhas que cabem em `maxWidth` (a última leva "…" se sobrar
 * texto); desenha e devolve o y final. */
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

  const truncated = lines.length > maxLines;
  const shown = lines.slice(0, maxLines);
  if (truncated) {
    let last = shown[shown.length - 1]!;
    while (last.length > 0 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1).trimEnd();
    }
    shown[shown.length - 1] = `${last}…`;
  }

  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + shown.length * lineHeight;
}

export interface RecipeStoryData {
  recipe: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  formulation: FormulationId;
  format: string;
}

export async function generateRecipeStoryImage({ recipe, petPlans, formulation, format }: RecipeStoryData): Promise<Blob> {
  await ensureFontsReady();
  const [wordmark, mascot, bowlIcon, calendarIcon] = await Promise.all([
    loadImage(wordmarkUrl).catch(() => null),
    loadImage(mascotUrl).catch(() => null),
    loadImage(bowlIconUrl).catch(() => null),
    loadImage(calendarIconUrl).catch(() => null),
  ]);

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
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(wordmark, (WIDTH - w) / 2, y, w, h);
    ctx.restore();
    y += h + 64;
  } else {
    y += 64;
  }

  // Total da receita — cartão hero em gradiente, com a Zilla e o potinho
  const heroH = 460;
  const heroGrad = ctx.createLinearGradient(MARGIN, y, WIDTH - MARGIN, y + heroH);
  heroGrad.addColorStop(0, '#fce6db');
  heroGrad.addColorStop(1, PESSEGO);
  ctx.fillStyle = heroGrad;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, heroH, 36);
  ctx.fill();

  drawDash(ctx, WIDTH - MARGIN - 78, y + 46, 34, 60, CORAL);
  drawDash(ctx, WIDTH - MARGIN - 44, y + 62, 34, 60, CORAL);

  const petNames = petPlans.map(({ pet }) => pet.name);
  const fornalhaLabel = petNames.length <= 3
    ? `A fornalha de ${joinPt(petNames)}`
    : `A fornalha de ${petNames[0]} + ${petNames.length - 1} monstrinhos`;
  ctx.fillStyle = INK_MUTED;
  ctx.font = '800 28px Nunito';
  ctx.fillText(fornalhaLabel, MARGIN + 56, y + 45, 500);

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

  drawSquiggle(ctx, MARGIN + 56, y + 288, 280, CORAL);

  ctx.fillStyle = INK;
  ctx.font = '700 43px Caveat';
  drawWrappedText(ctx, 'Comida boa faz histórias felizes! ♥', MARGIN + 56, y + 348, 410, 42, 2);

  if (mascot) {
    // A imagem de marca inclui a Zilla com o potinho na metade superior; o
    // recorte mantém a ilustração original sem puxar o wordmark de baixo.
    ctx.drawImage(mascot, 65, 0, 510, 420, WIDTH - MARGIN - 395, y + 95, 395, 330);
  }

  y += heroH + 48;

  // Proporção escolhida
  const presetH = 190;
  ctx.fillStyle = SURFACE_SOFT;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, presetH, 28);
  ctx.fill();

  const presetIconR = 44;
  const presetIconCx = MARGIN + 40 + presetIconR;
  const presetIconCy = y + presetH / 2;
  ctx.fillStyle = PESSEGO;
  ctx.beginPath();
  ctx.arc(presetIconCx, presetIconCy, presetIconR, 0, Math.PI * 2);
  ctx.fill();
  if (bowlIcon) {
    const iconW = 48;
    const iconH = (bowlIcon.height / bowlIcon.width) * iconW;
    ctx.drawImage(bowlIcon, presetIconCx - iconW / 2, presetIconCy - iconH / 2, iconW, iconH);
  }

  const presetTextX = MARGIN + 40 + presetIconR * 2 + 32;
  ctx.fillStyle = INK_LABEL;
  ctx.font = '700 30px Nunito';
  ctx.fillText('Proporção escolhida', presetTextX, y + 62);

  ctx.fillStyle = INK;
  ctx.font = '800 40px Nunito';
  ctx.fillText(FORMULATION_LABELS[formulation], presetTextX, y + 108);

  ctx.fillStyle = INK_MUTED;
  ctx.font = '400 25px Nunito';
  drawWrappedText(ctx, formulationSummary(formulation), presetTextX, y + 145, WIDTH - MARGIN - 44 - presetTextX, 30, 2);

  y += presetH + 48;

  // Reserva de espaço pro rodapé (divisória + duas linhas de texto) e pro bloco de
  // estatísticas, calculado ANTES de decidir quantas linhas de ingrediente cabem —
  // assim a tabela nunca cresce por cima de nada, mesmo com muitos ingredientes ou
  // muitos pets (formato story é fixo, não dá pra crescer o canvas).
  const FOOTER_RESERVED = 250;
  const contentBottom = HEIGHT - FOOTER_RESERVED;
  const GAP = 48;

  // O que pesar
  const rows = recipe.groups.filter((g) => g.key !== 'herbs').flatMap((g) => g.rows.map((row) => ({ ...row, groupKey: g.key })));
  const rowH = 76;
  const tableHeightFor = (n: number, hasExtra: boolean) => 92 + n * rowH + (hasExtra ? 56 : 0) + 24;
  const MIN_TABLE_ROWS = Math.min(2, rows.length);
  const minTableH = rows.length > 0 ? tableHeightFor(MIN_TABLE_ROWS, MIN_TABLE_ROWS < rows.length) : 0;

  // Quantos pets cabem no bloco de estatísticas, reservando ANTES o mínimo pra
  // tabela de ingredientes — assim uma receita com muitos pets nunca empurra o
  // rodapé pra fora do canvas (que tem altura fixa, formato story).
  const petRowH = 96;
  const statHeightFor = (n: number, hasExtra: boolean) => (petPlans.length === 1 ? 220 : 60 + n * petRowH + (hasExtra ? 56 : 0));
  const statBudget = contentBottom - y - GAP - minTableH - GAP;
  let petsShown = petPlans.length === 1 ? 1 : Math.min(5, petPlans.length);
  while (petsShown > 1 && statHeightFor(petsShown, petsShown < petPlans.length) > statBudget) {
    petsShown -= 1;
  }
  const visiblePetPlans = petPlans.slice(0, petsShown);
  const extraPetsCount = petPlans.length - visiblePetPlans.length;
  const statH = statHeightFor(visiblePetPlans.length, extraPetsCount > 0);

  const tableBudget = contentBottom - y - GAP - statH;
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
  ctx.fillStyle = INK_LABEL;
  ctx.font = '700 25px Nunito';
  ctx.textAlign = 'right';
  ctx.fillText(format === 'Quantidade dos alimentos crus' ? 'peso cru' : 'peso pronto', WIDTH - MARGIN - 44, y + 68);
  ctx.textAlign = 'left';

  let rowY = y + 92;
  ctx.font = '700 32px Nunito';
  for (const row of visibleRows) {
    rowY += rowH;
    ctx.fillStyle = '#fff8f4';
    roundRect(ctx, MARGIN + 30, rowY - rowH + 4, CONTENT_WIDTH - 60, rowH - 5, 16);
    ctx.fill();
    ctx.fillStyle = row.groupKey === 'proteins' ? CORAL : row.groupKey === 'vegetables' ? '#adb047' : row.groupKey === 'carbs' ? '#d3a038' : INK;
    roundRect(ctx, MARGIN + 30, rowY - rowH + 4, 8, rowH - 5, 4);
    ctx.fill();

    ctx.fillStyle = INK;
    ctx.font = '700 32px Nunito';
    ctx.textAlign = 'left';
    const label = row.label.length > 30 ? `${row.label.slice(0, 29)}…` : row.label;
    ctx.fillText(label, MARGIN + 44, rowY - 12);

    const weight = format === 'Quantidade dos alimentos crus' ? row.rawGrams : row.cookedGrams;
    const amountTxt = weight !== undefined ? `≈ ${formatGrams(weight)}` : row.note ?? '—';
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

  // Por dia / Por refeição — dois cartões lado a lado, cada um com seu selo de ícone
  if (petPlans.length === 1) {
    const { pet, plan } = petPlans[0]!;
    const cardGap = 28;
    const cardW = (CONTENT_WIDTH - cardGap) / 2;
    const stats: [string, string, HTMLImageElement | null][] = [
      ['Por dia', formatGrams(plan.totalGramsPerDay), calendarIcon],
      ['Por refeição', formatGrams(mealSize(plan, pet)), bowlIcon],
    ];
    stats.forEach(([label, value, icon], i) => {
      const cardX = MARGIN + i * (cardW + cardGap);
      ctx.fillStyle = '#eaf0d4';
      roundRect(ctx, cardX, y, cardW, statH, 26);
      ctx.fill();

      const cx = cardX + cardW / 2;
      const badgeR = 40;
      const badgeCy = y + 66;
      ctx.fillStyle = 'rgb(255 255 255 / 62%)';
      ctx.beginPath();
      ctx.arc(cx, badgeCy, badgeR, 0, Math.PI * 2);
      ctx.fill();
      if (icon) {
        const iconW = 42;
        const iconH = (icon.height / icon.width) * iconW;
        ctx.drawImage(icon, cx - iconW / 2, badgeCy - iconH / 2, iconW, iconH);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#4c5a16';
      ctx.font = '700 28px Nunito';
      ctx.fillText(label, cx, y + 134);
      ctx.font = '800 56px Fredoka';
      ctx.fillText(value, cx, y + 196);
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
  const needsClinicalReview = petPlans.some(({ plan }) => plan.clinicalReviewRequired);
  ctx.fillText(needsClinicalReview ? 'Revisão veterinária recomendada.' : 'Receita feita no Papazilla.', WIDTH / 2, footerY);
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
