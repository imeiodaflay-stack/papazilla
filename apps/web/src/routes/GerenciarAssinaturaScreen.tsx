import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import patinhaIcon from '../assets/icons/patinha.png';
import {
  ANNUAL_PRICE,
  formatBRL,
  formatRenewalDate,
  getSubscription,
  INSTALLMENT_PRICE,
  INSTALLMENTS_COUNT,
} from '../lib/subscription.js';

const PLAN_NAME = { annual: 'Papazilla Anual' } as const;
const PLAN_PAYMENT = {
  upfront: `${formatBRL(ANNUAL_PRICE)} à vista`,
  installments: `Em até ${INSTALLMENTS_COUNT}x de ${formatBRL(INSTALLMENT_PRICE)}`,
} as const;

/**
 * Gerenciar assinatura — fiel à tela "subscription" de `papazilla-prototype`.
 * Só acessível com uma assinatura ativa (sem ela, redireciona pra oferta).
 * "Ver outras formas de pagamento" reabre a oferta; restaurar/cancelar ainda
 * avisam por toast (Fase 0, sem provedor de pagamento real).
 */
export function GerenciarAssinaturaScreen() {
  const navigate = useNavigate();
  const subscription = getSubscription();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  if (!subscription) {
    return <Navigate to="/assinatura" state={{ returnTo: 'conta' }} replace />;
  }

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const isInstallments = subscription.payment === 'installments';
  const renewalCopy = isInstallments
    ? `Depois dos ${INSTALLMENTS_COUNT} pagamentos, a assinatura inicia um novo período até você cancelar a renovação.`
    : 'A próxima cobrança anual acontece na data indicada acima.';

  return (
    <div className="user-profile-view">
      <header className="user-profile-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para Minha conta"
          onClick={() => navigate('/conta')}
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
              <h2>{PLAN_NAME[subscription.plan]}</h2>
            </div>
            <b>Ativo</b>
          </div>
          <p>Receitas personalizadas para toda a matilha, salvas e disponíveis em qualquer aparelho.</p>
          <div className="subscription-price">
            <span>
              <small>Forma de pagamento</small>
              <strong>{PLAN_PAYMENT[subscription.payment]}</strong>
            </span>
            <span>
              <small>Próxima renovação</small>
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
              <strong>Renovação automática</strong>
              <small>{renewalCopy}</small>
            </p>
          </div>
        </section>

        <button
          type="button"
          className="subscription-action"
          onClick={() => navigate('/assinatura', { state: { returnTo: 'conta' } })}
        >
          Ver outras formas de pagamento <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="subscription-action"
          onClick={() => toast('Sua compra está ativa neste aparelho.')}
        >
          Restaurar compra <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="subscription-cancel"
          onClick={() => toast('A confirmação de cancelamento será exibida antes de concluir.')}
        >
          Cancelar renovação
        </button>
        <p className="subscription-help">
          O cancelamento evita a próxima renovação. Seu acesso e eventuais pagamentos do período
          contratado continuam até o final.
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
