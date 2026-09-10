import { Link, Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';
import wordmark from '../assets/papazilla-wordmark.png';

/** Casca das telas autenticadas: topo com marca + avatar (→ Conta) e navegação inferior. */
export function AppShell() {
  return (
    <div className="pz-app">
      <header className="pz-topbar">
        <Link to="/zilla" aria-label="Papazilla — início">
          <img src={wordmark} alt="Papazilla" height={22} style={{ height: 22, width: 'auto' }} />
        </Link>
        <Link to="/conta" className="pz-avatar" aria-label="Minha conta">
          F
        </Link>
      </header>
      <main className="pz-app__main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
