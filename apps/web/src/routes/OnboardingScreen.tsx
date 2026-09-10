import { Link } from 'react-router-dom';

/**
 * Onboarding em quatro telas (protótipo). Aqui só o esqueleto + o aviso comercial
 * transparente: a criação de receitas é o benefício premium, apresentado na primeira
 * tentativa de criar uma receita depois do cadastro do 1º pet.
 */
export function OnboardingScreen() {
  return (
    <div className="pz-app">
      <main className="pz-app__main pz-screen">
        <h1>Como o Papazilla funciona</h1>
        <ol className="pz-screen" style={{ paddingLeft: '1.2rem' }}>
          <li>Cadastre cada cão e responda a anamnese.</li>
          <li>Escolha os pets, a proporção e os ingredientes.</li>
          <li>Receba a receita com quantidades, suplemento e modo de preparo.</li>
          <li>Salve, registre que cozinhou e compartilhe quando precisar.</li>
        </ol>
        <p className="pz-note">
          Cadastrar cães e ler Curiosidades é livre. Criar receitas personalizadas é o plano pago,
          oferecido na primeira receita.
        </p>
        <Link to="/zilla" className="pz-btn">
          Cadastrar meu primeiro Monstrinho
        </Link>
      </main>
    </div>
  );
}
