import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import { getPet, updatePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';

const GOAL_OPTIONS = [
  'Manter o peso atual',
  'Emagrecer',
  'Ganhar peso',
  'Melhorar a qualidade da alimentação',
  'Ajudar a preservar músculos e disposição com a idade',
  'Apoiar uma condição de saúde',
];

const ACTIVITY_TIME_OPTIONS = ['Menos de 20 minutos', '20 a 40 minutos', '40 a 60 minutos', '1 a 2 horas', 'Mais de 2 horas'];

/**
 * Editar dados principais — fiel à tela "pet-edit" de `papazilla-prototype`,
 * mas de verdade: no protótipo "Salvar alterações" só navegava de volta e
 * mostrava um toast (nada era persistido); aqui grava em `petsStore.ts`.
 *
 * Escopo igual ao protótipo: nome, raça, idade, peso, atividade diária e
 * objetivo — não é o questionário completo (isso é "Editar respostas",
 * outra tela, ainda não fatiada). Foto continua toast (sem câmera real em
 * nenhuma tela do app ainda).
 */
export function PetEditScreen() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const pet = petId ? getPet(petId) : undefined;

  const [name, setName] = useState(pet?.name ?? '');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [age, setAge] = useState(pet?.age ?? '');
  const [weight, setWeight] = useState(pet?.weight ?? '');
  const [idealWeight, setIdealWeight] = useState(pet?.idealWeight ?? '');
  const [activityTime, setActivityTime] = useState(pet?.activityTime ?? '');
  const [goal, setGoal] = useState(pet?.goal ?? '');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  if (!pet) return <Navigate to="/zilla" replace />;

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const missingIdealWeight = goal === 'Emagrecer' && !idealWeight.trim();
  const saveDisabled = !name.trim() || !weight.trim() || missingIdealWeight;

  function save() {
    updatePet(pet!.id, {
      name: name.trim(),
      breed: breed.trim(),
      age: age.trim(),
      weight: weight.trim(),
      idealWeight: goal === 'Emagrecer' ? idealWeight.trim() : '',
      activityTime,
      goal,
    });
    navigate(`/zilla/${pet!.id}`, { state: { toast: 'Dados principais atualizados.' } });
  }

  return (
    <div className="flow-screen pet-edit-view">
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
          <span className="flow-header__eyebrow">Pets</span>
          <strong>Editar dados principais</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={zillaIcon} alt="" />
        </span>
      </header>

      <div className="flow-progress">
        <span style={{ width: '100%' }} />
      </div>

      <div className="flow-body">
        <div className="flow-intro">
          <p className="eyebrow">Perfil de {describePet(pet).displayName}</p>
          <h1>O que mudou por aí?</h1>
          <p>Mantenha esses dados atualizados para que as próximas receitas usem o perfil certo.</p>
        </div>

        <button
          type="button"
          className="pet-photo-editor"
          onClick={() => toast('A câmera ou a galeria será aberta aqui.')}
        >
          <span>
            <img src={zillaIcon} alt="" />
          </span>
          <strong>Alterar foto</strong>
          <small>Opcional</small>
        </button>

        <div className="form-grid">
          <label className="profile-field profile-field--full">
            <span>Nome do cão</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </label>
          <label className="profile-field profile-field--full">
            <span>Raça</span>
            <input value={breed} onChange={(e) => setBreed(e.target.value)} autoComplete="off" />
          </label>
          <label className="profile-field">
            <span>Idade</span>
            <input value={age} onChange={(e) => setAge(e.target.value)} autoComplete="off" />
          </label>
          <label className="profile-field">
            <span>Peso atual</span>
            <div className="input-suffix">
              <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" autoComplete="off" />
              <span>kg</span>
            </div>
          </label>
        </div>

        <div className="question-block">
          <h3>Atividade diária</h3>
          <div className="option-stack compact-options">
            {ACTIVITY_TIME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`select-card${activityTime === option ? ' is-selected' : ''}`}
                onClick={() => setActivityTime(option)}
              >
                <span className="select-card__radio" />
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="question-block">
          <h3>Objetivo atual</h3>
          <div className="option-stack">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`select-card${goal === option ? ' is-selected' : ''}`}
                onClick={() => setGoal(option)}
              >
                <span className="select-card__radio" />
                <span>{option}</span>
              </button>
            ))}
          </div>
          {goal === 'Emagrecer' ? (
            <div className="conditional-panel">
              <label className="profile-field profile-field--full">
                <span>Qual é o peso ideal do seu cão?</span>
                <div className="input-suffix">
                  <input
                    value={idealWeight}
                    onChange={(e) => setIdealWeight(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex.: 8,5"
                    autoComplete="off"
                  />
                  <span>kg</span>
                </div>
              </label>
              <p className="profile-question__hint">Essa meta será usada como referência para montar o plano de emagrecimento.</p>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flow-footer">
        <button type="button" className="pz-button pz-button--outline" onClick={() => navigate(`/zilla/${pet.id}`)}>
          Cancelar
        </button>
        <button type="button" className="pz-button pz-button--primary" disabled={saveDisabled} onClick={save}>
          Salvar alterações
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
