/**
 * Gera a imagem de compartilhamento da receita (formato story/reels,
 * 1080×1920) via Canvas 2D, sem depender de renderizar e rasterizar DOM
 * (mais previsível: sem CORS de fonte, sem layout escondido pra medir).
 * Usada pelo botão "Compartilhar imagem para stories" no resultado do wizard
 * (`RecipeResultCard`) e nas Originals.
 *
 * Conteúdo (Flay, 2026-09-30): fornalha de quem, título, total pronto,
 * gráfico de pizza com a proporção da receita (não é macro nutricional: o
 * motor não tem composição de nutrientes), ingredientes, porções e a chamada
 * pro site.
 */
import type { DailyPlan, FormulationId, Recipe } from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import wordmarkUrl from '../assets/papazilla-wordmark.png';
import mascotUrl from '../assets/papazilla-lockup.png';
import bowlIconUrl from '../assets/icons/potinho.png';
import calendarIconUrl from '../assets/icons/calendario.png';
import { describePet, joinPt } from './petLabel.js';
import { FORMULATION_LABELS, formatGrams, mealSize } from './recipeDisplay.js';
import {
  STORY_COLORS as C, STORY_HEIGHT as HEIGHT, STORY_WIDTH as WIDTH, canvasToBlob, drawDash, drawSquiggle,
  drawStoryFooter, drawWordmark, ensureFontsReady, loadImage, roundRect, shareStoryBlob, wrapLines,
} from './storyCanvas.js';

const MARGIN = 88;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const INK = C.ink;
const INK_MUTED = C.inkMuted;
const INK_LABEL = C.inkLabel;
const CREME = C.creme;
const CORAL = C.coral;
const PESSEGO = C.pessego;
const BORDER = C.border;

export interface RecipeStoryData {
  recipe: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  formulation: FormulationId;
  format: string;
  /** Título da receita (ex.: "Frango com arroz", "Básico Brasileiro"). */
  title?: string;
}

const PIE_GROUPS: { key: string; label: string; color: string }[] = [
  { key: 'proteins', label: 'Carnes', color: C.coral },
  { key: 'organs', label: 'Vísceras', color: '#9b4f3a' },
  { key: 'carbs', label: 'Carboidratos', color: C.mostarda },
  { key: 'vegetables', label: 'Vegetais', color: C.verde },
];

/** Fatias do gráfico: peso pronto de cada grupo da receita. */
export function recipeProportion(recipe: Recipe): { label: string; color: string; share: number }[] {
  const totals = PIE_GROUPS.map((g) => ({
    ...g,
    grams: (recipe.groups.find((group) => group.key === g.key)?.rows ?? [])
      .reduce((sum, row) => sum + (row.cookedGrams ?? row.rawGrams ?? 0), 0),
  })).filter((g) => g.grams > 0);
  const total = totals.reduce((sum, g) => sum + g.grams, 0) || 1;
  return totals.map((g) => ({ label: g.label, color: g.color, share: g.grams / total }));
}

function fornalhaLabel(petPlans: RecipeStoryData['petPlans']): string {
  const pets = petPlans.map(({ pet }) => pet);
  if (pets.length === 1) {
    const { preposition, displayName } = describePet(pets[0]);
    return `Fornalha ${preposition} ${displayName}`;
  }
  if (pets.length <= 3) return `Fornalha de ${joinPt(pets.map((p) => p.name))}`;
  return 'Fornalha da matilha';
}

