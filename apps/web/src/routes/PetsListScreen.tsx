import { Link, useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import infoIcon from '../assets/icons/info.png';
import { AppNav } from '../components/AppNav.js';
import { setActivePetId, type StoredPet } from '../lib/petsStore.js';
import { describePet, shortGoal } from '../lib/petLabel.js';

function ageLabel(age: string): string {
  const cleanAge = age.trim();
  if (!cleanAge) return 'Idade não informada';
  if (!/^\d+(?:[.,]\d+)?$/.test(cleanAge)) return cleanAge;
  return `${cleanAge} ${cleanAge === '1' ? 'ano' : 'anos'}`;
}

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
          <div className="pack-heading pack-heading--portraits">
            <div>
              <h2>A realeza da casa</h2>
              <p>Toque para ver o perfil completo</p>
            </div>
            <span>{pets.length} Zillas</span>
          </div>

          <div className="pet-portrait-list">
            {pets.map((pet) => {
              const { displayName } = describePet(pet);
              return (
                <button
                  key={pet.id}
                  type="button"
                  className={`pet-portrait-card${pet.photoPath ? '' : ' pet-portrait-card--placeholder'}`}
                  onClick={() => openPet(pet)}
                  aria-label={`Abrir perfil de ${displayName}`}
                >
                  <span className="pet-portrait-card__media">
                    <img
                      src={pet.photoPath || zillaIcon}
                      alt=""
                      className={pet.photoPath ? 'pet-portrait-card__photo' : 'pet-portrait-card__fallback'}
                    />
                  </span>
                  <span className="pet-portrait-card__shade" aria-hidden="true" />
                  <span className="pet-portrait-card__arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="pet-portrait-card__content">
                    <strong>{displayName}</strong>
                    <span className="pet-portrait-card__meta">
                      <b>{ageLabel(pet.age)}</b>
                      <b>{pet.sex || 'Sexo não informado'}</b>
                      <b>{shortGoal(pet.goal)}</b>
                    </span>
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
