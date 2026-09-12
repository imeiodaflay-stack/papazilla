import { Link } from 'react-router-dom';
import { getSubscription } from '../lib/subscription.js';

const PLAN_NAME = { annual: 'Papazilla Anual', monthly: 'Papazilla Mensal' } as const;
const PLAN_PAYMENT = {
  upfront: 'R$ 107,90 à vista',
  installments: '12 pagamentos de R$ 9,99',
  monthly: 'R$ 19,90 por mês',
} as const;

/**
 * Minha conta — identidade, assinatura, acesso, documentos legais, contato e
 * exclusão da conta. Acessada pelo avatar, fora da navegação inferior.
 */
export function ContaScreen() {
  const subscription = getSubscription();

  return (
    <section className="pz-screen">
      <h1>Minha conta</h1>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Identidade</h2>
        <p>Tutor(a) — (dados virão do provedor de login)</p>
      </div>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Assinatura</h2>
        <p>
          {subscription
            ? `${PLAN_NAME[subscription.plan]} ativo · ${PLAN_PAYMENT[subscription.payment]}.`
            : 'Plano gratuito. Assine para criar receitas personalizadas.'}
        </p>
        <Link to="/assinatura" state={{ returnTo: 'conta' }} className="pz-btn pz-btn--ghost">
          {subscription ? 'Gerenciar plano →' : 'Conhecer planos →'}
        </Link>
      </div>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Ajuda e privacidade</h2>
        <p>Dúvidas, documentos legais, canal de contato e exclusão da conta.</p>
        <Link to="/ajuda" className="pz-btn pz-btn--ghost">
          Central de Ajuda
        </Link>
        <button type="button" className="pz-btn pz-btn--ghost" disabled>
          Sair da conta
        </button>
      </div>

      <Link to="/zilla" className="pz-btn pz-btn--ghost">
        Voltar
      </Link>
    </section>
  );
}
