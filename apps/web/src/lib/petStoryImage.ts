/**
 * Imagem de compartilhamento do perfil do pet (story/reels, 1080×1920),
 * oferecida na tela de cadastro concluído (`SucessoScreen`). Mesmo estilo
 * da imagem da receita (`recipeStoryImage.ts`), via Canvas 2D.
 */
import wordmarkUrl from '../assets/papazilla-wordmark.png';
import zillaUrl from '../assets/zilla-frente-transparent.png';
import type { StoredPet } from './petsStore.js';
import {
  STORY_COLORS as C, STORY_HEIGHT, STORY_WIDTH, canvasToBlob, drawDash, drawStoryFooter, drawWordmark,
  ensureFontsReady, loadImage, roundRect, shareStoryBlob, wrapLines,
} from './storyCanvas.js';

const MARGIN = 88;

export type PetStoryData = Pick<StoredPet, 'name' | 'sex' | 'breed' | 'age' | 'lifeStage' | 'senior' | 'weight' | 'goal' | 'appetite' | 'photoPath'>;

const GOAL_LABEL: Record<string, string> = {
  'Manter o peso atual': 'Manter o peso',
  Emagrecer: 'Emagrecer',
  'Ganhar peso': 'Ganhar peso',
  'Melhorar a qualidade da alimentação': 'Comer melhor',
  'Ajudar a preservar músculos e disposição com a idade': 'Envelhecer bem',
  'Apoiar uma condição de saúde': 'Cuidar da saúde',
};

function appetiteLabel(appetite: string, isFemale: boolean): string {
  switch (appetite) {
    case 'Come pouco ou é seletivo': return isFemale ? 'Seletiva' : 'Seletivo';
    case 'Come normalmente': return 'Na medida';
    case 'Gosta bastante de comer': return isFemale ? 'Boa de garfo' : 'Bom de garfo';
    case 'Parece estar sempre com fome':
    case 'Procura ou pede comida o tempo todo': return 'De monstro';
    default: return '—';
  }
}

