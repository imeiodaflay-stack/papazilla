/**
 * Ciclo da fornalha (build de teste): planejada → comprando → cozinhando →
 * no estoque → encerrada. Tudo fica SÓ no aparelho (localStorage), por decisão
 * da Flay em 2026-11-04: o único projeto Supabase é o de produção, então o
 * teste não cria tabela nova. A receita em si continua salva como hoje
 * (recipeRepository); a fornalha guarda um retrato do que é preciso para o
 * ciclo (ingredientes, porções, datas, preços, potes), para não depender do
 * cache de receitas.
 */
import type { DailyPlan, Recipe } from '@papazilla/nutrition-engine';
import type { StoredPet } from './petsStore.js';
import { mealsCount } from './recipeDisplay.js';

const FORNALHAS_KEY = 'papazilla.fornalhas';
const SUPPLEMENT_TIMING_KEY = 'papazilla.supplementTiming';
const PAPA_PETS_KEY = 'papazilla.papaSelectedPets';

/** Na geladeira, no máximo 3 dias (decisão de produto). */
export const FRIDGE_DAYS = 3;
/** Antecedência do aviso de "planejar a próxima" (dias antes do fim). */
export const REMINDER_LEAD_DAYS = 3;

export type FornalhaStage = 'shopping' | 'cooking' | 'stocked' | 'done';
export type SupplementTiming = 'serving' | 'cooking';
export type PotMode = 'day' | 'meal';

export interface FornalhaItem {
  id: string;
  label: string;
  group: string;
  groupTitle: string;
  rawGrams?: number;
  cookedGrams?: number;
  checked: boolean;
  /** Valor pago, em reais. */
  price?: number;
  /** Item sem gramas calculadas (suplemento e óleos). */
  pantry?: boolean;
}

export interface FornalhaPet {
  id: string;
  name: string;
  photoPath: string;
  gramsPerDay: number;
  meals: number;
}

export interface FornalhaLoss {
  kind: string;
  grams: number;
}

export interface Fornalha {
  id: string;
  recipeId: string;
  title: string;
  pets: FornalhaPet[];
  days: number;
  totalCookedGrams: number;
  cookedGramsPerDay: number;
  saltGuidance: string;
  supplementName: string;
  items: FornalhaItem[];
  stage: FornalhaStage;
  createdAt: string;
  /** Dia em que cozinhou (AAAA-MM-DD). */
  cookDate?: string;
  cookStartedAt?: string;
  cookStep?: number;
  cookSeconds?: number;
  finalGrams?: number;
  losses: FornalhaLoss[];
  photo?: string;
  /** Preparo já registrado na receita (galeria e histórico). */
  cookLogged?: boolean;
  potMode: PotMode;
  stockedAt?: string;
  /** Último dia com comida (AAAA-MM-DD). */
  endDate?: string;
  /** Potinhos confirmados pela pessoa e quando. */
  confirmedPots?: number;
  confirmedAt?: string;
}

