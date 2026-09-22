import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import { getSubscription, hasActiveAccess, loadSubscriptionForOwner } from '../lib/subscription.js';
import { getUserId, initAuth } from '../lib/session.js';

/**
 * Espera a confirmação server-side do pagamento pelo webhook. A resposta da
 * criação da cobrança nunca libera o acesso sozinha, então esta tela
 * reconsulta a assinatura antes de seguir.
 */
const POLL_INTERVAL_MS = 1500;
const SLOW_POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 12;

function destinationFor(returnTo: string | null): string {
  if (returnTo === 'recipe') return '/receita';
  if (returnTo === 'conta') return '/conta';
  return '/papa';
}

export function ConfirmandoAssinaturaScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [timedOut, setTimedOut] = useState(false);
  const attempts = useRef(0);
  const timer = useRef<number>();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      // Esta rota pode montar antes de a sessão persistida do Supabase ser
      // restaurada. Sem esperar por ela, getUserId() retorna null e a tela
      // continuaria consultando uma assinatura vazia mesmo após o webhook.
      await initAuth();
      await loadSubscriptionForOwner(getUserId());
      if (cancelled) return;
      if (hasActiveAccess(getSubscription())) {
        navigate(destinationFor(returnTo), { replace: true });
        return;
      }
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) {
        setTimedOut(true);
      }
      timer.current = window.setTimeout(poll, attempts.current >= MAX_ATTEMPTS ? SLOW_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
    };
  }, [navigate, returnTo]);

  return (
    <div className="success-view">
      <div className="success-view__content">
        <div className="pet-portrait">
          <img src={zillaIcon} alt="" />
        </div>
        {timedOut ? (
          <>
            <h1 className="pz-h1">Ainda confirmando o pagamento</h1>
            <p>
              Pode levar mais alguns minutos pra o banco confirmar. Vamos continuar verificando e seguir
              automaticamente assim que a assinatura for liberada.
            </p>
          </>
        ) : (
          <>
            <h1 className="pz-h1">Confirmando seu pagamento…</h1>
            <p>Só um instante, já estamos confirmando o seu pagamento.</p>
          </>
        )}
      </div>
      <div className="success-view__actions">
        <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/papa', { replace: true })}>
          Ir para o Papá
        </button>
      </div>
    </div>
  );
}
