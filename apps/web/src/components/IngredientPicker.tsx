import { useState } from 'react';
import type { CatalogItem } from '@papazilla/nutrition-engine';
import searchIcon from '../assets/icons/busca.png';

/** Pequenas notas por ingrediente — só os alertas que já existem no catálogo do motor. */
function ingredientHint(item: CatalogItem): string | undefined {
  if (item.id === 'peixe') return 'Fonte de ômega-3';
  if (item.highFat) return 'Alto teor de gordura';
  if (item.muscularOrgan) return 'Víscera muscular';
  if (item.vegAlert) return 'Atenção aos oxalatos';
  if (item.vegLoosens) return 'Máx. 5% dos vegetais';
  return undefined;
}

/** Busca + grade de seleção múltipla de ingredientes — fiel à tela de receita de `papazilla-prototype`. */
export function IngredientPicker({
  items,
  selected,
  onToggle,
}: {
  items: readonly CatalogItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const visibleItems = normalizedQuery
    ? items.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
    : items;

  return (
    <div>
      <div className="ingredient-browser">
        <label className="ingredient-search">
          <img src={searchIcon} alt="" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${items.length} opções`}
            autoComplete="off"
          />
        </label>
        <span className="ingredient-count">
          {visibleItems.length} {visibleItems.length === 1 ? 'opção' : 'opções'}
        </span>
      </div>
      <div className="ingredient-grid">
        {visibleItems.map((item) => {
          const isSelected = selected.has(item.id);
          const hint = ingredientHint(item);
          return (
            <button
              key={item.id}
              type="button"
              className={`ingredient-card${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onToggle(item.id)}
            >
              <strong>{item.label}</strong>
              {hint ? <small>{hint}</small> : null}
              <i aria-hidden="true">✓</i>
            </button>
          );
        })}
      </div>
    </div>
  );
}
