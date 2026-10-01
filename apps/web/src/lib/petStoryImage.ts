/** Story compartilhável do perfil do pet, 1080 × 1920, renderizado no app. */
import wordmarkUrl from '../assets/papazilla-wordmark.png';
import zillaUrl from '../assets/zilla-frente-transparent.png';
import type { StoredPet } from './petsStore.js';
import {
  STORY_COLORS as C, STORY_HEIGHT, STORY_WIDTH, canvasToBlob, drawPaw, drawSpikes, drawStoryFooter,
  drawWordmark, ensureFontsReady, loadImage, roundRect, shareStoryBlob, wrapLines,
} from './storyCanvas.js';

const MARGIN = 72;
export type PetStoryData = Pick<StoredPet, 'name' | 'sex' | 'breed' | 'age' | 'lifeStage' | 'senior' | 'weight' | 'goal' | 'appetite' | 'photoPath'>;

const GOAL_LABEL: Record<string, string> = {
  'Manter o peso atual': 'Manter o peso', Emagrecer: 'Emagrecer', 'Ganhar peso': 'Ganhar peso',
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
    ['Raça', pet.breed?.trim() || 'Sem raça definida'], ['Idade', ageLabel(pet.age)], ['Fase', stage],
    ['Peso', pet.weight?.trim() ? `${pet.weight.trim()} kg` : '—'],
    ['Objetivo', GOAL_LABEL[pet.goal] ?? (pet.goal || '—')], ['Fome', appetiteLabel(pet.appetite, isFemale)],
  ];
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function drawLabel(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, w: number, color: string): void {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, 116, 26);
  ctx.fill();
  ctx.fillStyle = C.inkLabel;
  ctx.font = '800 22px Nunito, "Avenir Next", sans-serif';
  ctx.fillText(label.toUpperCase(), x + 26, y + 38);
  ctx.fillStyle = C.ink;
  let size = 40;
  ctx.font = `600 ${size}px Fredoka, "Arial Rounded MT Bold", "Avenir Next", sans-serif`;
  while (size > 29 && ctx.measureText(value).width > w - 52) {
    size -= 2;
    ctx.font = `600 ${size}px Fredoka, "Arial Rounded MT Bold", "Avenir Next", sans-serif`;
  }
  ctx.fillText(value, x + 26, y + 88);
}

