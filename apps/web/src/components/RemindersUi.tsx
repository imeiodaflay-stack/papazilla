import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zillaLendo from '../assets/zilla-lendo.webp';
import zillaFrente from '../assets/zilla-frente-transparent.webp';
import zillaChef from '../assets/zilla-chef.webp';
import { getUserProfile } from '../lib/userProfile.js';
import {
  disablePushOnThisDevice, enablePush, iosBrowser, getReminderPrefs, hasPushOnThisDevice, isInAppBrowser, isIos,
  markOfferSeen, needsInstallForPush, pushAvailable, pushPermission, rememberWantsPush, setReminderPrefs,
  wantsPush,
} from '../lib/reminders.js';
import { CloseIcon, Sheet } from './FornalhaUi.js';
import '../fornalha.css';

const ACTIVATE_LATER_KEY = 'papazilla.remindersActivateLater';

function emailLabel(): string {
  return getUserProfile()?.email || 'o seu e-mail';
}

/** Para onde vai quem pediu os avisos no celular. */
type PushRoute = 'enable' | 'install' | 'safari' | 'unavailable';

function pushRoute(): PushRoute {
  if (needsInstallForPush()) return isInAppBrowser() ? 'safari' : 'install';
  return pushAvailable() ? 'enable' : 'unavailable';
}

function deniedMessage(): string {
  return isIos()
    ? 'Os avisos estão bloqueados. Libere em Ajustes › Notificações › Papazilla.'
    : 'Os avisos estão bloqueados neste navegador. Libere nas permissões do site.';
}

const ICONS = {
  calendar: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>,
  bag: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14l-1.5 12h-11z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>,
  jar: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="7" width="14" height="14" rx="3" /><path d="M7 3h10v4H7z" /></svg>,
  share: <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9H6v11h12V9h-2" /><path d="M12 3v12M8.5 6.5L12 3l3.5 3.5" /></svg>,
  add: <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>,
  up: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>,
  down: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>,
};

// ---- I1: oferta, logo depois de montar o estoque ----

