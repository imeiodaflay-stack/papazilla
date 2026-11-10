import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/session.js';
import { AppNav } from './AppNav.js';
import { AccountAvatarLink } from './AccountAvatarLink.js';
import wordmark from '../assets/papazilla-wordmark.webp';

/**
 * Casca das telas autenticadas (app-view), fiel a `papazilla-prototype`:
 * header com wordmark + avatar (→ Minha conta) e navegação flutuante inferior.
 */
export function AppShell() {
  const location = useLocation();
  const isPapa = ['/papa', '/papa/planejar', '/papa/compras'].includes(location.pathname);

  // Sem sessão não há Papá para mostrar (ex.: primeira abertura pelo ícone da
  // tela de início, que não leva a sessão do navegador): vai para o login.
  if (!isAuthenticated()) return <Navigate to="/signup" replace />;

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
