import galeriaIcon from '../assets/icons/galeria.svg';
import { AppNav } from '../components/AppNav.js';

/** Entrada da futura Galeria de fotos das fornalhas. */
export function GaleriaScreen() {
  return (
    <div className="app-view">
      <header className="app-header gallery-header">
        <div>
          <p className="eyebrow">Memórias da cozinha</p>
          <h1>Galeria</h1>
        </div>
      </header>

      <main className="app-view__main">
        <section className="gallery-empty">
          <span><img src={galeriaIcon} alt="" /></span>
          <h2>Sua galeria está começando</h2>
          <p>As fotos dos preparos dos seus Monstrinhos vão aparecer aqui.</p>
        </section>
      </main>

      <AppNav />
    </div>
  );
}
