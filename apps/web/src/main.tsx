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

// Espera a sessão (e a matilha carregada junto por ela, ver session.ts)
// resolver antes do primeiro render. Sem isso, abrir/recarregar a página
// direto numa rota como /zilla renderiza antes do Supabase responder e
// mostra "sem pets" mesmo com Monstrinhos já cadastrados na conta.
void initAuth().then(() => {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
