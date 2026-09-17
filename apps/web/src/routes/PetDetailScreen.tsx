import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import calendarioIcon from '../assets/icons/calendario.png';
import graficoIcon from '../assets/icons/grafico-barras.png';
import patinhaIcon from '../assets/icons/patinha.png';
import sucessoIcon from '../assets/icons/sucesso.png';
import sheetIcon from '../assets/icons/sheet.png';
import infoIcon from '../assets/icons/info.png';
import { AppNav } from '../components/AppNav.js';
import { deletePet, getPet, listPets, setActivePetId } from '../lib/petsStore.js';
import { describePet, neuteredLabel } from '../lib/petLabel.js';

/**
 * Perfil do pet — fiel à tela "pet-detail" de `papazilla-prototype`: retrato,
 * identidade, dados principais e card de anamnese. "Editar" abre a edição de
 * verdade (`PetEditScreen`); "Ver respostas" abre a anamnese em modo leitura
 * de verdade. "•••" abre "Excluir Monstrinho" (real, com confirmação — sem
 * tela equivalente no protótipo, que só mostrava um toast).
 */
export function PetDetailScreen() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const [showMore, setShowMore] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const pet = petId ? getPet(petId) : undefined;
  const pets = listPets();

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      toast(state.toast);
      navigate('.', { replace: true, state: null });
    }
  }, []);

  if (!pet) return <Navigate to="/zilla" replace />;

  const { displayName } = describePet(pet);
  const identity = [pet.breed || 'Sem raça definida', pet.sex, neuteredLabel(pet.sex, pet.neutered)]
    .filter(Boolean)
    .join(' · ');
  const registeredOn = new Date(pet.createdAt).toLocaleDateString('pt-BR');

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  function switchPet(id: string) {
    setActivePetId(id);
    navigate(`/zilla/${id}`);
  }

  function confirmDelete() {
    deletePet(pet!.id);
    navigate('/zilla', { replace: true });
  }

  return (
    <div className="app-view">
      <header className="app-header pets-header pets-header--detail">
        <button
          type="button"
          className="profile-list-back"
          aria-label="Voltar para a lista de pets"
          onClick={() => navigate('/zilla')}
        >
          ←
        </button>
        <label className="pet-switcher">
          <span>Visualizando</span>
          <select
            aria-label="Trocar de pet"
            value={pet.id}
            onChange={(e) => switchPet(e.target.value)}
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {describePet(p).displayName}
              </option>
            ))}
          </select>
        </label>
        <Link to="/conta" className="avatar-button" aria-label="Abrir Minha conta">
          F
        </Link>
      </header>

      <main className="app-view__main">
        <div className="pets-content">
          <section className="pet-hero-card">
            <div className="pet-hero-card__portrait">
              <img src={pet.photoPath || zillaIcon} alt="" className={pet.photoPath ? 'photo-picker__preview' : undefined} />
              <span aria-hidden="true">♥</span>
            </div>
            <div className="pet-hero-card__identity">
              <span className="pz-badge pz-badge--success">Parte da matilha</span>
              <h2>{displayName}</h2>
              <p>{identity}</p>
            </div>
            <button
              type="button"
              className="pet-more"
              aria-label="Mais opções para o pet"
              onClick={() => setShowMore((v) => !v)}
            >
              •••
            </button>
          </section>

          {showMore && !confirmingDelete ? (
            <div className="more-menu">
              <button type="button" className="more-menu__item more-menu__item--danger" onClick={() => setConfirmingDelete(true)}>
                Excluir Monstrinho
              </button>
            </div>
          ) : null}

          {confirmingDelete ? (
            <div className="pet-section">
              <div className="clinical-warning">
                <img src={infoIcon} alt="" />
                <p>
                  <strong>Excluir {displayName}?</strong>
                  <span>
                    Essa ação não pode ser desfeita. O perfil, as respostas da anamnese e o histórico deste Monstrinho
                    serão apagados deste aparelho.
                  </span>
                </p>
              </div>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="pz-button pz-button--outline"
                  onClick={() => {
                    setConfirmingDelete(false);
                    setShowMore(false);
                  }}
                >
                  Cancelar
                </button>
                <button type="button" className="pz-button pz-button--primary" onClick={confirmDelete}>
                  Sim, excluir
                </button>
              </div>
            </div>
          ) : null}

          <section className="pet-section">
            <div className="pet-section__heading">
              <div>
                <p className="eyebrow">De relance</p>
                <h2>Dados principais</h2>
              </div>
              <button type="button" onClick={() => navigate(`/zilla/${pet.id}/editar`)}>
                Editar
              </button>
            </div>
            <div className="pet-stats-grid">
              <article>
                <img src={calendarioIcon} alt="" />
                <small>Idade</small>
                <strong>{pet.age || '—'}</strong>
              </article>
              <article>
                <img src={graficoIcon} alt="" />
                <small>Peso</small>
                <strong>{pet.weight ? `${pet.weight} kg` : '—'}</strong>
              </article>
              <article>
                <img src={patinhaIcon} alt="" />
                <small>Atividade</small>
                <strong>{pet.activityTime || '—'}</strong>
              </article>
              <article className="pet-stat--wide">
                <img src={sucessoIcon} alt="" />
                <small>Objetivo atual</small>
                <strong>{pet.goal || '—'}</strong>
              </article>
            </div>
          </section>

          <section className="anamnesis-card">
            <div className="anamnesis-card__icon">
              <img src={sheetIcon} alt="" />
            </div>
            <div>
              <span className="pz-badge pz-badge--success">Perfil em dia</span>
              <h2>Perfil e anamnese</h2>
              <p>Saúde, rotina, digestão e preferências de {displayName}.</p>
              <small>Cadastrada em {registeredOn}</small>
            </div>
            <button
              type="button"
              className="pz-button pz-button--outline wide"
              onClick={() => navigate(`/zilla/${pet.id}/respostas`)}
            >
              Ver respostas <span aria-hidden="true">→</span>
            </button>
          </section>

          <button
            type="button"
            className="pz-button pz-button--text wide add-pet-inline"
            onClick={() => navigate('/anamnese')}
          >
            <span aria-hidden="true">＋</span> Cadastrar outro Monstrinho
          </button>
        </div>
      </main>

      <AppNav />

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
