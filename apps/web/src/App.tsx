import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { SplashScreen } from './routes/SplashScreen.js';
import { AuthScreen } from './routes/AuthScreen.js';
import { OnboardingScreen } from './routes/OnboardingScreen.js';
import { ZillaRoute } from './routes/ZillaRoute.js';
import { PetDetailScreen } from './routes/PetDetailScreen.js';
import { AnamnesisDetailScreen } from './routes/AnamnesisDetailScreen.js';
import { PapaRoute } from './routes/PapaRoute.js';
import { CuriosidadesScreen } from './routes/CuriosidadesScreen.js';
import { ReceitasScreen } from './routes/ReceitasScreen.js';
import { ContaScreen } from './routes/ContaScreen.js';
import { AnamneseScreen } from './routes/AnamneseScreen.js';
import { SucessoScreen } from './routes/SucessoScreen.js';

/**
 * Rotas do MVP. Fluxo confirmado (arquitetura-tecnica.md):
 * Splash → Entrar/criar conta → Onboarding → Cadastro do 1º Monstrinho → Papá.
 * Navegação inferior (app-view): Pets / Papá / Curiosidades / Salvas.
 * Minha conta, a anamnese e as telas da área Pets (lista/perfil/respostas) têm
 * cabeçalho próprio — não usam a casca genérica `AppShell` (ver `ZillaRoute`).
 */
export const router = createBrowserRouter([
  { path: '/', element: <SplashScreen /> },
  { path: '/entrar', element: <AuthScreen /> },
  { path: '/onboarding', element: <OnboardingScreen /> },
  { path: '/anamnese', element: <AnamneseScreen /> },
  { path: '/sucesso', element: <SucessoScreen /> },
  { path: '/conta', element: <ContaScreen /> },
  { path: '/zilla', element: <ZillaRoute /> },
  { path: '/zilla/:petId', element: <PetDetailScreen /> },
  { path: '/zilla/:petId/respostas', element: <AnamnesisDetailScreen /> },
  {
    element: <AppShell />,
    children: [
      { path: '/papa', element: <PapaRoute /> },
      { path: '/curiosidades', element: <CuriosidadesScreen /> },
      { path: '/receitas', element: <ReceitasScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
