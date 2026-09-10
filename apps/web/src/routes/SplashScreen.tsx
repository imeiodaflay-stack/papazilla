import { Link } from 'react-router-dom';
import lockup from '../assets/papazilla-lockup.png';

/**
 * Splash / apresentação. A entrada animada (logo, tagline, orbs, loader escalonados)
 * do protótipo entra depois; aqui a versão estática, segura para prefers-reduced-motion.
 */
export function SplashScreen() {
  return (
    <div className="pz-app">
      <main
        className="pz-app__main pz-screen"
        style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
      >
        <img
          src={lockup}
          alt="Papazilla"
          width={220}
          height={220}
          style={{ width: 'min(58vw, 220px)', height: 'auto' }}
        />
        <p
          style={{
            font: 'var(--pz-text-caption)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Alimentação natural cozida para cães
        </p>
        <h1 style={{ font: 'var(--pz-text-h1)', color: 'var(--pz-chocolate)' }}>
          Fome de monstro.
          <br />
          Porção na medida.
        </h1>
        <p>Cadastre seus cães e prepare uma receita completa, confiável e prática para eles.</p>
        <Link to="/entrar" className="pz-btn">
          Começar
        </Link>
      </main>
    </div>
  );
}
