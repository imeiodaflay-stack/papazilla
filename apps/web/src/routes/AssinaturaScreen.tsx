import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import zillaFrente from '../assets/zilla-frente.png';
import { getActivePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';
import { ANNUAL_PRICE, createCheckoutSession, formatBRL } from '../lib/subscription.js';

/**
 * Oferta de assinatura — fiel à tela "paywall" de `papazilla-prototype`,
 * com duas mudanças de produto (Flay, 2026-09):
 * 1. Oferta única, sem plano mensal.
 * 2. Cobrança recorrente automática só no cartão, sem parcelamento — o
 *    Asaas não parcela cobrança recorrente (ver handover). A versão anterior
 *    desta tela ("à vista ou 6x") ficou pra trás por causa dessa decisão.
 *
 * "Assinar" agora cria uma sessão de Checkout de verdade no Asaas
 * (`/api/checkout-create`) e redireciona pra lá — nada é liberado aqui, só
 * o webhook (`/api/webhooks-asaas`) confirma o pagamento de verdade. Ver
 * `ConfirmandoAssinaturaScreen` pra onde o Asaas manda a pessoa de volta.
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

export function AssinaturaScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as PaywallState | null)?.returnTo;
  const backTo = closePath(returnTo);

  const activePet = getActivePet();
  const { preposition, displayName } = describePet(activePet);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 3200);
  }

  async function subscribe() {
    if (loading) return;
    setLoading(true);
    try {
      const url = await createCheckoutSession(returnTo ?? 'papa');
      window.location.href = url;
    } catch (err) {
      setLoading(false);
      toast(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento. Tente de novo.');
    }
  }

  return (
    <div className="paywall-view">
      <header className="paywall-header">
        <button type="button" className="flow-header__back" aria-label="Voltar" onClick={() => navigate(backTo)}>
          ←
        </button>
        <span>Assinatura Papazilla</span>
        <span aria-hidden="true" />
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
          <div className="paywall-offer__price">
            <strong>
              {formatBRL(ANNUAL_PRICE)}
              <small>/ano</small>
            </strong>
            <span className="paywall-offer__hint">Cobrança recorrente automática no cartão</span>
          </div>
          <p className="annual-commitment">
            Renovação anual automática. Cancele quando quiser — o acesso continua até o fim do período já pago.
          </p>
        </section>

        <button type="button" className="pz-button pz-button--primary wide paywall-cta" onClick={subscribe} disabled={loading}>
          {loading ? 'Abrindo pagamento…' : `Assinar por ${formatBRL(ANNUAL_PRICE)}/ano`}
        </button>
        <p className="paywall-disclosure">
          Pagamento processado pelo Asaas. {formatBRL(ANNUAL_PRICE)} cobrados no cartão a cada 12 meses até você
          cancelar a renovação.
        </p>
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
