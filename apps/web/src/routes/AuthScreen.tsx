import { Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/env.js';

/**
 * Conta obrigatória antes do onboarding. Provedores: Google, Apple e e-mail sem senha
 * (magic link / OTP). Na Fase 0 os botões são stubs — sem chamada real ao Supabase.
 */
export function AuthScreen() {
  return (
    <div className="pz-app">
      <main className="pz-app__main pz-screen">
        <h1>Entrar ou criar conta</h1>
        <p>Sua conta guarda seus cães, a anamnese e as receitas.</p>

        <div className="pz-card pz-screen">
          <button type="button" className="pz-btn pz-btn--ghost" disabled>
            Continuar com Google
          </button>
          <button type="button" className="pz-btn pz-btn--ghost" disabled>
            Continuar com Apple
          </button>
          <button type="button" className="pz-btn pz-btn--ghost" disabled>
            Continuar com e-mail
          </button>
          <p className="pz-note">
            {isSupabaseConfigured
              ? 'Supabase configurado. Falta ligar os fluxos de OAuth / magic link.'
              : 'Modo desconectado (Fase 0): sem chaves do Supabase no .env.local.'}
          </p>
        </div>

        <Link to="/onboarding" className="pz-btn">
          Avançar (stub)
        </Link>
        <p className="pz-note">
          Placeholder de navegação até a autenticação real. Termos e política de privacidade entram aqui.
        </p>
      </main>
    </div>
  );
}
