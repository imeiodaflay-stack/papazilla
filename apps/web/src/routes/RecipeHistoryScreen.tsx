import { Navigate, useParams } from 'react-router-dom';

/**
 * Compatibilidade para links antigos. O histórico deixou de existir como
 * seção própria; fotos, avaliações e legendas agora vivem na Galeria da receita.
 */
export function RecipeHistoryScreen() {
  const { recipeId } = useParams();
  return <Navigate to={recipeId ? `/receitas/${recipeId}` : '/receitas'} replace />;
}
