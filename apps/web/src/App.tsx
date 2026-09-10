import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { SplashScreen } from './routes/SplashScreen.js';
import { AuthScreen } from './routes/AuthScreen.js';
import { OnboardingScreen } from './routes/OnboardingScreen.js';
import { ZillaScreen } from './routes/ZillaScreen.js';
import { PapaScreen } from './routes/PapaScreen.js';
import { CuriosidadesScreen } from './routes/CuriosidadesScreen.js';
import { ReceitasScreen } from './routes/ReceitasScreen.js';
import { ContaScreen } from './routes/ContaScreen.js';

/**
 * Rotas do MVP. Fluxo confirmado (arquitetura-tecnica.md):
 * Splash → Entrar/criar conta → Onboarding → Cadastro do 1º Monstrinho → Papá.
 * A navegação inferior é Zilla / Papá / Curiosidades / Receitas; Conta abre pelo avatar.
 */
export const router = createBrowserRouter([
  { path: '/', element: <SplashScreen /> },
  { path: '/entrar', element: <AuthScreen /> },
  { path: '/onboarding', element: <OnboardingScreen /> },
  {
    element: <AppShell />,
    children: [
      { path: '/zilla', element: <ZillaScreen /> },
      { path: '/papa', element: <PapaScreen /> },
      { path: '/curiosidades', element: <CuriosidadesScreen /> },
      { path: '/receitas', element: <ReceitasScreen /> },
      { path: '/conta', element: <ContaScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
