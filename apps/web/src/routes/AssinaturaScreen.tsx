import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import zillaFrente from '../assets/zilla-frente.png';
import { getActivePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';
import { setSubscription, type SubscriptionPayment, type SubscriptionPlan } from '../lib/subscription.js';

/**
 * Oferta de assinatura — fiel à tela "paywall" de `papazilla-prototype`.
 * Aberta a partir de Papá (1ª receita, sem assinatura) ou de Minha conta
 * ("Conhecer planos" / "Gerenciar plano"); `location.state.returnTo` diz
 * pra onde voltar ao fechar ou depois de assinar.
 *
 * Fase 0: sem provedor de pagamento (`arquitetura-tecnica.md` deixa isso em
 * aberto). Assinar só grava o plano localmente, como o protótipo — nenhuma
 * cobrança acontece de verdade.
 */
type ReturnTo = 'papa' | 'conta' | 'recipe';

interface PaywallState {
  returnTo?: ReturnTo;
}

/** Pra onde fechar a oferta sem assinar. "recipe" volta pro Papá (o wizard exige assinatura). */
function closePath(returnTo: ReturnTo | undefined): string {
  if (returnTo === 'conta') return '/conta';
  return '/papa';
}

/** Pra onde ir depois de assinar. Só "recipe" segue direto pro wizard, como no protótipo. */
function subscribedPath(returnTo: ReturnTo | undefined): string {
  if (returnTo === 'recipe') return '/receita';
  return closePath(returnTo);
}

export function AssinaturaScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as PaywallState | null)?.returnTo;
  const backTo = closePath(returnTo);
  const afterSubscribe = subscribedPath(returnTo);

  const activePet = getActivePet();
  const { preposition, displayName } = describePet(activePet);

  const [plan, setPlan] = useState<SubscriptionPlan>('annual');
  const [annualPayment, setAnnualPayment] = useState<Exclude<SubscriptionPayment, 'monthly'>>('upfront');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  function selectAnnualPayment(payment: Exclude<SubscriptionPayment, 'monthly'>) {
    setPlan('annual');
    setAnnualPayment(payment);
  }

  const ctaLabel =
    plan === 'monthly'
      ? 'Assinar por R$ 19,90/mês'
      : annualPayment === 'installments'
        ? 'Assinar em 12 pagamentos'
        : 'Assinar anual por R$ 107,90';

  const disclosure =
    plan === 'monthly'
      ? 'Cobrança recorrente mensal. Cancele quando quiser; depois do cancelamento, não haverá novas cobranças e o acesso continua até o fim do período já pago.'
      : annualPayment === 'installments'
        ? '12 pagamentos de R$ 9,99 · total de R$ 119,88. A renovação inicia um novo período de compromisso.'
        : 'R$ 107,90 cobrados por 12 meses de acesso. Renovação anual automática; cancele a próxima renovação quando quiser.';

  const annualCommitment =
    annualPayment === 'installments'
      ? 'Compromisso de 12 meses. Você pode cancelar a renovação a qualquer momento; os pagamentos do período contratado continuam até o final.'
      : 'Pagamento anual antecipado. A assinatura renova por mais 12 meses até você cancelar a renovação.';

  function subscribe() {
    setSubscription({ plan, payment: plan === 'annual' ? annualPayment : 'monthly' });
    toast(plan === 'annual' ? 'Plano anual ativado. Boa fornalha!' : 'Plano mensal ativado. Boa fornalha!');
    window.setTimeout(() => navigate(afterSubscribe, { replace: true }), 900);
  }

  return (
    <div className="paywall-view">
      <header className="paywall-header">
        <button type="button" className="flow-header__back" aria-label="Voltar" onClick={() => navigate(backTo)}>
          ←
        </button>
        <span>Assinatura Papazilla</span>
        <button
          type="button"
          className="paywall-restore"
          onClick={() => toast('Nenhuma compra anterior foi encontrada nesta demonstração.')}
        >
          Restaurar
        </button>
      </header>

      <div className="paywall-content">
        <div className="paywall-hero">
          <span className="paywall-hero__art">
            <img src={zillaFrente} alt="Zilla pronto para cozinhar" />
          </span>
          <div>
            <p className="eyebrow">
              {activePet ? `A fornalha ${preposition} ${displayName} começa aqui` : 'Sua próxima fornalha começa aqui'}
            </p>
            <h1>Receitas na medida para o seu Monstrinho</h1>
            <p>Da escolha dos ingredientes à porção no potinho, o Papazilla calcula tudo para vocês.</p>
          </div>
        </div>

        <ul className="paywall-benefits" aria-label="Benefícios da assinatura">
          <li>
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Quantidades personalizadas</strong>
              <small>Peso, rotina e objetivo entram no cálculo.</small>
            </p>
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Receita pronta para cozinhar</strong>
              <small>Ingredientes, suplemento, finalização e preparo.</small>
            </p>
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Toda a matilha organizada</strong>
              <small>Receitas salvas e histórico de fornalhas.</small>
            </p>
          </li>
        </ul>

        <div className="paywall-plans" role="radiogroup" aria-label="Escolha um plano">
          <section className={`paywall-plan${plan === 'annual' ? ' is-selected' : ''}`}>
            <button
              type="button"
              className="paywall-plan__select"
              role="radio"
              aria-checked={plan === 'annual'}
              onClick={() => setPlan('annual')}
            >
              <span className="paywall-radio" aria-hidden="true" />
              <span>
                <small>Melhor escolha</small>
                <strong>Papazilla Anual</strong>
                <em>Economize até 55% comparado ao mensal</em>
              </span>
              <b>
                A partir de
                <br />
                <strong>R$ 8,99/mês</strong>
              </b>
            </button>
            <div className="annual-payment-options" role="radiogroup" aria-label="Forma de pagamento anual">
              <button
                type="button"
                className={`annual-payment-option${annualPayment === 'upfront' ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={annualPayment === 'upfront'}
                onClick={() => selectAnnualPayment('upfront')}
              >
                <span aria-hidden="true" />
                <p>
                  <strong>R$ 107,90 à vista</strong>
                  <small>Pagamento antecipado por 12 meses · 10% a menos</small>
                </p>
              </button>
              <button
                type="button"
                className={`annual-payment-option${annualPayment === 'installments' ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={annualPayment === 'installments'}
                onClick={() => selectAnnualPayment('installments')}
              >
                <span aria-hidden="true" />
                <p>
                  <strong>12 pagamentos de R$ 9,99</strong>
                  <small>Total de R$ 119,88</small>
                </p>
              </button>
            </div>
            <p className="annual-commitment">{annualCommitment}</p>
          </section>

          <button
            type="button"
            className={`paywall-plan paywall-plan--monthly${plan === 'monthly' ? ' is-selected' : ''}`}
            role="radio"
            aria-checked={plan === 'monthly'}
            onClick={() => setPlan('monthly')}
          >
            <span className="paywall-radio" aria-hidden="true" />
            <span>
              <strong>Papazilla Mensal</strong>
              <em>Flexibilidade para cancelar quando quiser</em>
            </span>
            <b>
              <strong>R$ 19,90</strong>
              <br />
              por mês
            </b>
          </button>
        </div>

        <button type="button" className="pz-button pz-button--primary wide paywall-cta" onClick={subscribe}>
          {ctaLabel}
        </button>
        <p className="paywall-disclosure">{disclosure}</p>
        <div className="paywall-links">
          <button type="button" onClick={() => toast('Termos de Uso será aberta aqui.')}>
            Termos de Uso
          </button>
          <span>·</span>
          <button type="button" onClick={() => toast('Política de Privacidade será aberta aqui.')}>
            Privacidade
          </button>
        </div>
      </div>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
