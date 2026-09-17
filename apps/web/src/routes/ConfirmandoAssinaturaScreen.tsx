import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import { getSubscription, hasActiveAccess, loadSubscriptionForOwner } from '../lib/subscription.js';
import { getUserId } from '../lib/session.js';

/**
 * Pra onde o Asaas redireciona depois do pagamento (`successUrl`). O
 * pagamento em si só é confirmado quando o webhook (`/api/webhooks-asaas`)
 * processar — geralmente questão de segundos, mas não é instantâneo — então
 * essa tela reconsulta a assinatura algumas vezes antes de seguir em frente,
 * em vez de confiar cegamente no redirecionamento (que só significa "a
 * pessoa terminou o checkout", não "o pagamento foi confirmado").
 */
const POLL_INTERVAL_MS = 1500;
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

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      await loadSubscriptionForOwner(getUserId());
      if (cancelled) return;
      if (hasActiveAccess(getSubscription())) {
        navigate(destinationFor(returnTo), { replace: true });
        return;
      }
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      window.setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
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
              Pode levar mais alguns minutos pra o banco confirmar. Assim que confirmar, sua assinatura libera
              sozinha — você já pode continuar usando o app enquanto isso.
            </p>
          </>
        ) : (
          <>
            <h1 className="pz-h1">Confirmando seu pagamento…</h1>
            <p>Só um instante, já estamos verificando com o Asaas.</p>
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