export function RemindersOffer({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const route = pushRoute();

  async function wantPush() {
    markOfferSeen();
    if (route === 'install' || route === 'safari') {
      rememberWantsPush(true);
      // A intenção fica na conta: o app da tela de início lê e pede a permissão.
      await setReminderPrefs({ push: true }).catch(() => undefined);
      onClose();
      navigate(route === 'install' ? '/avisos/instalar' : '/avisos/safari');
      return;
    }
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    onClose();
    if (result === 'ok') onToast('Avisos ligados. Eu te lembro antes da comida acabar.');
    else if (result === 'denied') onToast(deniedMessage());
    else onToast('Não deu para ligar os avisos agora. Tente de novo em Conta.');
  }

  async function save(patch: { push?: boolean; email?: boolean }, message: string) {
    markOfferSeen();
    setBusy(true);
    try {
      await setReminderPrefs(patch);
      onToast(message);
    } catch {
      onToast('Não deu para salvar agora. Tente de novo em Conta.');
    }
    setBusy(false);
    onClose();
  }

  const pushPossible = route !== 'unavailable';

  return (
    <Sheet labelledBy="fz-oferta" onClose={() => { markOfferSeen(); onClose(); }}>
      <img src={zillaLendo} alt="" style={{ justifySelf: 'center', width: 120, height: 120, objectFit: 'contain' }} />
      <div className="fz-stack" style={{ gap: '0.4rem', textAlign: 'center' }}>
        <h2 id="fz-oferta" className="fz-h2" style={{ textWrap: 'balance' }}>{pushPossible ? 'Quer os avisos no celular também?' : 'Eu te aviso antes da comida acabar'}</h2>
        <p className="fz-muted">Estoque guardado. Os avisos já vão para <strong style={{ color: 'var(--pz-chocolate)' }}>{emailLabel()}</strong>{pushPossible ? '. No celular, eles chegam na hora.' : '.'}</p>
      </div>
      <ul className="fz-reminder-list">
        <li>{ICONS.calendar}Hora de planejar a próxima fornalha</li>
        <li>{ICONS.bag}Sua lista de compras está esperando</li>
        <li>{ICONS.jar}Passou da data: ainda tem potinho?</li>
      </ul>
      {route === 'install' || route === 'safari' ? (
        <p className="fz-muted" style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600 }}>Para os avisos chegarem no celular, o Papazilla precisa estar na tela de início.</p>
      ) : null}
      <div className="fz-stack" style={{ gap: '0.25rem' }}>
        {pushPossible ? (
          <button type="button" className="pz-button pz-button--primary wide" disabled={busy} onClick={() => { void wantPush(); }}>Quero no celular também</button>
        ) : (
          <button type="button" className="pz-button pz-button--primary wide" disabled={busy} onClick={() => { void save({ email: true }, `Combinado: os avisos vão para ${emailLabel()}.`); }}>Combinado</button>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {pushPossible ? <button type="button" className="fz-link" disabled={busy} onClick={() => { void save({ email: true, push: false }, `Combinado: os avisos vão só para ${emailLabel()}.`); }}>Só por e-mail</button> : null}
          <button type="button" className="fz-link fz-link--muted" disabled={busy} onClick={() => { void save({ email: false, push: false }, 'Tudo bem, sem avisos. Dá para ligar depois em Conta.'); }}>Não quero avisos</button>
        </div>
      </div>
    </Sheet>
  );
}

// ---- I2: guia do iPhone ----

export function InstalarScreen() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const browser = iosBrowser();
  const browserName = { safari: 'Safari', chrome: 'Chrome', firefox: 'Firefox', edge: 'Edge', other: 'navegador' }[browser];
  // Safari: barra de baixo. Chrome, Edge e Firefox no iPhone: ícone no alto, ao lado do endereço.
  const shareOnTop = browser === 'chrome' || browser === 'edge' || browser === 'firefox';
  const shareWhere = browser === 'safari'
    ? 'Na barra do Safari, embaixo. Se não aparecer, toque em ••• primeiro.'
    : shareOnTop
      ? `No ${browserName}, fica no alto, ao lado do endereço. Se não aparecer, toque em ••• primeiro.`
      : 'No menu do navegador, procure o ícone de compartilhar.';
  const steps = [
    { title: 'Toque em Compartilhar', text: shareWhere, icon: <span className="fz-step__icon">{ICONS.share}</span> },
    { title: 'Escolha “Adicionar à Tela de Início”', text: 'Role a lista um pouco para baixo se precisar.', icon: <span className="fz-step__icon">{ICONS.add}</span> },
    { title: 'Toque em Adicionar', text: 'E abra o Papazilla pelo ícone novo.', icon: <span className="fz-step__icon fz-step__icon--app"><img src={zillaFrente} alt="" /></span> },
  ];

  return (
    <div className="fz-full">
      <main className="fz-full__body">
        <button type="button" className="fz-icon-btn" style={{ justifySelf: 'end' }} aria-label="Fechar" onClick={() => navigate('/papa')}><CloseIcon size={18} /></button>
        {done ? (
          <div className="fz-stack" style={{ gap: '0.6rem', textAlign: 'center', paddingTop: '2rem' }}>
            <img src={zillaFrente} alt="" style={{ justifySelf: 'center', width: 132, height: 132, objectFit: 'contain' }} />
            <h1 className="fz-h1" style={{ textWrap: 'balance' }}>Agora abra pelo ícone novo</h1>
            <p className="fz-muted" style={{ fontSize: '1rem' }}>Procure o Papazilla na tela de início. Lá dentro você entra com um código no e-mail e liga os avisos.</p>
          </div>
        ) : (
          <>
            <div className="fz-stack" style={{ gap: '0.4rem' }}>
              <h1 className="fz-h1" style={{ textWrap: 'balance' }}>Coloque o Papazilla na tela de início</h1>
              <p className="fz-muted" style={{ fontSize: '0.95rem' }}>Leva 3 toques. Depois disso, os avisos chegam como os de qualquer app.</p>
            </div>
            <ol className="fz-steps-list">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="fz-step__num" aria-hidden="true">{index + 1}</span>
                  <span className="fz-step__text"><strong>{step.title}</strong><span>{step.text}</span></span>
                  {step.icon}
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
      <footer className="fz-full__foot">
        {done ? (
          <button type="button" className="pz-button pz-button--outline wide" onClick={() => navigate('/papa')}>Voltar ao Papá</button>
        ) : (
          <>
            {browser === 'safari' ? <span className="fz-full__hint">O botão Compartilhar fica na barra do Safari, aqui embaixo {ICONS.down}</span> : null}
            {shareOnTop ? <span className="fz-full__hint">{ICONS.up} O botão Compartilhar fica no alto, ao lado do endereço</span> : null}
            <button type="button" className="pz-button pz-button--primary wide" onClick={() => setDone(true)}>Já adicionei</button>
          </>
        )}
      </footer>
    </div>
  );
}

// ---- I3: navegador de dentro de outro app ----

export function AbrirSafariScreen() {
  const navigate = useNavigate();
  const link = `${window.location.origin}/papa`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function email() {
    await setReminderPrefs({ email: true }).catch(() => undefined);
    navigate('/papa', { state: { toast: `Combinado: os avisos vão para ${emailLabel()}.` } });
  }

  return (
    <div className="fz-full">
      <main className="fz-full__body">
        <button type="button" className="fz-icon-btn" style={{ justifySelf: 'end' }} aria-label="Fechar" onClick={() => navigate('/papa')}><CloseIcon size={18} /></button>
        <img src={zillaLendo} alt="" style={{ justifySelf: 'center', width: 132, height: 132, objectFit: 'contain' }} />
        <div className="fz-stack" style={{ gap: '0.5rem', textAlign: 'center' }}>
          <h1 className="fz-h1" style={{ textWrap: 'balance' }}>Abra no Safari para instalar</h1>
          <p className="fz-muted" style={{ fontSize: '1rem' }}>Você está no navegador de outro app, como o Instagram. Por aqui o iPhone não deixa colocar o Papazilla na tela de início.</p>
        </div>
        <div className="fz-card fz-stack" style={{ gap: '0.6rem' }}>
          <label htmlFor="fz-link" style={{ font: '700 0.875rem/1.2 var(--pz-font-support)' }}>Copie o link e cole no Safari</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input id="fz-link" className="fz-copy-input" type="text" readOnly value={link.replace(/^https?:\/\//, '')} onFocus={(event) => event.currentTarget.select()} />
            <button type="button" className="fz-copy-btn" onClick={() => { void copy(); }}>{copied ? 'Copiado' : 'Copiar'}</button>
          </div>
          <span aria-live="polite" className="fz-muted" style={{ fontSize: '0.8125rem' }}>{copied ? 'Link copiado. Abra o Safari e cole na barra de endereço.' : ''}</span>
        </div>
        <p className="fz-muted" style={{ textAlign: 'center', fontWeight: 600 }}>Ou toque em ••• no canto da tela e escolha <strong style={{ color: 'var(--pz-chocolate)' }}>Abrir no navegador</strong>.</p>
      </main>
      <footer className="fz-full__foot">
        <button type="button" className="pz-button pz-button--outline wide" onClick={() => { void email(); }}>Prefiro receber por e-mail</button>
      </footer>
    </div>
  );
}

// ---- I5: ligar os avisos (app instalado, ou quem escolheu push em outro aparelho) ----

function activateLaterThisSession(): boolean {
  try {
    return sessionStorage.getItem(ACTIVATE_LATER_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mostra a tela de ligar os avisos quando a pessoa escolheu push, este
 * aparelho pode receber e ainda não pediu a permissão. Se a permissão já foi
 * dada (outro login, reinstalação), inscreve sem perguntar.
 */
export function useActivateReminders(): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!wantsPush() || !pushAvailable() || needsInstallForPush()) return;
    const permission = pushPermission();
    if (permission === 'denied') return;
    void hasPushOnThisDevice().then((has) => {
      if (cancelled || has) return;
      if (permission === 'granted') void enablePush();
      else if (!activateLaterThisSession()) setShow(true);
    });
    return () => { cancelled = true; };
  }, []);

  return {
    show,
    dismiss: () => {
      try {
        sessionStorage.setItem(ACTIVATE_LATER_KEY, 'true');
      } catch {
        /* segue sem persistir */
      }
      setShow(false);
    },
  };
}

export function AtivarAvisos({ onDone, onToast }: { onDone: () => void; onToast: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const installed = isIos();

  async function activate() {
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    onDone();
    if (result === 'ok') onToast('Avisos ligados. Eu te lembro antes da comida acabar.');
    else if (result === 'denied') onToast(deniedMessage());
    else onToast('Não deu para ligar os avisos agora. Tente de novo em Conta.');
  }

  return (
    <div className="fz-full fz-full--soft fz-full--overlay" role="dialog" aria-modal="true" aria-labelledby="fz-ativar">
      <main className="fz-full__body" style={{ textAlign: 'center', justifyItems: 'center', paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}>
        <img src={zillaChef} alt="" style={{ width: 180, height: 180, objectFit: 'contain' }} />
        <div className="fz-stack" style={{ gap: '0.6rem' }}>
          <h1 id="fz-ativar" className="fz-h1" style={{ textWrap: 'balance' }}>{installed ? 'Pronto, agora o Papazilla mora na sua tela' : 'Ligue os avisos neste aparelho'}</h1>
          <p className="fz-muted" style={{ fontSize: '1rem' }}>Último passo: deixe os avisos ligados para eu te lembrar antes da comida acabar.</p>
        </div>
        <div className="fz-notif-sample" aria-hidden="true">
          <span><img src={zillaFrente} alt="" /></span>
          <span><strong>Papazilla</strong><span>Faltam 3 dias de comida. Bora planejar a próxima fornalha?</span></span>
        </div>
      </main>
      <footer className="fz-full__foot" style={{ background: 'transparent', borderTop: 0 }}>
        <button type="button" className="pz-button pz-button--primary wide" disabled={busy} onClick={() => { void activate(); }}>{busy ? 'Ligando…' : 'Ativar avisos'}</button>
        <button type="button" className="fz-link fz-link--muted" disabled={busy} onClick={onDone}>Depois</button>
      </footer>
    </div>
  );
}

// ---- Conta: celular e/ou e-mail ----

export function reminderChannelSummary(): string {
  const prefs = getReminderPrefs();
  if (prefs.push && prefs.email) return 'No celular e por e-mail';
  if (prefs.push) return 'No celular';
  if (prefs.email) return `Por e-mail · ${emailLabel()}`;
  return 'Desligados';
}

export function RemindersSettingsSheet({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState(() => getReminderPrefs());
  const route = pushRoute();

  async function togglePush() {
    setBusy(true);
    try {
      if (!prefs.push) {
        if (route === 'install' || route === 'safari') {
          rememberWantsPush(true);
          await setReminderPrefs({ push: true });
          onClose();
          navigate(route === 'install' ? '/avisos/instalar' : '/avisos/safari');
          return;
        }
        const result = await enablePush();
        if (result === 'ok') onToast('Avisos ligados neste celular.');
        else if (result === 'denied') onToast(deniedMessage());
        else onToast('Não deu para ligar os avisos agora.');
      } else {
        await disablePushOnThisDevice();
        await setReminderPrefs({ push: false });
        onToast('Avisos no celular desligados.');
      }
    } catch {
      onToast('Não deu para salvar agora. Tente de novo.');
    } finally {
      setPrefs(getReminderPrefs());
      setBusy(false);
    }
  }

  async function toggleEmail() {
    setBusy(true);
    try {
      await setReminderPrefs({ email: !prefs.email });
      onToast(!prefs.email ? `Os avisos também vão para ${emailLabel()}.` : 'Avisos por e-mail desligados.');
    } catch {
      onToast('Não deu para salvar agora. Tente de novo.');
    } finally {
      setPrefs(getReminderPrefs());
      setBusy(false);
    }
  }

  const rows = [
    {
      key: 'push', title: 'No celular', on: prefs.push, toggle: togglePush, hidden: route === 'unavailable',
      text: route === 'install' && !prefs.push ? 'Precisa colocar o Papazilla na tela de início.' : 'Notificação no celular.',
    },
    { key: 'email', title: 'Por e-mail', on: prefs.email, toggle: toggleEmail, hidden: false, text: emailLabel() },
  ];

  return (
    <Sheet labelledBy="fz-avisos-conta" onClose={onClose}>
      <div className="fz-stack" style={{ gap: '0.3rem' }}>
        <h2 id="fz-avisos-conta" className="fz-h2">Avisos da fornalha</h2>
        <p className="fz-muted">Planejar a próxima, lista de compras esperando e passou da data. Uma vez por dia, de manhã, só quando tiver o que avisar. Pode ligar os dois.</p>
      </div>
      <div className="fz-stack" style={{ gap: '0.5rem' }}>
        {rows.filter((row) => !row.hidden).map((row) => (
          <div key={row.key} className="fz-switch-row">
            <span className="fz-option__body"><strong>{row.title}</strong><small>{row.text}</small></span>
            <button
              type="button"
              role="switch"
              aria-checked={row.on}
              aria-label={`Avisos ${row.title.toLowerCase()}`}
              className={`user-toggle${row.on ? ' is-on' : ''}`}
              disabled={busy}
              onClick={() => { void row.toggle(); }}
            >
              <i aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
