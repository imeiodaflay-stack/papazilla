import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import lockup from '../assets/papazilla-lockup.png';
import { hasSeenOnboarding, initAuth, isAuthenticated } from '../lib/session.js';

/**
 * Splash fiel ao protótipo (`papazilla-prototype`): dois orbs de fundo, lockup e
 * tagline entrando em sequência (splash-rise), loader coral pulsante, e auto-avanço
 * após 1350 ms. Alternativa estática completa para `prefers-reduced-motion`.
 *
 * Fluxo (arquitetura-tecnica.md): Splash → Entrar/criar conta → Onboarding → Papá.
 * `initAuth()` resolve a sessão real do Supabase (quando configurado) antes de
 * decidir o destino, pra um usuário já logado não cair de volta em /entrar.
 */
export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await initAuth();
      if (cancelled) return;
      const dest = !isAuthenticated()
        ? '/entrar'
        : hasSeenOnboarding()
          ? '/zilla'
          : '/onboarding';
      navigate(dest, { replace: true });
    }, 1350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="pz-splash" aria-label="Abertura">
      <span className="pz-splash__orb pz-splash__orb--one" aria-hidden="true" />
      <span className="pz-splash__orb pz-splash__orb--two" aria-hidden="true" />
      <img className="pz-splash__logo" src={lockup} alt="Papazilla" />
      <p className="pz-splash__line">Comida de verdade para cada Monstrinho.</p>
      <span className="pz-splash__loader" aria-hidden="true" />
    </div>
  );
}
