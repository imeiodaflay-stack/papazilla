import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import lockup from '../assets/papazilla-lockup.webp';
import appleIcon from '../assets/icons/apple.svg';
import googleIcon from '../assets/icons/google.svg';
import mailIcon from '../assets/icons/mensagem.png';
import helloIcon from '../assets/icons/perfil.png';
import { initAuth, setAuthenticated } from '../lib/session.js';
import { loadPetsForOwner } from '../lib/petsStore.js';
import { getUserProfile, setUserProfile } from '../lib/userProfile.js';
import { supabase } from '../lib/supabase.js';

/**
 * Login / criar conta — fiel à tela "Login e conta" de `papazilla-prototype`.
 * Conta obrigatória antes do onboarding, com Google, Apple e e-mail sem senha
 * (magic link / código).
 *
 * Google já usa o Supabase de verdade (`signInWithOAuth`) quando o app tem
 * chaves configuradas (`lib/supabase.ts`): o navegador sai pra tela do Google
 * e volta em `/auth/callback`, que decide o destino. Sem chaves (Fase 0 local
 * sem `.env.local`), cai no fluxo simulado antigo pra continuar navegável.
 * Apple usa o mesmo caminho (`signInWithOAuth` com provider 'apple').
 * E-mail usa código de 6 dígitos do Supabase (`signInWithOtp` + `verifyOtp`).
 * O modelo de e-mail "Magic Link" do Supabase precisa conter {{ .Token }}.
 * Antes de enviar o código, `/api/auth-providers` avisa se o e-mail já tem
 * conta criada com Google ou Apple (tela 'existing').
 */
type AuthMode = 'options' | 'email' | 'existing' | 'code' | 'name';
type SocialProvider = 'google' | 'apple';

const PROVIDER_LABEL: Record<SocialProvider, string> = { google: 'Google', apple: 'Apple' };

/**
 * Pergunta ao servidor se o e-mail já tem conta criada com Google ou Apple.
 * Qualquer falha (rede, rodando local sem as Functions) vira lista vazia e o
 * login por código segue normalmente.
 */
