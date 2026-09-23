import zillaIcon from '../assets/icons/zilla.png';
import type { StoredPet } from '../lib/petsStore.js';

export interface RecipePetSelectorEntry {
  pet: StoredPet;
  detail: string;
  amount: string;
}

interface RecipePetSelectorProps {
  entries: RecipePetSelectorEntry[];
  selectedIds: Set<string>;
  onToggle: (petId: string) => void;
  amountLabel?: string;
}

export function RecipePetSelector({ entries, selectedIds, onToggle, amountLabel }: RecipePetSelectorProps) {
  if (entries.length === 1) {
    const { pet, detail, amount } = entries[0]!;
    const isSelected = selectedIds.has(pet.id);
    return (
      <button
        type="button"
        className={`recipe-pet-single${isSelected ? ' is-selected' : ''}`}
        aria-pressed={isSelected}
        onClick={() => onToggle(pet.id)}
      >
        <img src={pet.photoPath || zillaIcon} alt={pet.photoPath ? `Foto de ${pet.name}` : ''} />
        <span className="recipe-pet-single__copy">
          <span className="recipe-selected-pill">{isSelected ? '✓ Selecionada' : 'Selecionar'}</span>
          <strong>{pet.name}</strong>
          <small>{detail}</small>
          <b>{amountLabel ? `${amountLabel} · ${amount}` : amount}</b>
        </span>
      </button>
    );
  }

  return (
    <div className="recipe-pet-portraits">
      {entries.map(({ pet, detail }) => {
        const isSelected = selectedIds.has(pet.id);
        return (
          <button
            type="button"
            className={`recipe-pet-portrait${isSelected ? ' is-selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(pet.id)}
            key={pet.id}
          >
            <img src={pet.photoPath || zillaIcon} alt={pet.photoPath ? `Foto de ${pet.name}` : ''} />
            <span className="recipe-pet-portrait__check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
            <span className="recipe-pet-portrait__label">
              <strong>{pet.name}</strong>
              <small>{detail}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
