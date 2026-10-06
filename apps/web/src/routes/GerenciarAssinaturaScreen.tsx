import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import patinhaIcon from '../assets/icons/patinha.png';
import { cancelSubscription, formatRenewalDate, getSubscription, hasActiveAccess, subscriptionPriceLabel } from '../lib/subscription.js';

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  canceled: 'Cancelado',
  past_due: 'Pagamento pendente',
};

/**
 * Gerenciar assinatura — fiel à tela "subscription" de `papazilla-prototype`,
 * agora com dados e ações de verdade: "Cancelar renovação" chama o
 * processador (`/api/subscription-cancel`), não só um toast. Pix não exibe
 * cancelamento porque a renovação é manual.
 */
export function GerenciarAssinaturaScreen() {
  const navigate = useNavigate();
  const subscription = getSubscription();
  const [canceling, setCanceling] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  if (!subscription || !hasActiveAccess(subscription)) {
    return <Navigate to="/assinatura" state={{ returnTo: 'conta' }} replace />;
  }

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 3200);
  }

  const isCanceled = subscription.status === 'canceled';
  const isPix = subscription.paymentMethod === 'pix';
  const renews = !isPix && !isCanceled && subscription.autoRenew;
  const daysLeft = subscription.currentPeriodEnd
    ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000)
    : 0;
  const canRenew = !renews && daysLeft <= 30;
  const renewalCopy = isPix
    ? 'Ao final do período, você escolhe se quer renovar com um novo Pix.'
    : isCanceled
    ? 'A renovação foi cancelada. Seu acesso continua até a data acima, sem novas cobranças depois disso.'
    : renews
    ? 'A próxima cobrança anual acontece automaticamente no cartão, na data acima.'
    : 'Não há renovação automática. Ao final do período, você escolhe se quer renovar.';

  async function handleCancel() {
    setCanceling(true);
    try {
      await cancelSubscription();
      toast('Renovação cancelada. Seu acesso continua até o fim do período já pago.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível cancelar agora. Tente de novo.');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="user-profile-view">
      <header className="user-profile-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para Minha conta"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <div>
          <p className="eyebrow">Seu plano</p>
          <h1>Assinatura</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <div className="user-profile-content">
        <section className="subscription-status-card">
          <div className="subscription-status-card__heading">
            <span>
              <img src={patinhaIcon} alt="" />
            </span>
            <div>
              <small>Plano atual</small>
              <h2>Papazilla Anual</h2>
            </div>
            <b>{STATUS_LABEL[subscription.status] ?? subscription.status}</b>
          </div>
          <p>Receitas personalizadas para toda a matilha, salvas e disponíveis em qualquer aparelho.</p>
          <div className="subscription-price">
            <span>
              <small>Forma de pagamento</small>
              <strong>{subscriptionPriceLabel(subscription)}</strong>
            </span>
            <span>
              <small>{renews ? 'Próxima renovação' : 'Acesso até'}</small>
              <strong>{formatRenewalDate(subscription)}</strong>
            </span>
          </div>
        </section>

        <section className="subscription-details">
          <h2>Sobre sua assinatura</h2>
          <div>
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Acesso liberado</strong>
              <small>Continue criando e salvando receitas até o fim do período contratado.</small>
            </p>
          </div>
          <div>
            <span aria-hidden="true">↻</span>
            <p>
              <strong>{renews ? 'Renovação automática' : isCanceled ? 'Renovação cancelada' : 'Renovação manual'}</strong>
              <small>{renewalCopy}</small>
            </p>
          </div>
        </section>

        {canRenew ? (
          <button
            type="button"
            className="pz-button pz-button--primary wide"
            onClick={() => navigate('/assinatura', { state: { returnTo: 'conta' } })}
          >
            Renovar por mais 12 meses
          </button>
        ) : null}
        {renews ? (
          <button type="button" className="subscription-cancel" onClick={handleCancel} disabled={canceling}>
            {canceling ? 'Cancelando…' : 'Cancelar renovação'}
          </button>
        ) : null}
        <p className="subscription-help">
          {renews
            ? 'O cancelamento evita a próxima renovação. Seu acesso continua até o fim do período já pago.'
            : 'Nenhum plano renova sozinho. Nos últimos 30 dias do período, aparece aqui o botão para renovar; os 12 meses novos começam quando os atuais terminam.'}
        </p>
      </div>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
