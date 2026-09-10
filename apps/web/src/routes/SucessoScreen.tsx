import { Link } from 'react-router-dom';

/**
 * Cadastro concluído — placeholder. A próxima fatia traz a tela "success" fiel
 * (confete, retrato do pet, resumo, "Vamos papá!" / "Cadastrar outro Monstrinho").
 */
export function SucessoScreen() {
  return (
    <section className="pz-screen" style={{ padding: '2rem 1.25rem', alignItems: 'center', textAlign: 'center' }}>
      <h1>Monstrinho cadastrado!</h1>
      <p>A tela de boas-vindas com o resumo entra na próxima fatia.</p>
      <Link to="/zilla" className="pz-button pz-button--primary">
        Ir para a matilha
      </Link>
    </section>
  );
}
