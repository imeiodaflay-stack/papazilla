import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import zillaFrente from '../assets/zilla-frente.png';
import { getActivePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';
import {
  ANNUAL_ORIGINAL_PRICE,
  ANNUAL_PRICE,
  formatBRL,
  INSTALLMENT_PRICE,
  INSTALLMENTS_COUNT,
  setSubscription,
  type SubscriptionPayment,
} from '../lib/subscription.js';

/**
 * Oferta de assinatura — fiel à tela "paywall" de `papazilla-prototype`,
 * com uma mudança de produto (Flay, 2026-09): oferta única, sem plano
 * mensal. Preço "de/por" com desconto por tempo limitado — `ANNUAL_ORIGINAL_PRICE`
 * é só um valor de referência pra ancorar o desconto, não veio de um plano
 * anterior de fato cobrado; ajuste ali (`subscription.ts`) se o valor "de"
 * mudar. Aberta a partir de Papá (1ª receita, sem assinatura) ou de Minha
 * conta ("Conhecer planos" / "Gerenciar plano"); `location.state.returnTo`
 * diz pra onde voltar ao fechar ou depois de assinar.
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

  const [payment, setPayment] = useState<SubscriptionPayment>('upfront');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const ctaLabel =
    payment === 'installments'
      ? `Assinar em ${INSTALLMENTS_COUNT}x de ${formatBRL(INSTALLMENT_PRICE)}`
      : `Assinar por ${formatBRL(ANNUAL_PRICE)}`;

  const disclosure =
    payment === 'installments'
      ? `${INSTALLMENTS_COUNT} pagamentos de ${formatBRL(INSTALLMENT_PRICE)} sem juros · total de ${formatBRL(ANNUAL_PRICE)} por 12 meses de acesso. A renovação inicia um novo período de compromisso.`
      : `${formatBRL(ANNUAL_PRICE)} cobrados por 12 meses de acesso. Renovação anual automática; cancele a próxima renovação quando quiser.`;

  const commitment =
    payment === 'installments'
      ? 'Compromisso de 12 meses. Você pode cancelar a renovação a qualquer momento; os pagamentos do período contratado continuam até o final.'
      : 'Pagamento anual antecipado. A assinatura renova por mais 12 meses até você cancelar a renovação.';

  function subscribe() {
    setSubscription({ plan: 'annual', payment });
    toast('Plano ativado. Boa fornalha!');
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

        <section className="paywall-offer">
          <span className="paywall-offer__badge">⏳ Por tempo limitado</span>
          <div className="paywall-offer__price">
            <span className="paywall-offer__was">de {formatBRL(ANNUAL_ORIGINAL_PRICE)}</span>
            <strong>
              {formatBRL(ANNUAL_PRICE)}
              <small>/ano</small>
            </strong>
            <span className="paywall-offer__hint">Preço especial para os primeiros acessos</span>
          </div>

          <div className="annual-payment-options" role="radiogroup" aria-label="Forma de pagamento">
            <button
              type="button"
              className={`annual-payment-option${payment === 'upfront' ? ' is-selected' : ''}`}
              role="radio"
              aria-checked={payment === 'upfront'}
              onClick={() => setPayment('upfront')}
            >
              <span aria-hidden="true" />
              <p>
                <strong>{formatBRL(ANNUAL_PRICE)} à vista</strong>
                <small>Pagamento único por 12 meses de acesso</small>
              </p>
            </button>
            <button
              type="button"
              className={`annual-payment-option${payment === 'installments' ? ' is-selected' : ''}`}
              role="radio"
              aria-checked={payment === 'installments'}
              onClick={() => setPayment('installments')}
            >
              <span aria-hidden="true" />
              <p>
                <strong>
                  Em até {INSTALLMENTS_COUNT}x de {formatBRL(INSTALLMENT_PRICE)}
                </strong>
                <small>Sem juros no cartão</small>
              </p>
            </button>
          </div>
          <p className="annual-commitment">{commitment}</p>
        </section>

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
