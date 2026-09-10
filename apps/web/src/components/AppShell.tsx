import { Link, Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';

/** Casca das telas autenticadas: topo com marca + avatar (→ Conta) e navegação inferior. */
export function AppShell() {
  return (
    <div className="pz-app">
      <header className="pz-topbar">
        <span className="pz-topbar__brand">Papazilla</span>
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
