import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasSeenOnboarding, initAuth, setAuthenticated } from '../lib/session.js';
import { loadPetsForOwner } from '../lib/petsStore.js';
import { supabase } from '../lib/supabase.js';

/**
 * Destino do redirect OAuth (Google, e depois Apple) do Supabase. O client já
 * processa o token que vem na URL sozinho (`detectSessionInUrl: true` em
 * `lib/supabase.ts`); esta tela só espera a sessão aparecer e decide pra onde
 * ir — mesma regra que `SplashScreen` usaria com sessão real: onboarding já
 * visto → matilha, senão → onboarding.
 */
export function AuthCallbackScreen() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      navigate('/entrar', { replace: true });
      return;
    }

    function proceed(userId: string | null) {
      if (doneRef.current) return;
      doneRef.current = true;
      if (!userId) {
        setFailed(true);
        return;
      }
      setAuthenticated(true);
      // Espera a matilha carregar do Supabase antes de navegar — sem isso, um
      // usuário com pets em outro aparelho cairia num /zilla vazio até algo
      // (que hoje não existe) forçar uma nova leitura de listPets().
      void loadPetsForOwner(userId).then(() => {
        navigate(hasSeenOnboarding() ? '/zilla' : '/onboarding', { replace: true });
      });
    }

    void initAuth(); // garante que o listener que sincroniza o perfil (session.ts) já está armado
    const { data } = supabase.auth.onAuthStateChange((_event, session) => proceed(session?.user.id ?? null));
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) proceed(session.user.id);
    });
    const timeout = window.setTimeout(() => proceed(null), 8000);

    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="pz-splash" aria-label="Conectando conta">
      <span className="pz-splash__orb pz-splash__orb--one" aria-hidden="true" />
      <span className="pz-splash__orb pz-splash__orb--two" aria-hidden="true" />
      <p className="pz-splash__line">{failed ? 'Não foi possível concluir o login.' : 'Conectando sua conta…'}</p>
      {failed ? (
        <button
          type="button"
          className="pz-button pz-button--primary"
          onClick={() => navigate('/entrar', { replace: true })}
        >
          Voltar para o login
        </button>
      ) : (
        <span className="pz-splash__loader" aria-hidden="true" />
      )}
    </div>
  );
}