async function socialProvidersFor(address: string): Promise<SocialProvider[]> {
  try {
    const res = await fetch('/api/auth-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: address }),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { providers?: unknown };
    const list = Array.isArray(body.providers) ? body.providers : [];
    if (list.includes('email')) return [];
    return list.filter((p): p is SocialProvider => p === 'google' || p === 'apple');
  } catch {
    return [];
  }
}


export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('options');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [existingProviders, setExistingProviders] = useState<SocialProvider[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function showToast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function finishAuth() {
    setAuthenticated(true);
    navigate('/welcome', { replace: true });
  }

  function loginWithGoogle() {
    setGoogleBusy(true);
    if (!supabase) {
      window.setTimeout(finishAuth, 650);
      return;
    }
    supabase.auth
      .signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      .then(({ error }) => {
        if (!error) return; // sucesso: o navegador já está saindo para o Google
        setGoogleBusy(false);
        showToast('Não foi possível conectar com o Google. Tente de novo.');
      });
  }

  /**
   * Sign in with Apple pelo Supabase (fluxo OAuth na web). Exige o provedor
   * Apple ativo no Supabase (Services ID + chave secreta gerada do .p8, que
   * vence a cada 6 meses). A Apple só envia o nome no primeiro login; se vier
   * vazio, o perfil fica sem nome e a pessoa pode preencher em Minha conta.
   */
  function loginWithApple() {
    setAppleBusy(true);
    if (!supabase) {
      window.setTimeout(finishAuth, 650);
      return;
    }
    supabase.auth
      .signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      .then(({ error }) => {
        if (!error) return; // sucesso: o navegador já está saindo para a Apple
        setAppleBusy(false);
        showToast('Não foi possível conectar com a Apple. Tente de novo.');
      });
  }

  /** Envia (ou reenvia) o código de acesso por e-mail. */
  async function sendEmailCode(isResend = false, skipProviderCheck = false) {
    const address = email.trim().toLowerCase();
    if (!supabase) {
      setMode('code');
      return;
    }
    setEmailBusy(true);
    if (!isResend && !skipProviderCheck) {
      const providers = await socialProvidersFor(address);
      if (providers.length > 0) {
        setEmailBusy(false);
        setEmail(address);
        setExistingProviders(providers);
        setMode('existing');
        return;
      }
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setEmailBusy(false);
    if (error) {
      const tooSoon = error.status === 429 || /seconds|rate/i.test(error.message);
      showToast(
        tooSoon
          ? 'Espere um minutinho antes de pedir outro código.'
          : 'Não foi possível enviar o código. Confira o e-mail e tente de novo.',
      );
      return;
    }
    setEmail(address);
    setCode('');
    setMode('code');
    if (isResend) showToast('Enviamos um novo código.');
  }

  /** Confere o código; se a conta ainda não tem nome, pergunta antes de seguir. */
  async function verifyEmailCode() {
    if (!supabase) {
      setMode('name');
      return;
    }
    setEmailBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error || !data.user) {
      setEmailBusy(false);
      showToast('Código inválido ou expirado. Confira ou peça um novo.');
      return;
    }
    await initAuth();
    setAuthenticated(true);
    await loadPetsForOwner(data.user.id);
    setEmailBusy(false);
    const knownName =
      (data.user.user_metadata?.full_name as string | undefined) || getUserProfile()?.name || '';
    if (knownName.trim()) {
      navigate('/welcome', { replace: true });
      return;
    }
    setMode('name');
  }

  /** Guarda o nome da conta criada por e-mail e segue para o splash. */
  async function saveNameAndContinue() {
    const trimmed = name.trim();
    if (supabase) {
      setEmailBusy(true);
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      setEmailBusy(false);
    }
    const current = getUserProfile();
    setUserProfile({ name: trimmed, email: current?.email || email, avatarUrl: current?.avatarUrl });
    finishAuth();
  }

  return (
    <div className="auth-screen">
      <span className="auth-screen__decoration auth-screen__decoration--one" aria-hidden="true" />
      <span className="auth-screen__decoration auth-screen__decoration--two" aria-hidden="true" />

      <header className="auth-header">
        <span><span aria-hidden="true">✓</span> Conta segura</span>
      </header>

      <div className="auth-body">
        {mode === 'options' && (
          <>
            <div className="auth-hero">
              <img className="auth-hero__lockup" src={lockup} alt="Papazilla" />
              <h1>Entre para começar</h1>
              <p>
                Guarde os perfis dos seus Monstrinhos e acesse suas receitas em qualquer aparelho.
              </p>
            </div>
            <div className="auth-actions">
              <button
                type="button"
                className="social-button social-button--google"
                onClick={loginWithGoogle}
                disabled={googleBusy}
              >
                {googleBusy ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    Conectando com Google…
                  </>
                ) : (
                  <>
                    <span className="social-mark" aria-hidden="true"><img src={googleIcon} alt="" width="20" height="20" /></span>
                    Continuar com Google
                  </>
                )}
              </button>
              <button
                type="button"
                className="social-button social-button--apple"
                onClick={loginWithApple}
                disabled={appleBusy}
              >
                {appleBusy ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    Conectando com Apple…
                  </>
                ) : (
                  <>
                    <span className="social-mark" aria-hidden="true"><img src={appleIcon} alt="" width="20" height="20" /></span>
                    Continuar com Apple
                  </>
                )}
              </button>
              <div className="auth-divider">
                <span>ou</span>
              </div>
              <button
                type="button"
                className="social-button social-button--email"
                onClick={() => setMode('email')}
              >
                <span>@</span>
                Continuar com e-mail
              </button>
            </div>
            <p className="auth-reassurance">
              <span>✓</span> Conta gratuita · seus dados ficam protegidos
            </p>
          </>
        )}

        {mode === 'email' && (
          <>
            <button type="button" className="auth-inline-back" onClick={() => setMode('options')}>
              ← Voltar
            </button>
            <div className="auth-step-art">
              <span>@</span>
            </div>
            <div className="auth-step-copy">
              <p className="eyebrow">Entrar com e-mail</p>
              <h1>Qual é o seu e-mail?</h1>
              <p>Vamos enviar um código. Você não precisa criar nem lembrar de senha.</p>
            </div>
            <label className="auth-field">
              <span>Seu e-mail</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="pz-button pz-button--primary wide auth-main-action"
              onClick={() => void sendEmailCode()}
              disabled={emailBusy || !/^\S+@\S+\.\S+$/.test(email.trim())}
            >
              {emailBusy ? 'Enviando…' : 'Enviar código →'}
            </button>
          </>
        )}

        {mode === 'existing' && (
          <>
            <button type="button" className="auth-inline-back" onClick={() => setMode('email')}>
              ← Alterar e-mail
            </button>
            <div className="auth-step-art">
              <span>@</span>
            </div>
            <div className="auth-step-copy">
              <p className="eyebrow">Você já tem conta</p>
              <h1>
                Entre com {existingProviders.map((p) => PROVIDER_LABEL[p]).join(' ou ')}
              </h1>
              <p>
                O e-mail <strong>{email}</strong> já está cadastrado no Papazilla com login pelo{' '}
                {existingProviders.map((p) => PROVIDER_LABEL[p]).join(' ou pela ')}. Entre por lá
                para encontrar seus Monstrinhos e receitas.
              </p>
            </div>
            <div className="auth-actions">
              {existingProviders.includes('google') && (
                <button
                  type="button"
                  className="social-button social-button--google"
                  onClick={loginWithGoogle}
                  disabled={googleBusy}
                >
                  <span className="social-mark" aria-hidden="true"><img src={googleIcon} alt="" width="20" height="20" /></span>
                  {googleBusy ? 'Conectando com Google…' : 'Continuar com Google'}
                </button>
              )}
              {existingProviders.includes('apple') && (
                <button
                  type="button"
                  className="social-button social-button--apple"
                  onClick={loginWithApple}
                  disabled={appleBusy}
                >
                  <span className="social-mark" aria-hidden="true"><img src={appleIcon} alt="" width="20" height="20" /></span>
                  {appleBusy ? 'Conectando com Apple…' : 'Continuar com Apple'}
                </button>
              )}
            </div>
            <button
              type="button"
              className="pz-button pz-button--text auth-resend"
              onClick={() => void sendEmailCode(false, true)}
              disabled={emailBusy}
            >
              {emailBusy ? 'Enviando…' : 'Prefiro receber um código por e-mail'}
            </button>
          </>
        )}

        {mode === 'code' && (
          <>
            <button type="button" className="auth-inline-back" onClick={() => setMode('email')}>
              ← Alterar e-mail
            </button>
            <div className="auth-step-art auth-step-art--mail">
              <img src={mailIcon} alt="" />
            </div>
            <div className="auth-step-copy">
              <p className="eyebrow">Confira sua caixa de entrada</p>
              <h1>Digite o código</h1>
              <p>
                Enviamos seis números para <strong>{email || 'seu e-mail'}</strong>.
              </p>
            </div>
            <label className="auth-field auth-field--code">
              <span>Código de acesso</span>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-describedby="code-hint"
              />
            </label>
            <p className="code-hint" id="code-hint">
              O código expira em 10 minutos.
            </p>
            <button
              type="button"
              className="pz-button pz-button--primary wide auth-main-action"
              onClick={() => void verifyEmailCode()}
              disabled={emailBusy || code.length < 6}
            >
              {emailBusy ? 'Conferindo…' : 'Confirmar código →'}
            </button>
            <button
              type="button"
              className="pz-button pz-button--text auth-resend"
              onClick={() => void sendEmailCode(true)}
              disabled={emailBusy}
            >
              Reenviar código
            </button>
          </>
        )}

        {mode === 'name' && (
          <>
            <div className="auth-step-art auth-step-art--hello">
              <img src={helloIcon} alt="" />
            </div>
            <div className="auth-step-copy">
              <p className="eyebrow">Só mais uma coisinha</p>
              <h1>Como podemos te chamar?</h1>
              <p>Esse nome aparece nas boas-vindas. Você poderá mudar depois.</p>
            </div>
            <label className="auth-field">
              <span>Seu nome</span>
              <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <button
              type="button"
              className="pz-button pz-button--primary wide auth-main-action"
              onClick={() => void saveNameAndContinue()}
              disabled={emailBusy || name.trim() === ''}
            >
              Conhecer o Zilla →
            </button>
          </>
        )}
      </div>

      <footer className="auth-footer">
        <p>
          Ao continuar, você concorda com nossos{' '}
          <a href="/termos" target="_blank" rel="noopener">
            Termos de Uso
          </a>{' '}
          e nossa{' '}
          <a href="/privacidade" target="_blank" rel="noopener">
            Política de Privacidade
          </a>
          .
        </p>
      </footer>

      {toast && (
        <div className="pz-toast is-visible" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
