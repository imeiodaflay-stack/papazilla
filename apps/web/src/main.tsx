import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@papazilla/design-system/tokens.css';
import '@papazilla/design-system/reset.css';
import './app.css';
import { router } from './App.js';
import { initAuth } from './lib/session.js';

const root = document.getElementById('root');
if (!root) throw new Error('#root não encontrado');
const reactRoot = createRoot(root);

function renderApp() {
  reactRoot.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

// A entrada pública não depende da sessão nem dos dados da conta. A sessão
// continua inicializando em segundo plano (session.ts), mas uma renovação
// lenta ou indisponível não pode impedir que o formulário de login apareça.
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
if (pathname === '/signup' || pathname === '/entrar') {
  renderApp();
} else {
  // Nas demais rotas, aguarda também a matilha para não mostrar uma conta
  // vazia enquanto os dados reais ainda estão sendo carregados.
  void initAuth().then(renderApp);
}
