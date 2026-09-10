import { Link, Outlet } from 'react-router-dom';
import { AppNav } from './AppNav.js';
import wordmark from '../assets/papazilla-wordmark.png';

/**
 * Casca das telas autenticadas (app-view), fiel a `papazilla-prototype`:
 * header com wordmark + avatar (→ Minha conta) e navegação flutuante inferior.
 */
export function AppShell() {
  return (
    <div className="app-view">
      <header className="app-header">
        <img src={wordmark} alt="Papazilla" />
        <Link to="/conta" className="avatar-button" aria-label="Abrir Minha conta">
          F
        </Link>
      </header>
      <main className="app-view__main">
        <Outlet />
      </main>
      <AppNav />
    </div>
  );
}
