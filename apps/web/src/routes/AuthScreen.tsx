import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import lockup from '../assets/papazilla-lockup.png';
import mailIcon from '../assets/icons/mensagem.png';
import helloIcon from '../assets/icons/perfil.png';
import { setAuthenticated } from '../lib/session.js';

/**
 * Login / criar conta — fiel à tela "Login e conta" de `papazilla-prototype`.
 * Conta obrigatória antes do onboarding, com Google, Apple e e-mail sem senha
 * (magic link / código). Fase 0: fluxo simulado localmente, sem chamada real ao
 * Supabase. Estados: opções → e-mail → código → nome → onboarding.
 */
type AuthMode = 'options' | 'email' | 'code' | 'name';

const APPLE_GLYPH = '';

export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('options');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
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
    navigate('/onboarding', { replace: true });
  }

  function loginWithGoogle() {
    setGoogleBusy(true);
    window.setTimeout(finishAuth, 650);
  }

  return (
    <div className="auth-screen">
      <span className="auth-screen__decoration auth-screen__decoration--one" aria-hidden="true" />
      <span className="auth-screen__decoration auth-screen__decoration--two" aria-hidden="true" />

      <header className="auth-header">
        <span>Conta segura</span>
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
                    <span className="google-mark">G</span>
                    Continuar com Google
                  </>
                )}
              </button>
              <button
                type="button"
                className="social-button social-button--apple"
                onClick={() => setMode('name')}
              >
                <span className="apple-mark">{APPLE_GLYPH}</span>
                Continuar com Apple
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
              onClick={() => setMode('code')}
              disabled={email.trim() === ''}
            >
              Enviar código →
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
              onClick={() => setMode('name')}
              disabled={code.length < 6}
            >
              Confirmar código →
            </button>
            <button
              type="button"
              className="pz-button pz-button--text auth-resend"
              onClick={() => showToast('Um novo código foi enviado.')}
            >
              Reenviar código
            </button>
          </>
        )}

        {mode === 'name' && (
          <>
            <button type="button" className="auth-inline-back" onClick={() => setMode('options')}>
              ← Voltar
            </button>
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
              onClick={finishAuth}
              disabled={name.trim() === ''}
            >
              Conhecer o Zilla →
            </button>
          </>
        )}
      </div>

      <footer className="auth-footer">
        <p>
          Ao continuar, você concorda com nossos{' '}
          <button type="button" onClick={() => showToast('Termos de Uso será aberta aqui.')}>
            Termos de Uso
          </button>{' '}
          e nossa{' '}
          <button
            type="button"
            onClick={() => showToast('Política de Privacidade será aberta aqui.')}
          >
            Política de Privacidade
          </button>
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