export async function generatePetStoryImage(pet: PetStoryData): Promise<Blob> {
  await ensureFontsReady();
  const [wordmark, zilla, photo] = await Promise.all([
    loadImage(wordmarkUrl).catch(() => null), loadImage(zillaUrl).catch(() => null),
    pet.photoPath ? loadImage(pet.photoPath, !pet.photoPath.startsWith('data:')).catch(() => null) : Promise.resolve(null),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  ctx.fillStyle = C.creme;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  ctx.fillStyle = C.surfaceSoft;
  ctx.beginPath();
  ctx.arc(-30, 680, 260, 0, Math.PI * 2);
  ctx.fill();
  drawSpikes(ctx, 782, 214, 4, 82, C.verdeSoft);
  drawWordmark(ctx, wordmark, 68, 248);

  const isFemale = pet.sex === 'Fêmea';
  const name = pet.name?.trim() || (isFemale ? 'Minha Monstrinha' : 'Meu Monstrinho');
  ctx.textAlign = 'center';
  ctx.fillStyle = C.coral;
  ctx.font = '800 25px Nunito, "Avenir Next", sans-serif';
  ctx.fillText(isFemale ? 'NOVA MONSTRINHA NA MATILHA' : 'NOVO MONSTRINHO NA MATILHA', STORY_WIDTH / 2, 225);
  ctx.fillStyle = C.ink;
  ctx.font = '700 72px Fredoka, "Arial Rounded MT Bold", "Avenir Next", sans-serif';
  const headlineLines = wrapLines(ctx, `${name} chegou com fome de monstro`, 860, 2);
  headlineLines.forEach((line, i) => ctx.fillText(line, STORY_WIDTH / 2, 304 + i * 76));
  ctx.textAlign = 'left';

  const heroX = MARGIN;
  const heroY = headlineLines.length > 1 ? 420 : 350;
  const heroW = STORY_WIDTH - MARGIN * 2;
  const heroH = 690;
  ctx.save();
  ctx.shadowColor = 'rgb(74 45 34 / 16%)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, heroX, heroY, heroW, heroH, 52);
  ctx.fill();
  ctx.restore();

  const inset = 18;
  const imageX = heroX + inset;
  const imageY = heroY + inset;
  const imageW = heroW - inset * 2;
  const imageH = heroH - inset * 2;
  ctx.save();
  roundRect(ctx, imageX, imageY, imageW, imageH, 40);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, imageX, imageY, imageW, imageH);
    const shade = ctx.createLinearGradient(0, imageY + imageH * 0.52, 0, imageY + imageH);
    shade.addColorStop(0, 'rgb(74 45 34 / 0%)');
    shade.addColorStop(1, 'rgb(74 45 34 / 78%)');
    ctx.fillStyle = shade;
    ctx.fillRect(imageX, imageY, imageW, imageH);
  } else {
    const grad = ctx.createLinearGradient(imageX, imageY, imageX + imageW, imageY + imageH);
    grad.addColorStop(0, '#fce6db');
    grad.addColorStop(1, C.pessego);
    ctx.fillStyle = grad;
    ctx.fillRect(imageX, imageY, imageW, imageH);
    ctx.fillStyle = 'rgb(255 248 243 / 48%)';
    ctx.font = '700 470px Fredoka, "Arial Rounded MT Bold", "Avenir Next", sans-serif';
    ctx.fillText(name.charAt(0).toUpperCase(), imageX + 60, imageY + 510);
    if (zilla) {
      const zh = 570;
      const zw = (zilla.width / zilla.height) * zh;
      ctx.drawImage(zilla, imageX + imageW - zw - 36, imageY + imageH - zh + 30, zw, zh);
    }
  }
  ctx.restore();

  ctx.fillStyle = photo ? '#ffffff' : C.ink;
  ctx.font = `700 ${photo ? 86 : 76}px Fredoka, "Arial Rounded MT Bold", "Avenir Next", sans-serif`;
  ctx.fillText(name, imageX + 48, imageY + imageH - 54);
  ctx.save();
  ctx.translate(heroX + heroW - 172, heroY + 38);
  ctx.rotate((6 * Math.PI) / 180);
  ctx.fillStyle = C.coral;
  roundRect(ctx, -184, -42, 368, 84, 42);
  ctx.fill();
  drawPaw(ctx, -140, 2, 42, '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px Caveat, "Marker Felt", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('Parte da matilha', 30, 12);
  ctx.restore();

  const facts = petStoryFacts(pet);
  const panelY = heroY + heroH + 42;
  const panelH = 428;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  roundRect(ctx, MARGIN, panelY, heroW, panelH, 38);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.inkLabel;
  ctx.font = '700 27px Nunito, "Avenir Next", sans-serif';
  ctx.textAlign = 'center';
  const identity = `${facts[0]![1]} · ${facts[2]![1]}`;
  ctx.fillText(identity.length > 52 ? `${identity.slice(0, 51)}…` : identity, STORY_WIDTH / 2, panelY + 54);
  ctx.textAlign = 'left';
  const innerX = MARGIN + 30;
  const gap = 18;
  const halfW = (heroW - 60 - gap) / 2;
  drawLabel(ctx, 'Idade', facts[1]![1], innerX, panelY + 78, halfW, C.verdeSoft);
  drawLabel(ctx, 'Peso', facts[3]![1], innerX + halfW + gap, panelY + 78, halfW, C.surfaceSoft);
  drawLabel(ctx, 'Objetivo', facts[4]![1], innerX, panelY + 212, halfW, C.surfaceSoft);
  drawLabel(ctx, 'Fome', facts[5]![1], innerX + halfW + gap, panelY + 212, halfW, C.verdeSoft);
  ctx.fillStyle = C.inkMuted;
  ctx.font = '700 27px Nunito, "Avenir Next", sans-serif';
  ctx.textAlign = 'center';
  const profileLine = isFemale ? 'Um perfil só dela. Uma medida feita para ela.' : 'Um perfil só dele. Uma medida feita para ele.';
  ctx.fillText(photo ? profileLine : 'O retrato pode vir depois. A fome já chegou.', STORY_WIDTH / 2, panelY + 382);
  ctx.textAlign = 'left';

  drawStoryFooter(ctx, MARGIN);
  return canvasToBlob(canvas);
}

export async function sharePetStoryImage(pet: PetStoryData): Promise<void> {
  const blob = await generatePetStoryImage(pet);
  const slug = (pet.name || 'pet').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  await shareStoryBlob(blob, `papazilla-${slug}.png`, `${pet.name || 'Meu Monstrinho'} agora come com o Papazilla`);
}
