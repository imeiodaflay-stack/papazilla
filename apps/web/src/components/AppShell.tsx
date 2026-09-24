import { Outlet, useLocation } from 'react-router-dom';
import { AppNav } from './AppNav.js';
import { AccountAvatarLink } from './AccountAvatarLink.js';
import wordmark from '../assets/papazilla-wordmark.png';

/**
 * Casca das telas autenticadas (app-view), fiel a `papazilla-prototype`:
 * header com wordmark + avatar (→ Minha conta) e navegação flutuante inferior.
 */
export function AppShell() {
  const location = useLocation();
  const isPapa = location.pathname === '/papa';

  return (
    <div className="app-view">
      <header className={`app-header${isPapa ? ' app-header--papa' : ''}`}>
        {isPapa ? (
          <div className="app-header__title">
            <small>PAPÁ</small>
            <strong>O que vamos papá?</strong>
          </div>
        ) : <img src={wordmark} alt="Papazilla" />}
        <AccountAvatarLink />
      </header>
      <main className="app-view__main">
        <Outlet />
      </main>
      <AppNav />
    </div>
  );
}
