import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import cartaoIcon from '../assets/icons/cartao.webp';
import pixIcon from '../assets/icons/pix.webp';
import zillaFrente from '../assets/zilla-frente.png';
import { getActivePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';
import {
  ANNUAL_PRICE,
  createTransparentPayment,
  formatBRL,
  getSubscription,
  hasActiveAccess,
  loadSubscriptionForOwner,
  type PaymentCreationResult,
} from '../lib/subscription.js';
import { getUserId } from '../lib/session.js';
import { getUserProfile } from '../lib/userProfile.js';

type ReturnTo = 'papa' | 'conta' | 'recipe' | `original:${string}`;
type PaymentMethod = 'pix' | 'credit_card';

interface PaywallState {
  returnTo?: ReturnTo;
}

function closePath(returnTo: ReturnTo | undefined): string {
  if (returnTo === 'conta') return '/conta';
  return '/papa';
}

function parseReturnTo(value: string | null | undefined): ReturnTo | undefined {
  if (value === 'papa' || value === 'conta' || value === 'recipe') return value;
  if (value?.match(/^original:[a-z0-9-]+$/)) return value as `original:${string}`;
  return undefined;
}

function onlyDigits(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

function formatCpf(value: string): string {
  const d = onlyDigits(value, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatPhone(value: string): string {
  const d = onlyDigits(value, 11);
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCep(value: string): string {
  return onlyDigits(value, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCard(value: string): string {
  return onlyDigits(value, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const d = onlyDigits(value, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function AssinaturaScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = parseReturnTo((location.state as PaywallState | null)?.returnTo)
    ?? parseReturnTo(searchParams.get('returnTo'));
  const backTo = closePath(returnTo);
  const profile = getUserProfile();
  const activePet = getActivePet();
  const { preposition, displayName } = describePet(activePet);

  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [ccv, setCcv] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [pix, setPix] = useState<NonNullable<PaymentCreationResult['pix']> | null>(null);
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 3600);
  }

  useEffect(() => {
    if (!pix) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void loadSubscriptionForOwner(getUserId()).then(() => {
        if (!cancelled && hasActiveAccess(getSubscription())) {
          navigate(`/assinatura/confirmando?returnTo=${encodeURIComponent(returnTo ?? 'papa')}`, { replace: true });
        }
      });
    }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pix, navigate, returnTo]);

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing) return;
    setProcessing(true);
    try {
      const expiryDigits = onlyDigits(expiry, 4);
      const result = await createTransparentPayment({
        method,
        payer: {
          name,
          email,
          cpfCnpj: cpf,
          mobilePhone: phone,
          ...(method === 'credit_card' ? { postalCode, addressNumber } : {}),
        },
        ...(method === 'credit_card' ? {
          creditCard: {
            holderName: cardHolder,
            number: cardNumber,
            expiryMonth: expiryDigits.slice(0, 2),
            expiryYear: expiryDigits.slice(2),
            ccv,
          },
        } : {}),
      });
      if (method === 'pix' && result.pix) {
        setPix(result.pix);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(`/assinatura/confirmando?returnTo=${encodeURIComponent(returnTo ?? 'papa')}`, { replace: true });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Não foi possível processar o pagamento.');
    } finally {
      setProcessing(false);
    }
  }

  async function copyPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.payload);
      toast('Código Pix copiado.');
    } catch {
      toast('Selecione e copie o código Pix abaixo.');
    }
  }

  return (
    <div className="paywall-view">
      <header className="paywall-header">
        <button type="button" className="flow-header__back" aria-label="Voltar" onClick={() => pix ? setPix(null) : navigate(backTo)}>←</button>
        <span>{pix ? 'Pague com Pix' : 'Assinatura Papazilla'}</span>
        <span aria-hidden="true" />
      </header>

      <div className="paywall-content">
        {pix ? (
          <section className="pix-payment" aria-live="polite">
            <span className="pix-payment__badge">Pix gerado</span>
            <h1>Escaneie e pronto</h1>
            <p>Abra o app do seu banco, escolha Pix e escaneie o código. A liberação acontece automaticamente após o pagamento.</p>
            <div className="pix-payment__qr"><img src={`data:image/png;base64,${pix.encodedImage}`} alt="QR Code para pagamento via Pix" /></div>
            <label htmlFor="pix-code">Pix copia e cola</label>
            <textarea id="pix-code" readOnly value={pix.payload} rows={4} />
            <button type="button" className="pz-button pz-button--primary wide" onClick={() => { void copyPix(); }}>Copiar código Pix</button>
            <p className="pix-payment__status"><span aria-hidden="true" /> Aguardando confirmação do pagamento…</p>
            <small>O código vale para este pagamento anual de {formatBRL(ANNUAL_PRICE)}.</small>
          </section>
        ) : (
          <>
            <div className="paywall-hero">
              <span className="paywall-hero__art"><img src={zillaFrente} alt="Zilla pronto para cozinhar" /></span>
              <div>
                <p className="eyebrow">{activePet ? `A fornalha ${preposition} ${displayName} começa aqui` : 'Sua próxima fornalha começa aqui'}</p>
                <h1>Receitas na medida para o seu Monstrinho</h1>
                <p>Da escolha dos ingredientes à porção no potinho, o Papazilla calcula tudo para vocês.</p>
              </div>
            </div>

            <ul className="paywall-benefits" aria-label="Benefícios da assinatura">
              <li><span aria-hidden="true">✓</span><p><strong>Quantidades personalizadas</strong><small>Peso, rotina e objetivo entram no cálculo.</small></p></li>
              <li><span aria-hidden="true">✓</span><p><strong>Receita pronta para cozinhar</strong><small>Ingredientes, suplemento, finalização e preparo.</small></p></li>
              <li><span aria-hidden="true">✓</span><p><strong>Toda a matilha organizada</strong><small>Receitas salvas e histórico de fornalhas.</small></p></li>
            </ul>

            <section className="paywall-offer">
              <div className="paywall-offer__price"><strong>{formatBRL(ANNUAL_PRICE)}<small>/ano</small></strong><span className="paywall-offer__hint">Escolha como prefere pagar</span></div>
              <p className="annual-commitment">Um pagamento libera 12 meses de receitas personalizadas para toda a sua matilha.</p>
            </section>

            <form className="transparent-checkout" onSubmit={submitPayment}>
              <fieldset className="payment-methods">
                <legend>Forma de pagamento</legend>
                <button type="button" className={method === 'pix' ? 'is-selected' : ''} onClick={() => setMethod('pix')}><span className="payment-methods__icon" aria-hidden="true"><img src={pixIcon} alt="" /></span><b>Pix</b><small>Liberação após o pagamento</small></button>
                <button type="button" className={method === 'credit_card' ? 'is-selected' : ''} onClick={() => setMethod('credit_card')}><span className="payment-methods__icon" aria-hidden="true"><img src={cartaoIcon} alt="" /></span><b>Cartão de crédito</b><small>Renovação anual automática</small></button>
              </fieldset>

              <div className="checkout-form-section">
                <h2>Dados do titular</h2>
                <label>Nome completo<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>
                <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
                <div className="checkout-form-grid">
                  <label>CPF<input inputMode="numeric" autoComplete="off" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" required /></label>
                  <label>Celular<input inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" required /></label>
                </div>
              </div>

              {method === 'credit_card' ? (
                <div className="checkout-form-section">
                  <h2>Dados do cartão</h2>
                  <label>Nome impresso no cartão<input autoComplete="cc-name" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} required /></label>
                  <label>Número do cartão<input inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" required /></label>
                  <div className="checkout-form-grid">
                    <label>Validade<input inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" required /></label>
                    <label>Código de segurança<input inputMode="numeric" autoComplete="cc-csc" value={ccv} onChange={(e) => setCcv(onlyDigits(e.target.value, 4))} placeholder="000" required /></label>
                  </div>
                  <div className="checkout-form-grid">
                    <label>CEP<input inputMode="numeric" autoComplete="postal-code" value={postalCode} onChange={(e) => setPostalCode(formatCep(e.target.value))} placeholder="00000-000" required /></label>
                    <label>Número do endereço<input inputMode="numeric" autoComplete="address-line2" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} required /></label>
                  </div>
                </div>
              ) : null}

              <button type="submit" className="pz-button pz-button--primary wide paywall-cta" disabled={processing}>
                {processing ? 'Processando…' : method === 'pix' ? `Gerar Pix de ${formatBRL(ANNUAL_PRICE)}` : `Pagar ${formatBRL(ANNUAL_PRICE)} no cartão`}
              </button>
              <p className="paywall-disclosure">{method === 'pix' ? 'O Pix libera 12 meses de acesso. Ao final do período, você escolhe se quer renovar.' : 'Cobrança anual recorrente. Você pode cancelar a renovação a qualquer momento e usar o período já pago até o fim.'}</p>
              <p className="checkout-security"><span aria-hidden="true">⌾</span> Pagamento seguro. Os dados do cartão não são armazenados pelo Papazilla.</p>
            </form>

            <div className="paywall-links">
              <button type="button" onClick={() => navigate('/conta/termos')}>Termos de Uso</button><span>·</span><button type="button" onClick={() => navigate('/conta/termos')}>Privacidade</button>
            </div>
          </>
        )}
      </div>

      {toastMsg ? <div className="pz-toast is-visible" role="status">{toastMsg}</div> : null}
    </div>
  );
}
