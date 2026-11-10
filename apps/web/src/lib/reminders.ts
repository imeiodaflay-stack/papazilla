/**
 * Avisos da fornalha (Flay, 2026-11-10): planejar a próxima, lista de
 * compras esperando e "passou da data". O servidor (`api/reminders-cron.ts`)
 * decide quando avisar a partir das fornalhas da conta; aqui o app guarda a
 * escolha da pessoa (`notification_prefs`) e liga o Web Push no aparelho
 * (`push_subscriptions`).
 *
 * No iPhone, o Web Push só existe com o Papazilla na tela de início (iOS
 * 16.4+), e o app instalado não enxerga a sessão do Safari: por isso o fluxo
 * guia a instalação e pede para entrar de novo lá dentro.
 */
import { env, isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';

export type ReminderChannel = 'push' | 'email' | 'none';

const OFFER_KEY = 'papazilla.remindersOffer';
const PENDING_PUSH_KEY = 'papazilla.remindersWantPush';

let ownerId: string | null = null;
let channel: ReminderChannel | null = null;

export async function loadNotificationPrefs(userId: string | null): Promise<void> {
  ownerId = userId;
  channel = null;
  if (!isSupabaseConfigured || !supabase || !userId) return;
  const { data, error } = await supabase.from('notification_prefs').select('channel').eq('owner_id', userId).maybeSingle();
  if (error) {
    console.error('[reminders] Falha ao carregar a preferência de avisos', error);
    return;
  }
  channel = (data?.channel as ReminderChannel | undefined) ?? null;
}

/** `null`: ainda não escolheu. */
export function getReminderChannel(): ReminderChannel | null {
  return channel;
}

export async function setReminderChannel(next: ReminderChannel): Promise<void> {
  channel = next;
  if (next !== 'push') rememberWantsPush(false);
  if (!isSupabaseConfigured || !supabase || !ownerId) return;
  const { error } = await supabase.from('notification_prefs')
    .upsert({ owner_id: ownerId, channel: next, updated_at: new Date().toISOString() });
  if (error) throw new Error('Não foi possível salvar a escolha dos avisos.');
  if (next === 'email') void sendTestReminder();
}

/** Aviso de confirmação (`/api/reminders-test`): prova na hora que o caminho funciona. */
async function sendTestReminder(): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/reminders-test', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    /* o aviso de teste é só uma confirmação */
  }
}

// ---- aparelho ----

function ua(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

export function isIos(): boolean {
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  return /iPhone|iPad|iPod/.test(ua()) || (nav?.platform === 'MacIntel' && (nav?.maxTouchPoints ?? 0) > 1);
}

/** Aberto pelo ícone da tela de início. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** Navegador de dentro de outro app (Instagram, Facebook, TikTok...), onde não dá para instalar. */
export function isInAppBrowser(): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB|musical_ly|BytedanceWebview|LinkedInApp|Line\//i.test(ua());
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Push configurado neste deploy (chave VAPID) e possível neste navegador, já instalado ou não. */
export function pushAvailable(): boolean {
  return Boolean(env.vapidPublicKey) && pushSupported();
}

/** No iPhone, o push só aparece depois de instalar. */
export function needsInstallForPush(): boolean {
  return isIos() && !isStandalone();
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
}

// ---- instalar (Android/desktop: o navegador oferece o próprio botão) ----

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installPrompt: InstallPromptEvent | null = null;

export function canPromptInstall(): boolean {
  return installPrompt !== null;
}

export async function promptInstall(): Promise<boolean> {
  const event = installPrompt;
  if (!event) return false;
  installPrompt = null;
  await event.prompt();
  const choice = await event.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
  return choice.outcome === 'accepted';
}

/** Chamada uma vez no `main.tsx`: registra o service worker e guarda o convite de instalação. */
export function initReminderRuntime(): void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as InstallPromptEvent;
  });
  if (pushSupported()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => console.error('[reminders] Service worker', error));
    });
  }
}

// ---- ligar o push ----

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

export type EnablePushResult = 'ok' | 'denied' | 'unsupported' | 'error';

/** Pede a permissão, inscreve este aparelho e grava a escolha "push". Precisa vir de um toque. */
export async function enablePush(): Promise<EnablePushResult> {
  if (!pushAvailable()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';
    const registration = (await navigator.serviceWorker.getRegistration('/')) ?? (await navigator.serviceWorker.register('/sw.js'));
    await navigator.serviceWorker.ready;
    const subscription = (await registration.pushManager.getSubscription())
      ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBuffer(env.vapidPublicKey) }));
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return 'error';
    if (isSupabaseConfigured && supabase && ownerId) {
      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: json.endpoint,
        owner_id: ownerId,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: ua().slice(0, 500),
      });
      if (error) throw error;
    }
    await setReminderChannel('push');
    rememberWantsPush(false);
    void sendTestReminder();
    return 'ok';
  } catch (error) {
    console.error('[reminders] Falha ao ligar os avisos', error);
    return 'error';
  }
}

/** Desliga o push deste aparelho (a escolha da conta muda em `setReminderChannel`). */
export async function disablePushOnThisDevice(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    if (isSupabaseConfigured && supabase && ownerId) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint).eq('owner_id', ownerId);
    }
    await subscription.unsubscribe();
  } catch (error) {
    console.error('[reminders] Falha ao desligar os avisos', error);
  }
}

// ---- convite (oferta) e intenção guardada no aparelho ----

/** A pessoa já respondeu "Agora não" ou escolheu um canal: não oferecer de novo sozinho. */
export function offerSeen(): boolean {
  try {
    return localStorage.getItem(OFFER_KEY) !== null;
  } catch {
    return true;
  }
}

export function markOfferSeen(): void {
  try {
    localStorage.setItem(OFFER_KEY, new Date().toISOString());
  } catch {
    /* segue sem persistir */
  }
}

/**
 * Quem pediu os avisos no Safari e foi instalar: o app da tela de início tem
 * armazenamento próprio, então a intenção também fica na conta (canal
 * "push" sem aparelho inscrito). Aqui é só o atalho do mesmo navegador.
 */
export function rememberWantsPush(value: boolean): void {
  try {
    if (value) localStorage.setItem(PENDING_PUSH_KEY, 'true');
    else localStorage.removeItem(PENDING_PUSH_KEY);
  } catch {
    /* segue sem persistir */
  }
}

export function wantsPush(): boolean {
  if (channel === 'push') return true;
  try {
    return localStorage.getItem(PENDING_PUSH_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Este aparelho já tem push inscrito e permitido. */
export async function hasPushOnThisDevice(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    return Boolean(await registration?.pushManager.getSubscription());
  } catch {
    return false;
  }
}