function ageLabel(age: string): string {
  const n = Number(String(age).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1) {
    const months = Math.max(1, Math.round(n * 12));
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  const text = Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${text} ${n === 1 ? 'ano' : 'anos'}`;
}

export function petStoryFacts(pet: PetStoryData): [string, string][] {
  const isFemale = pet.sex === 'Fêmea';
  const stage = pet.senior === 'Sim' ? 'Sênior' : pet.lifeStage || 'Adulto';
  return [
    ['Raça', pet.breed?.trim() || '—'],
    ['Idade', ageLabel(pet.age)],
    ['Fase de vida', stage],
    ['Peso', pet.weight?.trim() ? `${pet.weight.trim()} kg` : '—'],
    ['Objetivo', GOAL_LABEL[pet.goal] ?? (pet.goal || '—')],
    ['Fome', appetiteLabel(pet.appetite, isFemale)],
  ];
}

/** Desenha a imagem cobrindo o retângulo (object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

export async function generatePetStoryImage(pet: PetStoryData): Promise<Blob> {
  await ensureFontsReady();
  const [wordmark, zilla, photo] = await Promise.all([
    loadImage(wordmarkUrl).catch(() => null),
    loadImage(zillaUrl).catch(() => null),
    pet.photoPath ? loadImage(pet.photoPath, !pet.photoPath.startsWith('data:')).catch(() => null) : Promise.resolve(null),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  ctx.fillStyle = C.creme;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // Confete de fundo
  const confetti: [number, number, number, string][] = [
    [170, 130, 40, C.coral], [910, 150, -30, C.verde], [80, 820, 70, C.pessego], [1000, 760, 20, C.coral],
    [150, 1080, -50, C.verde], [940, 1060, 60, C.mostarda], [60, 540, 10, C.mostarda], [1020, 520, -60, C.pessego],
  ];
  for (const [x, y, a, color] of confetti) drawDash(ctx, x, y, 38, a, color, 9);

  let y = drawWordmark(ctx, wordmark, 96, 300) + 56;

  // Chamada
  const isFemale = pet.sex === 'Fêmea';
  const name = pet.name?.trim() || (isFemale ? 'Minha Monstrinha' : 'Meu Monstrinho');
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'center';
  let headSize = 78;
  ctx.font = `700 ${headSize}px Fredoka`;
  while (headSize > 52 && ctx.measureText(`${name} agora come`).width > STORY_WIDTH - MARGIN * 2) {
    headSize -= 2;
    ctx.font = `700 ${headSize}px Fredoka`;
  }
  const first = wrapLines(ctx, `${name} agora come`, STORY_WIDTH - MARGIN * 2, 1)[0] ?? '';
  ctx.fillText(first, STORY_WIDTH / 2, y + 60);
  ctx.fillText('com o Papazilla', STORY_WIDTH / 2, y + 60 + headSize * 1.1);
  y += 60 + headSize * 1.1 + 56;
  ctx.textAlign = 'left';

  // Foto, levemente inclinada, com moldura branca
  const photoSize = 600;
  const photoX = (STORY_WIDTH - photoSize) / 2;
  const photoY = y;
  ctx.save();
  ctx.translate(STORY_WIDTH / 2, photoY + photoSize / 2);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.shadowColor = 'rgb(74 45 34 / 18%)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -photoSize / 2 - 18, -photoSize / 2 - 18, photoSize + 36, photoSize + 36, 56);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  roundRect(ctx, -photoSize / 2, -photoSize / 2, photoSize, photoSize, 42);
  ctx.save();
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, -photoSize / 2, -photoSize / 2, photoSize, photoSize);
  } else {
    const grad = ctx.createLinearGradient(0, -photoSize / 2, 0, photoSize / 2);
    grad.addColorStop(0, '#fce6db');
    grad.addColorStop(1, C.pessego);
    ctx.fillStyle = grad;
    ctx.fillRect(-photoSize / 2, -photoSize / 2, photoSize, photoSize);
    if (zilla) {
      const zw = photoSize * 0.78;
      const zh = (zilla.height / zilla.width) * zw;
      ctx.drawImage(zilla, -zw / 2, photoSize / 2 - zh + 20, zw, zh);
    }
  }
  ctx.restore();
  ctx.restore();

  // Selo
  ctx.save();
  ctx.translate(photoX + photoSize - 30, photoY + 34);
  ctx.rotate((8 * Math.PI) / 180);
  ctx.fillStyle = C.coral;
  roundRect(ctx, -170, -40, 340, 80, 40);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 46px Caveat';
  ctx.textAlign = 'center';
  ctx.fillText(isFemale ? 'Nova Monstrinha!' : 'Novo Monstrinho!', 0, 15);
  ctx.restore();

  y = photoY + photoSize + 76;

  // Dados principais: 2 colunas × 3 linhas
  const facts = petStoryFacts(pet);
  const cardX = MARGIN;
  const cardW = STORY_WIDTH - MARGIN * 2;
  const pad = 36;
  const gap = 20;
  const tileW = (cardW - pad * 2 - gap) / 2;
  const tileH = 144;
  const cardH = pad * 2 + tileH * 3 + gap * 2;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, y, cardW, cardH, 36);
  ctx.fill();
  ctx.stroke();

  facts.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = cardX + pad + col * (tileW + gap);
    const ty = y + pad + row * (tileH + gap);
    ctx.fillStyle = i % 4 === 0 || i % 4 === 3 ? C.surfaceSoft : C.verdeSoft;
    roundRect(ctx, tx, ty, tileW, tileH, 24);
    ctx.fill();
    ctx.fillStyle = C.inkLabel;
    ctx.font = '800 24px Nunito';
    ctx.fillText(label.toUpperCase(), tx + 28, ty + 44);
    ctx.fillStyle = C.ink;
    let size = 44;
    ctx.font = `600 ${size}px Fredoka`;
    while (size > 36 && ctx.measureText(value).width > tileW - 56) {
      size -= 2;
      ctx.font = `600 ${size}px Fredoka`;
    }
    if (ctx.measureText(value).width <= tileW - 56) {
      ctx.fillText(value, tx + 28, ty + 104);
    } else {
      ctx.font = '600 30px Fredoka';
      wrapLines(ctx, value, tileW - 56, 2).forEach((line, li) => ctx.fillText(line, tx + 28, ty + 86 + li * 34));
    }
  });

  drawStoryFooter(ctx, MARGIN);
  return canvasToBlob(canvas);
}

export async function sharePetStoryImage(pet: PetStoryData): Promise<void> {
  const blob = await generatePetStoryImage(pet);
  const slug = (pet.name || 'pet').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  await shareStoryBlob(blob, `papazilla-${slug}.png`, `${pet.name || 'Meu Monstrinho'} agora come com o Papazilla`);
}