function newId(): string {
  return `fornalha_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function read(): Fornalha[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FORNALHAS_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? (parsed as Fornalha[]) : [];
  } catch {
    return [];
  }
}

function write(list: Fornalha[]): void {
  try {
    localStorage.setItem(FORNALHAS_KEY, JSON.stringify(list));
  } catch {
    /* storage cheio ou indisponível: o estado da tela segue até recarregar */
  }
}

export function listFornalhas(): Fornalha[] {
  return read();
}

export function getFornalha(id: string): Fornalha | undefined {
  return read().find((f) => f.id === id);
}

/** Fornalha em andamento (comprando ou cozinhando). */
export function getInProgress(): Fornalha | undefined {
  return read().find((f) => f.stage === 'shopping' || f.stage === 'cooking');
}

/** Comida em casa agora. */
export function getStock(): Fornalha | undefined {
  return read().find((f) => f.stage === 'stocked');
}

/** Fornalha anterior com preços, para comparar custo. */
export function previousWithCost(excludeId: string): Fornalha | undefined {
  return read().find((f) => f.id !== excludeId && (f.stage === 'stocked' || f.stage === 'done') && costOf(f).priced > 0);
}

export function updateFornalha(id: string, patch: Partial<Fornalha>): Fornalha | undefined {
  const list = read();
  const index = list.findIndex((f) => f.id === id);
  if (index < 0) return undefined;
  const next = { ...list[index]!, ...patch };
  list[index] = next;
  write(list);
  return next;
}

export function discardFornalha(id: string): void {
  write(read().filter((f) => f.id !== id));
}

const GROUP_ORDER = ['proteins', 'organs', 'carbs', 'vegetables'];

export function buildItems(recipe: Recipe): FornalhaItem[] {
  const items: FornalhaItem[] = [];
  for (const key of GROUP_ORDER) {
    const group = recipe.groups.find((g) => g.key === key);
    if (!group) continue;
    for (const row of group.rows) {
      if (row.rawGrams === undefined && row.cookedGrams === undefined) continue;
      items.push({
        id: row.id, label: row.label, group: key, groupTitle: group.title,
        rawGrams: row.rawGrams, cookedGrams: row.cookedGrams, checked: false,
      });
    }
  }
  // Suplemento e óleos ficam fora da lista e do custo: duram várias
  // fornalhas e deixariam a conta por dia distorcida (Flay, 2026-11-04).
  return items;
}

/**
 * Abre uma fornalha a partir de uma receita salva. Se já existe uma em
 * andamento, ela é substituída, mas itens marcados e preços continuam para
 * os ingredientes que ficarem (regra de "Alterar receita").
 */
export function startFornalha(input: {
  recipeId: string;
  title: string;
  recipe: Recipe;
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  allChecked?: boolean;
}): Fornalha {
  const list = read();
  const previous = list.find((f) => f.stage === 'shopping' || f.stage === 'cooking');
  const items = buildItems(input.recipe).map((item) => {
    const kept = previous?.items.find((p) => p.id === item.id);
    return {
      ...item,
      checked: input.allChecked ? true : kept?.checked ?? false,
      price: kept?.price,
    };
  });
  const first = input.petPlans[0]?.plan;
  const fornalha: Fornalha = {
    id: newId(),
    recipeId: input.recipeId,
    title: input.title,
    pets: input.petPlans.map(({ pet, plan }) => ({
      id: pet.id, name: pet.name, photoPath: pet.photoPath,
      gramsPerDay: plan.totalGramsPerDay, meals: mealsCount(plan, pet),
    })),
    days: input.recipe.days,
    totalCookedGrams: input.recipe.totalCookedGrams,
    cookedGramsPerDay: input.recipe.cookedGramsPerDay,
    saltGuidance: first?.saltGuidance ?? '',
    supplementName: first?.supplement.name ?? 'suplemento',
    items,
    stage: 'shopping',
    createdAt: new Date().toISOString(),
    losses: [],
    potMode: 'day',
  };
  write([fornalha, ...list.filter((f) => f.id !== previous?.id)]);
  return fornalha;
}

/** Guarda a comida: vira o estoque atual e encerra o estoque anterior. */
export function stockFornalha(id: string, patch: Partial<Fornalha>): Fornalha | undefined {
  const list = read().map((f) => (f.stage === 'stocked' && f.id !== id ? { ...f, stage: 'done' as const } : f));
  write(list);
  return updateFornalha(id, { ...patch, stage: 'stocked', stockedAt: new Date().toISOString() });
}

// ---- contas ----

export function totalPotsPerDay(f: Pick<Fornalha, 'pets' | 'potMode'>): number {
  return f.pets.reduce((sum, pet) => sum + (f.potMode === 'meal' ? pet.meals : 1), 0);
}

/** Dias de comida que a quantidade pronta rende (porção diária não muda). */
export function daysFromGrams(grams: number, gramsPerDay: number): number {
  if (gramsPerDay <= 0) return 0;
  return Math.max(0, Math.floor(grams / gramsPerDay));
}

export function costOf(f: Pick<Fornalha, 'items'>): { total: number; priced: number; count: number; missing: FornalhaItem[] } {
  const relevant = f.items.filter((item) => !item.pantry || item.price !== undefined);
  const priced = relevant.filter((item) => item.price !== undefined && item.price > 0);
  return {
    total: priced.reduce((sum, item) => sum + (item.price ?? 0), 0),
    priced: priced.length,
    count: relevant.length,
    missing: relevant.filter((item) => !(item.price !== undefined && item.price > 0)),
  };
}

// ---- datas (AAAA-MM-DD, sem fuso) ----

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function diffDays(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const a = Date.UTC(y1!, (m1 ?? 1) - 1, d1 ?? 1);
  const b = Date.UTC(y2!, (m2 ?? 1) - 1, d2 ?? 1);
  return Math.round((b - a) / 86_400_000);
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  return `${WEEKDAYS[date.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseMoney(raw: string): number | undefined {
  const clean = raw.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!clean) return undefined;
  const value = Number(clean);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : undefined;
}

export function formatKg(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
  return `${Math.round(grams).toLocaleString('pt-BR')} g`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatDurationShort(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

// ---- estoque ----

export interface StockStatus {
  endDate: string;
  daysLeft: number;
  /** Dias que a fornalha cobre, do preparo ao fim. */
  totalDays: number;
  /** 0 a 100. */
  percent: number;
  potsLeft: number;
  late: number;
}

export function stockStatus(f: Fornalha, today = todayIso()): StockStatus {
  const endDate = f.endDate ?? today;
  const startDate = f.cookDate ?? today;
  const totalDays = Math.max(1, diffDays(startDate, endDate) + 1);
  const daysLeft = Math.max(0, diffDays(today, endDate) + 1);
  const potsPerDay = totalPotsPerDay(f);
  return {
    endDate,
    daysLeft,
    totalDays,
    percent: Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100))),
    potsLeft: daysLeft * potsPerDay,
    late: Math.max(0, diffDays(endDate, today)),
  };
}

/** Pessoa conferiu os potinhos: a data de fim passa a sair da contagem dela. */
export function confirmPots(f: Fornalha, pots: number): Fornalha | undefined {
  const perDay = Math.max(1, totalPotsPerDay(f));
  const today = todayIso();
  if (pots <= 0) return updateFornalha(f.id, { stage: 'done', confirmedPots: 0, confirmedAt: today, endDate: addDays(today, -1) });
  const days = Math.max(1, Math.ceil(pots / perDay));
  return updateFornalha(f.id, { confirmedPots: pots, confirmedAt: today, endDate: addDays(today, days - 1) });
}

// ---- preferências e seleção ----

export function getSupplementTiming(): SupplementTiming | null {
  try {
    const value = localStorage.getItem(SUPPLEMENT_TIMING_KEY);
    return value === 'serving' || value === 'cooking' ? value : null;
  } catch {
    return null;
  }
}

export function setSupplementTiming(value: SupplementTiming): void {
  try {
    localStorage.setItem(SUPPLEMENT_TIMING_KEY, value);
  } catch {
    /* segue sem persistir */
  }
}

export function getPapaSelectedPets(): string[] | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PAPA_PETS_KEY) ?? 'null') as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : null;
  } catch {
    return null;
  }
}

export function setPapaSelectedPets(ids: string[]): void {
  try {
    sessionStorage.setItem(PAPA_PETS_KEY, JSON.stringify(ids));
  } catch {
    /* segue sem persistir */
  }
}
