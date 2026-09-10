import { Link } from 'react-router-dom';

/**
 * Minha conta — identidade, assinatura, acesso, documentos legais, contato e
 * exclusão da conta. Acessada pelo avatar, fora da navegação inferior.
 */
export function ContaScreen() {
  return (
    <section className="pz-screen">
      <h1>Minha conta</h1>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Identidade</h2>
        <p>Tutor(a) — (dados virão do provedor de login)</p>
      </div>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Assinatura</h2>
        <p>Plano gratuito. Papazilla Anual e Mensal entram com o provedor de pagamento.</p>
      </div>

      <div className="pz-card pz-screen">
        <h2 style={{ font: 'var(--pz-text-h3)' }}>Acesso e privacidade</h2>
        <p>Métodos de acesso, documentos legais, canal de contato e exclusão da conta.</p>
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
