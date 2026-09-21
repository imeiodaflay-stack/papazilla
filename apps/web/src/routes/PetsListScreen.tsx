import { Link, useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import infoIcon from '../assets/icons/info.png';
import { AppNav } from '../components/AppNav.js';
import { setActivePetId, type StoredPet } from '../lib/petsStore.js';
import { describePet, shortGoal } from '../lib/petLabel.js';

/**
 * Sua matilha — fiel à tela "pets" (lista) de `papazilla-prototype`. Cabeçalho
 * próprio ("Pets" / "Sua matilha"), diferente do wordmark genérico das outras
 * telas do app-view — por isso não usa `AppShell` (ver `ZillaRoute`).
 */
export function PetsListScreen({ pets }: { pets: StoredPet[] }) {
  const navigate = useNavigate();

  function openPet(pet: StoredPet) {
    setActivePetId(pet.id);
    navigate(`/zilla/${pet.id}`);
  }

  return (
    <div className="app-view">
      <header className="app-header pets-header">
        <div>
          <p className="eyebrow">Pets</p>
          <h1>Sua matilha</h1>
        </div>
        <Link to="/conta" className="avatar-button" aria-label="Abrir Minha conta">
          F
        </Link>
      </header>

      <main className="app-view__main">
        <div className="pets-content">
          <div className="pack-heading">
            <div>
              <h2>Seus Monstrinhos</h2>
              <p>{pets.length === 1 ? '1 cão cadastrado' : `${pets.length} cães cadastrados`}</p>
            </div>
            <span>{pets.length}</span>
          </div>

          <div className="pet-list">
            {pets.map((pet) => {
              const { displayName } = describePet(pet);
              const identity = [pet.breed, pet.sex, pet.age].filter(Boolean).join(' · ');
              return (
                <button
                  key={pet.id}
                  type="button"
                  className="pet-list-card"
                  onClick={() => openPet(pet)}
                >
                  <span className="pet-list-card__portrait">
                    <img
                      src={pet.photoPath || zillaIcon}
                      alt={pet.photoPath ? `Foto de ${displayName}` : `Ilustração de ${displayName}`}
                      className={pet.photoPath ? 'pet-list-card__photo' : undefined}
                    />
                  </span>
                  <span className="pet-list-card__content">
                    <strong>{displayName}</strong>
                    <small>{identity || 'Perfil cadastrado'}</small>
                    <span>
                      <b>{pet.weight ? `${pet.weight} kg` : '—'}</b>
                      <b>{pet.activityTime || '—'}</b>
                      <b>{shortGoal(pet.goal)}</b>
                    </span>
                  </span>
                  <span className="pet-list-card__arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="pz-button pz-button--primary wide add-monster-button"
            onClick={() => navigate('/anamnese')}
          >
            <span aria-hidden="true">＋</span> Cadastrar outro Monstrinho
          </button>

          <div className="zilla-note pack-note">
            <img src={infoIcon} alt="" />
            <p>
              <strong>Cada focinho, uma medida</strong>O perfil de cada cão guarda seus próprios
              dados, respostas e recomendações.
            </p>
          </div>
        </div>
      </main>

      <AppNav />
    </div>
  );
}
