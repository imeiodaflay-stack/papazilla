import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import sheetIcon from '../assets/icons/sheet.png';
import perfilIcon from '../assets/icons/perfil.png';
import patinhaIcon from '../assets/icons/patinha.png';
import sucessoIcon from '../assets/icons/sucesso.png';
import favoritoIcon from '../assets/icons/favorito.png';
import { getPet } from '../lib/petsStore.js';
import { describePet, joinPt } from '../lib/petLabel.js';

/**
 * Respostas da anamnese — fiel à tela "anamnesis-detail" de `papazilla-prototype`:
 * resumo + grupos em acordeão. Modo leitura de verdade, com as respostas reais
 * salvas pela Anamnese (não os valores fixos do protótipo). "Editar respostas"
 * reabre o wizard de verdade (`AnamneseScreen` em modo edição).
 */
export function AnamnesisDetailScreen() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  const pet = petId ? getPet(petId) : undefined;

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      toast(state.toast);
      navigate('.', { replace: true, state: null });
    }
  }, []);

  if (!pet) return <Navigate to="/zilla" replace />;

  const { displayName } = describePet(pet);
  const registeredOn = new Date(pet.createdAt).toLocaleDateString('pt-BR');
  const conditions = pet.healthConditions.length > 0 ? joinPt(pet.healthConditions) : 'Nenhuma';
  const avoidList = [pet.avoidProteinName, pet.avoidVegetableName, pet.intoleranceName].filter(Boolean);

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para o perfil"
          onClick={() => navigate(`/zilla/${pet.id}`)}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Perfil de {displayName}</span>
          <strong>Respostas atuais</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={sheetIcon} alt="" />
        </span>
      </header>

      <div className="flow-progress">
        <span style={{ width: '100%' }} />
      </div>

      <div className="flow-body anamnesis-detail-body">
        <div className="flow-intro">
          <p className="eyebrow">Perfil em dia</p>
          <h1>Tudo sobre {displayName}</h1>
          <p>
            Estas respostas ajudam a personalizar a experiência e sinalizar quando é importante
            conversar com o veterinário.
          </p>
        </div>

        <div className="answer-summary">
          <span>
            <small>Cadastrada em</small>
            <strong>{registeredOn}</strong>
          </span>
          <span>
            <small>Condição informada</small>
            <strong>{conditions}</strong>
          </span>
        </div>

        <div className="answer-groups">
          <details open>
            <summary>
              <span>
                <img src={perfilIcon} alt="" />
                Corpo e objetivo
              </span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div>
              <p>
                <small>Objetivo</small>
                <strong>{pet.goal || '—'}</strong>
              </p>
              <p>
                <small>Condição corporal</small>
                <strong>{pet.bodyTop || '—'}</strong>
              </p>
              <p>
                <small>Mudança de peso</small>
                <strong>{pet.weightChange || '—'}</strong>
              </p>
            </div>
          </details>

          <details>
            <summary>
              <span>
                <img src={patinhaIcon} alt="" />
                Rotina e alimentação
              </span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div>
              <p>
                <small>Atividade</small>
                <strong>{pet.activityTime ? `${pet.activityTime} por dia` : '—'}</strong>
              </p>
              <p>
                <small>Apetite</small>
                <strong>{pet.appetite || '—'}</strong>
              </p>
              <p>
                <small>Refeições</small>
                <strong>{pet.currentMeals ? `${pet.currentMeals} por dia` : '—'}</strong>
              </p>
            </div>
          </details>

          <details>
            <summary>
              <span>
                <img src={sucessoIcon} alt="" />
                Saúde e digestão
              </span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div>
              <p>
                <small>Condições diagnosticadas</small>
                <strong>{conditions}</strong>
              </p>
              <p>
                <small>Fezes</small>
                <strong>{pet.stool || '—'}</strong>
              </p>
              <p>
                <small>Medicamentos contínuos</small>
                <strong>
                  {pet.medication === 'Sim' ? pet.medicationName || 'Sim' : 'Não'}
                </strong>
              </p>
            </div>
          </details>

          <details>
            <summary>
              <span>
                <img src={favoritoIcon} alt="" />
                Preferências
              </span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div>
              <p>
                <small>Proteínas</small>
                <strong>{pet.proteins.length > 0 ? joinPt(pet.proteins) : '—'}</strong>
              </p>
              <p>
                <small>Favoritos</small>
                <strong>{pet.vegetableFavorites.length > 0 ? joinPt(pet.vegetableFavorites) : '—'}</strong>
              </p>
              <p>
                <small>Evitar</small>
                <strong>{avoidList.length > 0 ? joinPt(avoidList) : 'Nenhum alimento informado'}</strong>
              </p>
            </div>
          </details>
        </div>
      </div>

      <footer className="flow-footer flow-footer--single">
        <button
          type="button"
          className="pz-button pz-button--primary wide"
          onClick={() => navigate(`/zilla/${pet.id}/anamnese`)}
        >
          Editar respostas
        </button>
      </footer>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
