import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { SplashScreen } from './routes/SplashScreen.js';
import { AuthScreen } from './routes/AuthScreen.js';
import { AuthCallbackScreen } from './routes/AuthCallbackScreen.js';
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
import { RecipeShareScreen } from './routes/RecipeShareScreen.js';
import { RecipeCookLogScreen } from './routes/RecipeCookLogScreen.js';
import { RecipeHistoryScreen } from './routes/RecipeHistoryScreen.js';
import { ContaScreen } from './routes/ContaScreen.js';
import { UserProfileEditScreen } from './routes/UserProfileEditScreen.js';
import { AccountAccessScreen } from './routes/AccountAccessScreen.js';
import { TermosPrivacidadeScreen } from './routes/TermosPrivacidadeScreen.js';
import { AccountDataScreen } from './routes/AccountDataScreen.js';
import { AjudaScreen } from './routes/AjudaScreen.js';
import { AssinaturaScreen } from './routes/AssinaturaScreen.js';
import { ConfirmandoAssinaturaScreen } from './routes/ConfirmandoAssinaturaScreen.js';
import { GerenciarAssinaturaScreen } from './routes/GerenciarAssinaturaScreen.js';
import { AnamneseScreen } from './routes/AnamneseScreen.js';
import { SucessoScreen } from './routes/SucessoScreen.js';
import { BeneficiosScreen } from './routes/BeneficiosScreen.js';
import { ReceitaScreen } from './routes/ReceitaScreen.js';
import { OriginalRecipeConfigScreen } from './routes/OriginalRecipeConfigScreen.js';
import { OriginalRecipeResultScreen } from './routes/OriginalRecipeResultScreen.js';
import { GaleriaScreen } from './routes/GaleriaScreen.js';

/**
 * Rotas do MVP. Fluxo confirmado (arquitetura-tecnica.md):
 * Splash → Entrar/criar conta → Onboarding → Cadastro do 1º Monstrinho → Papá.
 * Navegação inferior (app-view): Pets / Papá / Salvas / Galeria / Artigos.
 * Minha conta, a anamnese, as telas da área Pets (lista/perfil/respostas),
 * Curiosidades e Receitas salvas têm cabeçalho próprio — não usam a casca
 * genérica `AppShell` (ver `ZillaRoute`).
 */
export const router = createBrowserRouter([
  { path: '/', element: <SplashScreen /> },
  { path: '/entrar', element: <AuthScreen /> },
  { path: '/auth/callback', element: <AuthCallbackScreen /> },
  { path: '/onboarding', element: <OnboardingScreen /> },
  { path: '/anamnese', element: <AnamneseScreen /> },
  { path: '/sucesso', element: <SucessoScreen /> },
  { path: '/beneficios', element: <BeneficiosScreen /> },
  { path: '/receita', element: <ReceitaScreen /> },
  { path: '/papa/original/:slug', element: <OriginalRecipeConfigScreen /> },
  { path: '/papa/original/:slug/resultado', element: <OriginalRecipeResultScreen /> },
  { path: '/conta', element: <ContaScreen /> },
  { path: '/conta/editar', element: <UserProfileEditScreen /> },
  { path: '/conta/acesso', element: <AccountAccessScreen /> },
  { path: '/conta/termos', element: <TermosPrivacidadeScreen /> },
  { path: '/conta/dados', element: <AccountDataScreen /> },
  { path: '/ajuda', element: <AjudaScreen /> },
  { path: '/assinatura', element: <AssinaturaScreen /> },
  { path: '/assinatura/confirmando', element: <ConfirmandoAssinaturaScreen /> },
  { path: '/assinatura/gerenciar', element: <GerenciarAssinaturaScreen /> },
  { path: '/zilla', element: <ZillaRoute /> },
  { path: '/zilla/:petId', element: <PetDetailScreen /> },
  { path: '/zilla/:petId/editar', element: <PetEditScreen /> },
  { path: '/zilla/:petId/respostas', element: <AnamnesisDetailScreen /> },
  { path: '/zilla/:petId/anamnese', element: <AnamneseScreen /> },
  { path: '/artigos', element: <CuriosidadesScreen /> },
  { path: '/artigos/:curiosidadeId', element: <CuriosidadeDetalheScreen /> },
  { path: '/curiosidades', element: <Navigate to="/artigos" replace /> },
  { path: '/curiosidades/:curiosidadeId', element: <CuriosidadeDetalheScreen /> },
  { path: '/galeria', element: <GaleriaScreen /> },
  { path: '/receitas', element: <ReceitasScreen /> },
  { path: '/receitas/:recipeId', element: <RecipeDetailScreen /> },
  { path: '/receitas/:recipeId/compartilhar', element: <RecipeShareScreen /> },
  { path: '/receitas/:recipeId/preparo', element: <RecipeCookLogScreen /> },
  { path: '/receitas/:recipeId/historico', element: <RecipeHistoryScreen /> },
  {
    element: <AppShell />,
    children: [{ path: '/papa', element: <PapaRoute /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