export async function generateRecipeStoryImage({ recipe, petPlans, formulation, format, title }: RecipeStoryData): Promise<Blob> {
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

  let y = drawWordmark(ctx, wordmark, 84, 300) + 44;

  // Cartão principal: fornalha de quem, título e total pronto, com a Zilla
  const heroH = 404;
  const heroGrad = ctx.createLinearGradient(MARGIN, y, WIDTH - MARGIN, y + heroH);
  heroGrad.addColorStop(0, '#fce6db');
  heroGrad.addColorStop(1, PESSEGO);
  ctx.fillStyle = heroGrad;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, heroH, 36);
  ctx.fill();

  drawDash(ctx, WIDTH - MARGIN - 78, y + 46, 34, 60, CORAL);
  drawDash(ctx, WIDTH - MARGIN - 44, y + 62, 34, 60, CORAL);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = CORAL;
  ctx.font = '800 30px Nunito';
  ctx.fillText(fornalhaLabel(petPlans).toUpperCase(), MARGIN + 52, y + 64, 560);

  ctx.fillStyle = INK;
  ctx.font = '600 52px Fredoka';
  const titleLines = wrapLines(ctx, title?.trim() || 'Receita da semana', 470, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, MARGIN + 52, y + 128 + i * 58));

  ctx.fillStyle = INK;
  ctx.font = '700 104px Fredoka';
  ctx.fillText(formatGrams(recipe.totalCookedGrams), MARGIN + 52, y + 312);
  ctx.fillStyle = INK_MUTED;
  ctx.font = '700 32px Nunito';
  ctx.fillText(`prontos · ${recipe.days} ${recipe.days === 1 ? 'dia' : 'dias'}`, MARGIN + 52, y + 360);
  drawSquiggle(ctx, MARGIN + 52, y + 386, 240, CORAL);

  if (mascot) {
    // A imagem de marca inclui a Zilla com o potinho na metade superior; o
    // recorte mantém a ilustração original sem puxar o wordmark de baixo.
    ctx.drawImage(mascot, 65, 0, 510, 420, WIDTH - MARGIN - 370, y + 100, 370, 305);
  }

  y += heroH + 36;

  // Proporção da receita: pizza + legenda
  const slices = recipeProportion(recipe);
  const pieH = 296;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, MARGIN, y, CONTENT_WIDTH, pieH, 28);
  ctx.fill();
  ctx.stroke();

  const pieR = 108;
  const pieCx = MARGIN + 48 + pieR;
  const pieCy = y + pieH / 2;
  let angle = -Math.PI / 2;
  for (const slice of slices) {
    const next = angle + slice.share * Math.PI * 2;
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.moveTo(pieCx, pieCy);
    ctx.arc(pieCx, pieCy, pieR, angle, next);
    ctx.closePath();
    ctx.fill();
    if (slices.length > 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    angle = next;
  }

  const legendX = pieCx + pieR + 64;
  ctx.fillStyle = INK;
  ctx.font = '800 36px Nunito';
  ctx.fillText('Proporção da receita', legendX, y + 64);
  ctx.fillStyle = INK_LABEL;
  ctx.font = '700 26px Nunito';
  ctx.fillText(FORMULATION_LABELS[formulation], legendX, y + 100);
  const legendTop = y + 100 + Math.max(0, (pieH - 130 - slices.length * 42) / 2);
  slices.forEach((slice, i) => {
    const ly = legendTop + 50 + i * 42;
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.arc(legendX + 12, ly - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '700 30px Nunito';
    ctx.fillText(slice.label, legendX + 38, ly);
    ctx.font = '800 30px Nunito';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(slice.share * 100)}%`, WIDTH - MARGIN - 44, ly);
    ctx.textAlign = 'left';
  });

  y += pieH + 36;

  // Reserva de espaço pro rodapé (divisória + duas linhas de texto) e pro bloco de
  // estatísticas, calculado ANTES de decidir quantas linhas de ingrediente cabem —
  // assim a tabela nunca cresce por cima de nada, mesmo com muitos ingredientes ou
  // muitos pets (formato story é fixo, não dá pra crescer o canvas).
  const FOOTER_RESERVED = 230;
  const contentBottom = HEIGHT - FOOTER_RESERVED;
  const GAP = 40;

  // O que pesar
  const rows = recipe.groups.filter((g) => g.key !== 'herbs').flatMap((g) => g.rows.map((row) => ({ ...row, groupKey: g.key })));
  const rowH = 58;
  const tableHeightFor = (n: number, hasExtra: boolean) => 92 + n * rowH + (hasExtra ? 56 : 0) + 24;
  const MIN_TABLE_ROWS = Math.min(2, rows.length);
  const minTableH = rows.length > 0 ? tableHeightFor(MIN_TABLE_ROWS, MIN_TABLE_ROWS < rows.length) : 0;

  // Quantos pets cabem no bloco de estatísticas, reservando ANTES o mínimo pra
  // tabela de ingredientes — assim uma receita com muitos pets nunca empurra o
  // rodapé pra fora do canvas (que tem altura fixa, formato story).
  const petRowH = 96;
  const statHeightFor = (n: number, hasExtra: boolean) => (petPlans.length === 1 ? 196 : 60 + n * petRowH + (hasExtra ? 56 : 0));
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
    ctx.font = '700 30px Nunito';
    ctx.textAlign = 'left';
    const label = row.label.length > 30 ? `${row.label.slice(0, 29)}…` : row.label;
    ctx.fillText(label, MARGIN + 44, rowY - 16);

    const weight = format === 'Quantidade dos alimentos crus' ? row.rawGrams : row.cookedGrams;
    const amountTxt = weight !== undefined ? `≈ ${formatGrams(weight)}` : row.note ?? '—';
    ctx.fillStyle = INK;
    ctx.font = '800 30px Nunito';
    ctx.textAlign = 'right';
    ctx.fillText(amountTxt, WIDTH - MARGIN - 44, rowY - 16);
    ctx.textAlign = 'left';
  }
  if (extraCount > 0) {
    rowY += 56;
    ctx.fillStyle = INK_LABEL;
    ctx.font = '700 28px Nunito';
    ctx.fillText(`+ ${extraCount} ${extraCount === 1 ? 'ingrediente' : 'ingredientes'}`, MARGIN + 44, rowY - 12);
  }

  y += tableH + GAP;

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
      const badgeR = 32;
      const badgeCy = y + 50;
      ctx.fillStyle = 'rgb(255 255 255 / 62%)';
      ctx.beginPath();
      ctx.arc(cx, badgeCy, badgeR, 0, Math.PI * 2);
      ctx.fill();
      if (icon) {
        const iconW = 36;
        const iconH = (icon.height / icon.width) * iconW;
        ctx.drawImage(icon, cx - iconW / 2, badgeCy - iconH / 2, iconW, iconH);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#4c5a16';
      ctx.font = '700 28px Nunito';
      ctx.fillText(label, cx, y + 116);
      ctx.font = '700 50px Fredoka';
      ctx.fillText(value, cx, y + 172);
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

  drawStoryFooter(ctx, MARGIN);
  return canvasToBlob(canvas);
}

export async function shareRecipeStoryImage(data: RecipeStoryData): Promise<void> {
  const blob = await generateRecipeStoryImage(data);
  await shareStoryBlob(blob, 'papazilla-receita.png', 'Receita feita no Papazilla');
}
