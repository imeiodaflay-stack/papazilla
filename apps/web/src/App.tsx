import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { SplashScreen } from './routes/SplashScreen.js';
import { AuthScreen } from './routes/AuthScreen.js';
import { OnboardingScreen } from './routes/OnboardingScreen.js';
import { ZillaRoute } from './routes/ZillaRoute.js';
import { PetDetailScreen } from './routes/PetDetailScreen.js';
import { PetEditScreen } from './routes/PetEditScreen.js';
import { AnamnesisDetailScreen } from './routes/AnamnesisDetailScreen.js';
import { PapaRoute } from './routes/PapaRoute.js';
import { CuriosidadesScreen } from './routes/CuriosidadesScreen.js';
import { CuriosidadeDetalheScreen } from './routes/CuriosidadeDetalheScreen.js';
import { ReceitasScreen } from './routes/ReceitasScreen.js';
import { RecipeDetailScreen } from './routes/RecipeDetailScreen.js';
import { RecipeCookLogScreen } from './routes/RecipeCookLogScreen.js';
import { ContaScreen } from './routes/ContaScreen.js';
import { AjudaScreen } from './routes/AjudaScreen.js';
import { AssinaturaScreen } from './routes/AssinaturaScreen.js';
import { GerenciarAssinaturaScreen } from './routes/GerenciarAssinaturaScreen.js';
import { AnamneseScreen } from './routes/AnamneseScreen.js';
import { SucessoScreen } from './routes/SucessoScreen.js';
import { ReceitaScreen } from './routes/ReceitaScreen.js';

/**
 * Rotas do MVP. Fluxo confirmado (arquitetura-tecnica.md):
 * Splash → Entrar/criar conta → Onboarding → Cadastro do 1º Monstrinho → Papá.
 * Navegação inferior (app-view): Pets / Papá / Curiosidades / Salvas.
 * Minha conta, a anamnese, as telas da área Pets (lista/perfil/respostas),
 * Curiosidades e Receitas salvas têm cabeçalho próprio — não usam a casca
 * genérica `AppShell` (ver `ZillaRoute`).
 */
export const router = createBrowserRouter([
  { path: '/', element: <SplashScreen /> },
  { path: '/entrar', element: <AuthScreen /> },
  { path: '/onboarding', element: <OnboardingScreen /> },
  { path: '/anamnese', element: <AnamneseScreen /> },
  { path: '/sucesso', element: <SucessoScreen /> },
  { path: '/receita', element: <ReceitaScreen /> },
  { path: '/conta', element: <ContaScreen /> },
  { path: '/ajuda', element: <AjudaScreen /> },
  { path: '/assinatura', element: <AssinaturaScreen /> },
  { path: '/assinatura/gerenciar', element: <GerenciarAssinaturaScreen /> },
  { path: '/zilla', element: <ZillaRoute /> },
  { path: '/zilla/:petId', element: <PetDetailScreen /> },
  { path: '/zilla/:petId/editar', element: <PetEditScreen /> },
  { path: '/zilla/:petId/respostas', element: <AnamnesisDetailScreen /> },
  { path: '/curiosidades', element: <CuriosidadesScreen /> },
  { path: '/curiosidades/:curiosidadeId', element: <CuriosidadeDetalheScreen /> },
  { path: '/receitas', element: <ReceitasScreen /> },
  { path: '/receitas/:recipeId', element: <RecipeDetailScreen /> },
  { path: '/receitas/:recipeId/preparo', element: <RecipeCookLogScreen /> },
  {
    element: <AppShell />,
    children: [{ path: '/papa', element: <PapaRoute /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
