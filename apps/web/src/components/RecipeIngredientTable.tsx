import type { RecipeGroup } from '@papazilla/nutrition-engine';
import { formatGrams } from '../lib/recipeDisplay.js';

/**
 * "O que pesar" — uma linha por ingrediente, nunca agrupada por carne/
 * carboidrato/vegetal: com mais de um item no mesmo grupo, juntar os rótulos
 * com vírgula e somar os valores com "+" numa linha só ficava confuso e
 * quebrava feio em telas estreitas. Cru e pronto viram colunas próprias em
 * vez de um texto combinado.
 *
 * Compartilhado entre o resultado do wizard (`RecipeResultCard`) e a receita
 * salva (`RecipeDetailScreen`) — fica sempre visível, nunca dentro de um
 * acordeão, porque é a informação mais acionável da receita (Flay, 2026-09).
 */
export function RecipeIngredientTable({ groups, format }: { groups: RecipeGroup[]; format: string }) {
  const rows = groups.filter((g) => g.key !== 'herbs').flatMap((g) => g.rows.map((row) => ({ ...row, groupKey: g.key })));
  const showRaw = format !== 'Quantidade dos alimentos prontos';
  const showCooked = format !== 'Quantidade dos alimentos crus';
  const columns = (showRaw ? 1 : 0) + (showCooked ? 1 : 0);

  return (
    <div className="ingredient-table">
      <h3>O que pesar</h3>
      {columns === 2 ? (
        <div className="ingredient-table__row ingredient-table__row--head" aria-hidden="true">
          <span />
          <small>Cru</small>
          <small>Pronto</small>
        </div>
      ) : null}
      {rows.map((row) => (
        <div key={row.id} className={`ingredient-table__row ingredient-table__row--${row.groupKey}${columns === 1 ? ' ingredient-table__row--single' : ''}`}>
          <span>{row.label}</span>
          {showRaw ? <strong>{row.rawGrams !== undefined ? `≈ ${formatGrams(row.rawGrams)}` : '—'}</strong> : null}
          {showCooked ? <strong>{row.cookedGrams !== undefined ? `≈ ${formatGrams(row.cookedGrams)}` : '—'}</strong> : null}
        </div>
      ))}
    </div>
  );
}
