import { type ReactNode, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import addIcon from '../assets/icons/adicionar.png';
import infoIcon from '../assets/icons/info.png';
import { addPet, getPet, updatePet, type StoredPet } from '../lib/petsStore.js';
import { deriveWeightTendency } from '../lib/weightTendency.js';

/**
 * Anamnese do Monstrinho — fiel à tela "profile" de `papazilla-prototype`.
 * 20 seções com o texto literal de `Claude outputs/questionario-cadastro-pet.md`:
 * cards de escolha única, pílulas, multi-seleção com opções exclusivas, campos e
 * áreas de texto, painéis condicionais, aviso clínico, revisão e aceite.
 *
 * Cadastro (`/anamnese`): sem persistência prévia. Ao confirmar, cria o pet e
 * vai para /sucesso. Diferença consciente do protótipo: os campos de texto
 * (nome, peso, etc.) começam vazios — pré-preencher "Mel"/"10" seria dado
 * falso num app real.
 *
 * Edição (`/zilla/:petId/anamnese`): reabre o mesmo wizard com as respostas
 * hoje persistidas em `petsStore.ts` (ver `buildEditState`). Só os campos que
 * o app de fato grava voltam preenchidos — perguntas cujas respostas não são
 * salvas em `StoredPet` (ex.: mudança de músculo, digestão, carboidratos
 * favoritos) reaparecem no valor padrão, porque a resposta original nunca
 * existiu em lugar nenhum pra recuperar. Ao confirmar, atualiza o pet e volta
 * para "Respostas atuais" com um toast — não passa por /sucesso de novo.
 */

type Singles = Record<string, string>;
type Inputs = Record<string, string>;
type Multi = Record<string, Set<string>>;

const EXCLUSIVE: Record<string, string[]> = {
  muscle: ['Nenhuma dessas mudanças', 'Não sei avaliar'],
  digestion: ['Nenhuma dessas'],
  health: ['Nenhuma'],
  proteins: ['Todas', 'Tanto faz'],
  carbs: ['Tanto faz (escolham por mim)'],
  vegetableFavorites: ['Tanto faz'],
};
const FALLBACK: Record<string, string> = {
  muscle: 'Nenhuma dessas mudanças',
  digestion: 'Nenhuma dessas',
  health: 'Nenhuma',
  proteins: 'Tanto faz',
  carbs: 'Tanto faz (escolham por mim)',
};

/**
 * Sem respostas padrão: cada pergunta começa vazia e a pessoa precisa
 * escolher algo pra poder avançar (ver `isStepComplete`). O spread abaixo
 * fica vazio de propósito — existe só pra manter um único ponto de partida
 * pro estado de "singles" tanto no cadastro novo quanto no fallback de
 * `buildEditState` para campos que o pet não tem salvo.
 */
const DEFAULT_SINGLES: Singles = {};

function defaultMulti(): Multi {
  return {
    muscle: new Set(),
    digestion: new Set(),
    health: new Set(),
    supplements: new Set(),
    proteins: new Set(),
    carbs: new Set(),
    vegetableFavorites: new Set(),
  };
}

/**
 * Reconstrói o estado inicial do wizard a partir de um pet já cadastrado —
 * só com o que `StoredPet` de fato guarda. Ver nota de edição no topo do
 * arquivo sobre as perguntas que não têm resposta persistida pra recuperar.
 */
function buildEditState(pet: StoredPet): { singles: Singles; inputs: Inputs; multi: Multi } {
  const singles: Singles = {
    ...DEFAULT_SINGLES,
    sex: pet.sex,
    neutered: pet.neutered,
    senior: pet.senior,
    lifeStage: pet.lifeStage,
    goal: pet.goal,
    bodyTop: pet.bodyTop,
    weightChange: pet.weightChange,
    activityTime: pet.activityTime,
    activityType: pet.activityType,
    appetite: pet.appetite,
    currentMeals: pet.currentMeals,
    stool: pet.stool,
    medication: pet.medication,
    cookingMethod: pet.cookingMethod,
    recipeFormat: pet.recipeFormat,
    // Pets cadastrados antes de `avoidProtein`/`avoidVegetable`/`intolerance` (o
    // "Sim"/"Não" em si) existirem só têm o texto — infere a partir dele.
    avoidProtein: pet.avoidProtein || (pet.avoidProteinName ? 'Sim' : 'Não'),
    avoidVegetable: pet.avoidVegetable || (pet.avoidVegetableName ? 'Sim' : 'Não'),
    intolerance: pet.intolerance || (pet.intoleranceName ? 'Sim' : 'Não'),
  };
  if (pet.puppyAgeBand) singles.puppyAgeBand = pet.puppyAgeBand;
  if (pet.expectedAdultSize) singles.expectedAdultSize = pet.expectedAdultSize;
  // Pets cadastrados antes de um campo existir não têm essa resposta salva —
  // cai no padrão do spread acima em vez de sobrescrever com vazio.
  if (pet.ribs) singles.ribs = pet.ribs;
  if (pet.belly) singles.belly = pet.belly;
  if (pet.muscleChangeSeverity) singles.muscleChange = pet.muscleChangeSeverity;
  if (pet.previousWeightKnown) singles.previousWeightKnown = pet.previousWeightKnown;
  if (pet.currentFood) singles.currentFood = pet.currentFood;
  if (pet.currentAmountKnown) singles.currentAmountKnown = pet.currentAmountKnown;
  if (pet.treats) singles.treats = pet.treats;
  if (pet.familyFood) singles.familyFood = pet.familyFood;
  if (pet.stoolFrequency) singles.stoolFrequency = pet.stoolFrequency;
  if (pet.pancreatitisHistory) singles.pancreatitisHistory = pet.pancreatitisHistory;
  if (pet.urinaryType) singles.urinaryType = pet.urinaryType;
  if (pet.renalStage) singles.renalStage = pet.renalStage;
  if (pet.supplementsUse) singles.supplementsUse = pet.supplementsUse;
  if (pet.lastVet) singles.lastVet = pet.lastVet;
  if (pet.bloodTests) singles.bloodTests = pet.bloodTests;
  if (pet.preferredMeals) singles.preferredMeals = pet.preferredMeals;
  // Raça virou dropdown (`BREED_OPTIONS`) — pets com uma raça fora da lista
  // (cadastrados quando o campo era texto livre) caem em "Outra" com o
  // texto original preservado em `breedOther`.
  if (pet.breed) singles.breed = BREED_OPTIONS.includes(pet.breed) ? pet.breed : 'Outra';

  const inputs: Inputs = {
    name: pet.name,
    breedOther: BREED_OPTIONS.includes(pet.breed) ? '' : pet.breed,
    age: pet.age,
    weight: pet.weight,
    idealWeight: pet.idealWeight,
    previousWeight: pet.previousWeight,
    currentAmount: pet.currentAmount,
    medicationName: pet.medicationName,
    otherSupplement: pet.otherSupplementName,
    bloodNotes: pet.bloodNotes,
    avoidProteinName: pet.avoidProteinName,
    avoidVegetableName: pet.avoidVegetableName,
    intoleranceName: pet.intoleranceName,
  };

  const multi: Multi = {
    ...defaultMulti(),
    health: pet.healthConditions.length > 0 ? new Set(pet.healthConditions) : new Set(['Nenhuma']),
    muscle: pet.muscleChangeSigns.length > 0 ? new Set(pet.muscleChangeSigns) : new Set(['Nenhuma dessas mudanças']),
    digestion: pet.digestionSigns.length > 0 ? new Set(pet.digestionSigns) : new Set(['Nenhuma dessas']),
    supplements: new Set(pet.currentSupplements),
    proteins: pet.proteins.length > 0 ? new Set(pet.proteins) : new Set(['Todas']),
    vegetableFavorites: pet.vegetableFavorites.length > 0 ? new Set(pet.vegetableFavorites) : new Set(['Cenoura']),
    carbs: pet.carbs.length > 0 ? new Set(pet.carbs) : new Set(['Tanto faz (escolham por mim)']),
  };

  return { singles, inputs, multi };
}

/**
 * Raça (Passo 1) — dropdown em vez de texto livre: melhora a usabilidade
 * (busca nativa do `<select>`) e a manutenção dos dados no banco (valores
 * consistentes em vez de grafias variadas do mesmo nome). As 30 mais comuns
 * no Brasil (ordem de popularidade aproximada, fontes como CBKC/registros de
 * clínicas) + SRD + Outra, que abre um campo de texto livre pra não perder
 * nenhum caso.
 */
const BREED_OPTIONS = [
  'Shih Tzu',
  'Poodle',
  'Lhasa Apso',
  'Yorkshire Terrier',
  'Golden Retriever',
  'Labrador Retriever',
  'Bulldog Francês',
  'Pinscher',
  'Maltês',
  'Pug',
  'Border Collie',
  'Rottweiler',
  'Pastor Alemão',
  'Beagle',
  'Dachshund (Salsicha)',
  'Chihuahua',
  'Cocker Spaniel',
  'Husky Siberiano',
  'Boxer',
  'Dálmata',
  'Akita',
  'Bulldog Inglês',
  'Fox Paulistinha',
  'Spitz Alemão (Lulu da Pomerânia)',
  'Basset Hound',
  'Schnauzer',
  'Bull Terrier',
  'Pit Bull',
  'Dogue Alemão',
  'Chow Chow',
  'SRD (Sem Raça Definida)',
  'Outra',
];

const HEALTH_COMPLEMENTS = ['Pancreatite', 'Cálculos ou cristais urinários', 'Doença renal'];
const DECIMAL_KEYS = ['weight', 'idealWeight', 'previousWeight', 'currentAmount'];

/**
 * Orientação específica por condição — sugestão pro tutor conversar com o
 * veterinário sobre esses pontos, não uma regra que o motor aplica sozinho
 * (o Papazilla não decide dieta terapêutica, ver `escopo-mvp.md`).
 */
const CONDITION_GUIDANCE: Record<string, string> = {
  'Doença renal': 'Tende a pedir menos proteína e mais cautela com vísceras — o veterinário pode ajustar isso com você.',
  'Cálculos ou cristais urinários':
    'Dependendo do tipo de cálculo, alguns vegetais e proteínas devem ser evitados — vale confirmar o tipo com o veterinário antes de montar a receita.',
  Pancreatite: 'Vale ter cautela extra com vísceras muito gordurosas — confirme com o veterinário o que é seguro para esse cão.',
  'Doença hepática': 'Vale ter cautela extra com vísceras muito gordurosas — confirme com o veterinário o que é seguro para esse cão.',
  Diabetes: 'Pede atenção especial aos carboidratos da receita — o veterinário pode orientar a quantidade certa.',
};

const PAPAZILLA_ROLE_NOTE =
  'O Papazilla existe pra simplificar o dia a dia de quem prepara alimentação natural pro cão — as recomendações são baseadas em literatura veterinária e revisadas por profissionais, mas a receita final precisa ser verificada e acompanhada pelo veterinário do seu cão, principalmente se essa for a primeira vez que ele transiciona pra alimentação natural.';

function filled(value: string | undefined): boolean {
  return Boolean((value ?? '').trim());
}

/** Valor final da raça: a opção do dropdown, ou o texto livre quando for "Outra". */
function breedValue(singles: Singles, inputs: Inputs): string {
  return singles.breed === 'Outra' ? (inputs.breedOther ?? '').trim() : singles.breed ?? '';
}

/**
 * Sem resposta padrão pré-marcada (ver `DEFAULT_SINGLES`), então cada passo
 * precisa dizer explicitamente o que conta como "respondido" pra liberar o
 * "Continuar" — índice do array `STEPS`, 0-based, mapeado 1:1 pro eyebrow
 * "N · ..." de cada passo (índice 0 = passo 1, índice 9 = passo 10, etc.).
 * Só cobre as perguntas principais de cada passo (as que alimentam o
 * cálculo ou que o próprio passo pede como obrigatórias); campos de texto
 * puramente complementares (raça, observações sobre exame de sangue etc.)
 * continuam opcionais.
 */
function isStepComplete(
  step: number,
  { singles, inputs, multi, consent }: { singles: Singles; inputs: Inputs; multi: Multi; consent: boolean },
): boolean {
  switch (step) {
    case 0: {
      if (!filled(inputs.name) || !filled(inputs.weight)) return false;
      if (!singles.sex || !singles.neutered || !singles.senior || !singles.lifeStage) return false;
      if (singles.lifeStage === 'Filhote' && (!singles.puppyAgeBand || !singles.expectedAdultSize)) return false;
      return true;
    }
    case 1:
      if (!singles.goal) return false;
      if (singles.goal === 'Emagrecer' && !filled(inputs.idealWeight)) return false;
      return true;
    case 2:
      return Boolean(singles.bodyTop && singles.ribs && singles.belly);
    case 3: {
      if ((multi.muscle?.size ?? 0) === 0) return false;
      const hasChange = [...(multi.muscle ?? [])].some((v) => !(EXCLUSIVE.muscle ?? []).includes(v));
      return !hasChange || Boolean(singles.muscleChange);
    }
    case 4: {
      if (!singles.weightChange || !singles.previousWeightKnown) return false;
      return singles.previousWeightKnown !== 'Sim' || filled(inputs.previousWeight);
    }
    case 5:
      return Boolean(singles.activityTime && singles.activityType);
    case 6:
      return Boolean(singles.appetite);
    case 7: {
      if (!singles.currentFood || !singles.currentMeals || !singles.currentAmountKnown) return false;
      return singles.currentAmountKnown !== 'Sim' || filled(inputs.currentAmount);
    }
    case 8:
      return Boolean(singles.treats && singles.familyFood);
    case 9:
      return Boolean(singles.stool && singles.stoolFrequency && (multi.digestion?.size ?? 0) > 0);
    case 10:
      return (multi.health?.size ?? 0) > 0 && (!multi.health?.has('Outra') || filled(inputs.otherHealth));
    case 11: {
      if (multi.health?.has('Pancreatite') && !singles.pancreatitisHistory) return false;
      if (multi.health?.has('Cálculos ou cristais urinários') && !singles.urinaryType) return false;
      if (multi.health?.has('Doença renal') && !singles.renalStage) return false;
      return true;
    }
    case 12: {
      if (!singles.medication || !singles.supplementsUse) return false;
      if (singles.medication === 'Sim' && !filled(inputs.medicationName)) return false;
      if (singles.supplementsUse === 'Sim') {
        if ((multi.supplements?.size ?? 0) === 0) return false;
        if (multi.supplements?.has('Outro') && !filled(inputs.otherSupplement)) return false;
      }
      return true;
    }
    case 13:
      return Boolean(singles.lastVet && singles.bloodTests);
    case 14: {
      if ((multi.proteins?.size ?? 0) === 0) return false;
      if (!singles.avoidProtein || !singles.intolerance) return false;
      if (singles.avoidProtein === 'Sim' && !filled(inputs.avoidProteinName)) return false;
      if (singles.intolerance === 'Sim' && !filled(inputs.intoleranceName)) return false;
      return true;
    }
    case 15:
      return (multi.carbs?.size ?? 0) > 0;
    case 16:
      return Boolean(singles.avoidVegetable) && (singles.avoidVegetable !== 'Sim' || filled(inputs.avoidVegetableName));
    case 17:
      return Boolean(singles.cookingMethod && singles.recipeFormat);
    case 18:
      return Boolean(singles.preferredMeals);
    case 19:
      return consent;
    default:
      return true;
  }
}

interface Ctx {
  singles: Singles;
  inputs: Inputs;
  multi: Multi;
  consent: boolean;
  setSingle: (key: string, value: string) => void;
  setInput: (key: string, value: string) => void;
  toggleMulti: (key: string, value: string) => void;
  setConsent: (value: boolean) => void;
  goToStep: (index: number) => void;
  toast: (message: string) => void;
}

interface Step {
  eyebrow: string;
  title: string;
  intro: string;
  body: (ctx: Ctx) => ReactNode;
}

/* ---------- controles ---------- */

function SingleCards({
  name,
  options,
  ctx,
  compact,
}: {
  name: string;
  options: string[];
  ctx: Ctx;
  compact?: boolean;
}) {
  return (
    <div className={`option-stack${compact ? ' compact-options' : ''}`}>
      {options.map((option) => {
        const selected = ctx.singles[name] === option;
        return (
          <button
            key={option}
            type="button"
            className={`select-card${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => ctx.setSingle(name, option)}
          >
            <span className="select-card__radio" />
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function Pills({ name, options, ctx }: { name: string; options: string[]; ctx: Ctx }) {
  return (
    <div className="choice-grid">
      {options.map((option) => {
        const selected = ctx.singles[name] === option;
        return (
          <button
            key={option}
            type="button"
            className={`choice-pill${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => ctx.setSingle(name, option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function MultiCards({ name, options, ctx }: { name: string; options: string[]; ctx: Ctx }) {
  return (
    <div className="health-grid">
      {options.map((option) => {
        const selected = ctx.multi[name]?.has(option) ?? false;
        return (
          <button
            key={option}
            type="button"
            className={`check-card${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => ctx.toggleMulti(name, option)}
          >
            <span aria-hidden="true">✓</span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  id,
  label,
  ctx,
  placeholder = '',
  suffix,
}: {
  id: string;
  label: string;
  ctx: Ctx;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="profile-field profile-field--full">
      <span>{label}</span>
      <div className={suffix ? 'input-suffix' : undefined}>
        <input
          data-profile-input={id}
          value={ctx.inputs[id] ?? ''}
          placeholder={placeholder}
          inputMode={DECIMAL_KEYS.includes(id) ? 'decimal' : 'text'}
          autoComplete="off"
          onChange={(e) => ctx.setInput(id, e.target.value)}
        />
        {suffix ? <span>{suffix}</span> : null}
      </div>
    </label>
  );
}

function Select({
  id,
  label,
  ctx,
  options,
  placeholder = 'Selecione',
}: {
  id: string;
  label: string;
  ctx: Ctx;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="profile-field profile-field--full">
      <span>{label}</span>
      <select
        data-profile-input={id}
        value={ctx.singles[id] ?? ''}
        onChange={(e) => ctx.setSingle(id, e.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  id,
  label,
  ctx,
  placeholder = '',
}: {
  id: string;
  label: string;
  ctx: Ctx;
  placeholder?: string;
}) {
  return (
    <label className="profile-textarea">
      <span>{label}</span>
      <textarea
        value={ctx.inputs[id] ?? ''}
        placeholder={placeholder}
        onChange={(e) => ctx.setInput(id, e.target.value)}
      />
    </label>
  );
}

function Question({
  title,
  hint,
  first,
  children,
}: {
  title?: string;
  hint?: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`profile-question${first ? ' profile-question--first' : ''}`}>
      {title ? <h3>{title}</h3> : null}
      {hint ? <p className="profile-question__hint">{hint}</p> : null}
      {children}
    </div>
  );
}

function ConditionalPanel({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return <div className="conditional-panel">{children}</div>;
}

/* ---------- passos ---------- */

const STEPS: Step[] = [
  {
    eyebrow: '1 · Sobre o seu cão',
    title: 'Quem é esse Monstrinho?',
    intro: 'Comece pelas informações que ajudam a gente a reconhecer e calcular o perfil dele.',
    body: (ctx) => (
      <>
        <button type="button" className="photo-picker" onClick={() => ctx.toast('A seleção de foto abrirá a câmera ou a galeria.')}>
          <span>
            <img src={addIcon} alt="" />
          </span>
          <strong>Adicionar uma fotinho</strong>
          <small>Opcional · JPG ou PNG</small>
        </button>
        <div className="form-grid">
          <Field id="name" label="Nome do cão" ctx={ctx} />
          <Field id="age" label="Data de nascimento ou idade" ctx={ctx} />
          <Field id="weight" label="Peso atual" ctx={ctx} suffix="kg" />
        </div>
        <Select id="breed" label="Raça" ctx={ctx} options={BREED_OPTIONS} />
        <ConditionalPanel show={ctx.singles.breed === 'Outra'}>
          <Field id="breedOther" label="Qual raça?" ctx={ctx} />
        </ConditionalPanel>
        <Question title="Sexo">
          <Pills name="sex" options={['Macho', 'Fêmea']} ctx={ctx} />
        </Question>
        <Question title="É castrado?">
          <Pills name="neutered" options={['Sim', 'Não']} ctx={ctx} />
        </Question>
        <Question title="É idoso(a)?">
          <Pills name="senior" options={['Sim', 'Não']} ctx={ctx} />
        </Question>
        <Question title="Fase de vida">
          <Pills name="lifeStage" options={['Adulto', 'Filhote']} ctx={ctx} />
        </Question>
        {ctx.singles.lifeStage === 'Filhote' ? (
          <>
            <Question title="Faixa etária do filhote">
              <SingleCards
                name="puppyAgeBand"
                ctx={ctx}
                compact
                options={['2 a 4 meses', '4 a 6 meses', '6 a 8 meses', '8 a 10 meses', '10 a 18 meses', '18 meses ou mais']}
              />
            </Question>
            <Question title="Porte adulto esperado">
              <SingleCards
                name="expectedAdultSize"
                ctx={ctx}
                compact
                options={[
                  'Pequeno (adulto 5–10kg)',
                  'Médio (adulto 10–25kg)',
                  'Grande (adulto 25–35kg)',
                  'Gigante (adulto 35kg+)',
                ]}
              />
            </Question>
          </>
        ) : null}
      </>
    ),
  },
  {
    eyebrow: '2 · Objetivo',
    title: 'Qual é o principal objetivo da alimentação?',
    intro: 'O que você gostaria de alcançar com a alimentação do seu cão?',
    body: (ctx) => (
      <>
        <SingleCards
          name="goal"
          ctx={ctx}
          options={[
            'Manter o peso atual',
            'Emagrecer',
            'Ganhar peso',
            'Melhorar a qualidade da alimentação',
            'Ajudar a preservar músculos e disposição com a idade',
            'Apoiar uma condição de saúde',
          ]}
        />
        <ConditionalPanel show={ctx.singles.goal === 'Emagrecer'}>
          <Field id="idealWeight" label="Qual é o peso ideal do seu cão?" ctx={ctx} placeholder="Ex.: 8,5" suffix="kg" />
          <p className="profile-question__hint">
            Essa meta será usada como referência para montar o plano de emagrecimento.
          </p>
        </ConditionalPanel>
      </>
    ),
  },
  {
    eyebrow: '3 · Condição corporal',
    title: 'Como está o corpo dele?',
    intro:
      'Olhe por cima, passe as mãos pelas laterais do peito e depois observe a barriga de lado. É essa avaliação — não uma impressão geral — que ajusta a quantidade da receita pra mais ou pra menos.',
    body: (ctx) => (
      <>
        <Question first title="Olhando seu cão de cima, qual opção mais parece com ele?">
          <SingleCards
            name="bodyTop"
            ctx={ctx}
            compact
            options={[
              'Muito magro',
              'Magro',
              'Corpo proporcional, com cintura visível',
              'Um pouco acima do peso',
              'Bem acima do peso',
            ]}
          />
        </Question>
        <Question title="Passe as mãos pelas laterais do peito dele. Como você sente as costelas?">
          <SingleCards
            name="ribs"
            ctx={ctx}
            compact
            options={[
              'Ficam muito aparentes',
              'Consigo sentir facilmente',
              'Consigo sentir, mas há uma camada de gordura',
              'Preciso pressionar para sentir',
              'Quase não consigo sentir',
            ]}
          />
        </Question>
        <Question title="Olhando de lado, como é a barriga?">
          <SingleCards
            name="belly"
            ctx={ctx}
            compact
            options={['Bem recolhida', 'Levemente recolhida', 'Quase reta', 'Arredondada', 'Bem arredondada ou caída']}
          />
        </Question>
      </>
    ),
  },
  {
    eyebrow: '4 · Musculatura',
    title: 'Como está a musculatura?',
    intro: 'Você percebe alguma dessas mudanças no corpo do seu cão? Pode selecionar mais de uma.',
    body: (ctx) => {
      const hasChange = [...(ctx.multi.muscle ?? [])].some((v) => !(EXCLUSIVE.muscle ?? []).includes(v));
      return (
        <>
          <MultiCards
            name="muscle"
            ctx={ctx}
            options={[
              'Laterais da cabeça mais fundas ou cavadas',
              'Coluna mais aparente',
              'Ossos do quadril mais aparentes',
              'Coxas ou patas traseiras mais finas',
              'Parece ter perdido músculos recentemente',
              'Nenhuma dessas mudanças',
              'Não sei avaliar',
            ]}
          />
          {hasChange ? (
            <Question title="Se percebeu alguma mudança, ela parece:">
              <Pills name="muscleChange" options={['Pequena', 'Moderada', 'Bem evidente', 'Não sei']} ctx={ctx} />
            </Question>
          ) : null}
        </>
      );
    },
  },
  {
    eyebrow: '5 · Histórico de peso',
    title: 'O peso mudou recentemente?',
    intro: 'Considere os últimos 3 a 6 meses.',
    body: (ctx) => {
      const goalIsMaintain = ctx.singles.goal === 'Manter o peso atual';
      const gainedALot = ctx.singles.weightChange === 'Aumentou bastante';
      return (
        <>
          <Question first title="Nos últimos 3 a 6 meses, o peso dele:">
            <SingleCards
              name="weightChange"
              ctx={ctx}
              compact
              options={[
                'Ficou praticamente igual',
                'Aumentou um pouco',
                'Aumentou bastante',
                'Diminuiu um pouco',
                'Diminuiu bastante',
                'Não sei',
              ]}
            />
          </Question>
          {goalIsMaintain && gainedALot ? (
            <div className="clinical-warning">
              <img src={infoIcon} alt="" />
              <p>
                <strong>O objetivo escolhido e o histórico de peso não combinam.</strong>
                <span>
                  Você marcou "Manter o peso atual" no Passo 2, mas contou aqui que o peso aumentou
                  bastante nos últimos meses. Se o objetivo real é voltar ao peso de antes, volte ao{' '}
                  <button type="button" className="clinical-warning__link" onClick={() => ctx.goToStep(1)}>
                    Passo 2
                  </button>{' '}
                  e marque "Emagrecer" — assim a receita já sai calculada pra isso.
                </span>
              </p>
            </div>
          ) : null}
          <Question title="Você sabe quanto ele pesava antes?">
            <Pills name="previousWeightKnown" options={['Sim', 'Não sei']} ctx={ctx} />
            <ConditionalPanel show={ctx.singles.previousWeightKnown === 'Sim'}>
              <Field id="previousWeight" label="Peso anterior" ctx={ctx} suffix="kg" />
            </ConditionalPanel>
          </Question>
        </>
      );
    },
  },
  {
    eyebrow: '6 · Atividade',
    title: 'Como é a rotina de atividade?',
    intro: 'Considere a média de uma semana comum.',
    body: (ctx) => (
      <>
        <Question
          first
          title="Em um dia comum, quanto tempo ele passa caminhando, correndo ou brincando ativamente?"
        >
          <SingleCards
            name="activityTime"
            ctx={ctx}
            compact
            options={['Menos de 20 minutos', '20 a 40 minutos', '40 a 60 minutos', '1 a 2 horas', 'Mais de 2 horas']}
          />
        </Question>
        <Question title="Como é essa atividade na maior parte do tempo?">
          <SingleCards
            name="activityType"
            ctx={ctx}
            compact
            options={[
              'Quase nenhuma atividade',
              'Passeios bem tranquilos',
              'Caminhadas',
              'Brincadeiras ativas',
              'Corridas ou atividade intensa',
              'Esporte ou trabalho',
            ]}
          />
        </Question>
      </>
    ),
  },
  {
    eyebrow: '7 · Apetite',
    title: 'Como é a fome?',
    intro: 'Como é o apetite do seu cão?',
    body: (ctx) => {
      const veryHungry =
        ctx.singles.appetite === 'Parece estar sempre com fome' ||
        ctx.singles.appetite === 'Procura ou pede comida o tempo todo';
      const losingWeight =
        ctx.singles.weightChange === 'Diminuiu um pouco' || ctx.singles.weightChange === 'Diminuiu bastante';
      return (
        <>
          <SingleCards
            name="appetite"
            ctx={ctx}
            options={[
              'Come pouco ou é seletivo',
              'Come normalmente',
              'Gosta bastante de comer',
              'Parece estar sempre com fome',
              'Procura ou pede comida o tempo todo',
            ]}
          />
          {veryHungry && losingWeight ? (
            <div className="clinical-warning">
              <img src={infoIcon} alt="" />
              <p>
                <strong>Vale conversar com o veterinário antes de seguir.</strong>
                <span>
                  Fome fora do comum junto com perda de peso pode ser sinal de algo além da alimentação —
                  não é algo pra resolver só aumentando a porção. O perfil será salvo normalmente, mas
                  recomendamos essa conversa antes de trocar a dieta.
                </span>
              </p>
            </div>
          ) : null}
        </>
      );
    },
  },
  {
    eyebrow: '8 · Alimentação atual',
    title: 'Como ele se alimenta hoje?',
    intro: 'Isso ajuda a planejar uma transição mais tranquila.',
    body: (ctx) => (
      <>
        <Question first title="O que ele come atualmente?">
          <SingleCards
            name="currentFood"
            ctx={ctx}
            compact
            options={[
              'Ração seca',
              'Ração úmida',
              'Alimentação natural pronta',
              'Alimentação natural caseira',
              'Mistura de mais de uma opção',
            ]}
          />
        </Question>
        <Question title="Quantas refeições ele faz por dia?">
          <Pills
            name="currentMeals"
            options={['1', '2', '3', '4 ou mais', 'A comida fica disponível o dia inteiro']}
            ctx={ctx}
          />
        </Question>
        <Question title="Você sabe aproximadamente quanto ele come por dia?">
          <Pills name="currentAmountKnown" options={['Sim', 'Não sei']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.currentAmountKnown === 'Sim'}>
            <Field id="currentAmount" label="Quantidade aproximada por dia" ctx={ctx} suffix="g" />
          </ConditionalPanel>
        </Question>
      </>
    ),
  },
  {
    eyebrow: '9 · Petiscos',
    title: 'E os petiscos?',
    intro: 'Eles também fazem parte do que o seu cão consome no dia.',
    body: (ctx) => (
      <>
        <Question first title="Com que frequência ele recebe petiscos?">
          <SingleCards
            name="treats"
            ctx={ctx}
            compact
            options={['Quase nunca', '1 a 2 por dia', '3 a 5 por dia', 'Muitos ao longo do dia', 'Não sei']}
          />
        </Question>
        <Question title="Ele recebe comida da família?">
          <Pills name="familyFood" options={['Nunca', 'Às vezes', 'Frequentemente']} ctx={ctx} />
        </Question>
      </>
    ),
  },
  {
    eyebrow: '10 · Digestão',
    title: 'Como é a digestão?',
    intro: 'Conte como costuma ser a rotina intestinal dele.',
    body: (ctx) => (
      <>
        <Question first title="Como são as fezes normalmente?">
          <SingleCards
            name="stool"
            ctx={ctx}
            compact
            options={['Muito secas e duras', 'Firmes e bem formadas', 'Macias, mas ainda formadas', 'Muito moles', 'Líquidas']}
          />
        </Question>
        <Question title="Com que frequência ele evacua?">
          <Pills
            name="stoolFrequency"
            options={['Menos de 1 vez por dia', '1 vez por dia', '2 vezes por dia', '3 ou mais vezes por dia']}
            ctx={ctx}
          />
        </Question>
        <Question title="Alguma destas situações acontece com frequência?" hint="Pode selecionar mais de uma.">
          <MultiCards
            name="digestion"
            ctx={ctx}
            options={[
              'Muitos gases',
              'Constipação',
              'Vômitos',
              'Regurgitação ou refluxo',
              'Diarreia recorrente',
              'Muco nas fezes',
              'Nenhuma dessas',
            ]}
          />
        </Question>
      </>
    ),
  },
  {
    eyebrow: '11 · Saúde',
    title: 'Saúde',
    intro:
      'Seu cão já foi diagnosticado por um veterinário com alguma destas condições? Pode selecionar mais de uma.',
    body: (ctx) => {
      const conditions = [...(ctx.multi.health ?? [])].filter((c) => c !== 'Nenhuma');
      return (
        <>
          <MultiCards
            name="health"
            ctx={ctx}
            options={[
              'Doença renal',
              'Doença cardíaca',
              'Doença hepática',
              'Pancreatite',
              'Diabetes',
              'Colesterol ou triglicérides elevados',
              'Cálculos ou cristais urinários',
              'Alergia ou intolerância alimentar',
              'Doença gastrointestinal',
              'Artrose ou doença ortopédica',
              'Câncer',
              'Problema hormonal ou endócrino',
              'Outra',
              'Nenhuma',
            ]}
          />
          <ConditionalPanel show={ctx.multi.health?.has('Outra') ?? false}>
            <Field id="otherHealth" label="Se marcou “Outra”, qual?" ctx={ctx} />
          </ConditionalPanel>
          {conditions.length > 0 ? (
            <div className="clinical-warning">
              <img src={infoIcon} alt="" />
              <p>
                <strong>Vale revisar a receita com o veterinário.</strong>
                <span>
                  Você informou: <b>{conditions.join(', ')}</b>. O perfil será salvo normalmente.
                </span>
                {conditions
                  .filter((c) => CONDITION_GUIDANCE[c])
                  .map((c) => (
                    <span key={c}>{CONDITION_GUIDANCE[c]}</span>
                  ))}
                <span>{PAPAZILLA_ROLE_NOTE}</span>
              </p>
            </div>
          ) : null}
        </>
      );
    },
  },
  {
    eyebrow: '12 · Saúde complementar',
    title: 'Perguntas complementares de saúde',
    intro: 'Mostramos apenas o que corresponde às condições informadas.',
    body: (ctx) => (
      <>
        {ctx.multi.health?.has('Pancreatite') ? (
          <Question first title="Se houver histórico de pancreatite — a pancreatite aconteceu:">
            <SingleCards name="pancreatitisHistory" ctx={ctx} compact options={['Uma vez', 'Mais de uma vez', 'Não sei']} />
          </Question>
        ) : null}
        {ctx.multi.health?.has('Cálculos ou cristais urinários') ? (
          <Question first title="Se houver histórico de cálculo ou cristal urinário — você sabe qual era o tipo?">
            <SingleCards
              name="urinaryType"
              ctx={ctx}
              compact
              options={['Estruvita', 'Oxalato', 'Urato', 'Outro', 'Não sei']}
            />
          </Question>
        ) : null}
        {ctx.multi.health?.has('Doença renal') ? (
          <Question first title="Se houver doença renal — seu veterinário já informou o estágio da doença?">
            <Pills name="renalStage" options={['Sim', 'Não', 'Não sei']} ctx={ctx} />
          </Question>
        ) : null}
        <div className="clinical-warning">
          <img src={infoIcon} alt="" />
          <p>
            <strong>Vale revisar a receita com o veterinário.</strong>
            <span>{PAPAZILLA_ROLE_NOTE}</span>
          </p>
        </div>
      </>
    ),
  },
  {
    eyebrow: '13 · Medicamentos',
    title: 'Medicamentos e suplementos',
    intro: 'Registre somente o que ele usa atualmente.',
    body: (ctx) => (
      <>
        <Question first title="Seu cão usa algum medicamento continuamente?">
          <Pills name="medication" options={['Não', 'Sim']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.medication === 'Sim'}>
            <Field id="medicationName" label="Qual medicamento?" ctx={ctx} />
          </ConditionalPanel>
        </Question>
        <Question title="Ele usa algum suplemento?">
          <Pills name="supplementsUse" options={['Não', 'Sim']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.supplementsUse === 'Sim'}>
            <p className="profile-question__hint">Selecione todos os que ele usa.</p>
            <MultiCards
              name="supplements"
              ctx={ctx}
              options={['Ômega-3', 'Suplemento vitamínico e mineral', 'Suplemento articular', 'Probiótico', 'Outro']}
            />
            <ConditionalPanel show={ctx.multi.supplements?.has('Outro') ?? false}>
              <Field id="otherSupplement" label="Qual outro suplemento?" ctx={ctx} />
            </ConditionalPanel>
          </ConditionalPanel>
        </Question>
        <div className="shared-recipe-note">
          <img src={infoIcon} alt="" />
          <p>
            <strong>Suplementação não é opcional na alimentação natural.</strong>
            Diferente de uma ração industrializada, a AN cozida em casa não vem com vitaminas e minerais
            já balanceados — por isso toda receita do Papazilla inclui um suplemento vitamínico-mineral
            calculado (você escolhe o produto no próximo passo, o da receita). Pular essa parte é o
            principal jeito de uma dieta caseira ficar desbalanceada com o tempo.
          </p>
        </div>
      </>
    ),
  },
  {
    eyebrow: '14 · Veterinário',
    title: 'Acompanhamento veterinário',
    intro:
      'Essas informações ajudam a identificar quando vale revisar a alimentação com o profissional.',
    body: (ctx) => (
      <>
        <Question first title="Quando foi a última consulta veterinária?">
          <SingleCards
            name="lastVet"
            ctx={ctx}
            compact
            options={['Há menos de 6 meses', 'Entre 6 e 12 meses', 'Há mais de 1 ano', 'Nunca ou não lembro']}
          />
        </Question>
        <Question title="Seu cão fez exames de sangue nos últimos 12 meses?">
          <SingleCards
            name="bloodTests"
            ctx={ctx}
            compact
            options={['Sim, estavam normais', 'Sim, houve alguma alteração', 'Não', 'Não sei']}
          />
          <ConditionalPanel show={ctx.singles.bloodTests === 'Sim, houve alguma alteração'}>
            <Textarea
              id="bloodNotes"
              label="Se houve alguma alteração e você quiser contar para a gente:"
              ctx={ctx}
              placeholder="Conte somente o que considerar importante"
            />
          </ConditionalPanel>
        </Question>
        <div className="shared-recipe-note">
          <img src={infoIcon} alt="" />
          <p>
            Mesmo com o cão saudável, o check-up veterinário (incluindo peso e exame físico) é recomendado
            pelo menos 1x ao ano — e a cada consulta vale revisar a receita da alimentação natural com o
            veterinário, ajustando o que for preciso.
          </p>
        </div>
      </>
    ),
  },
  {
    eyebrow: '15 · Preferências',
    title: 'Preferências alimentares',
    intro: 'Conte o que costuma funcionar e o que deve ficar fora do potinho.',
    body: (ctx) => (
      <>
        <Question first title="Quais proteínas seu cão come bem?" hint="Pode selecionar mais de uma.">
          <MultiCards
            name="proteins"
            ctx={ctx}
            options={['Frango', 'Carne bovina', 'Carne suína', 'Peixe', 'Ovo', 'Peru', 'Todas', 'Tanto faz']}
          />
        </Question>
        <Question title="Existe alguma proteína que você prefere evitar?">
          <Pills name="avoidProtein" options={['Não', 'Sim']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.avoidProtein === 'Sim'}>
            <Field id="avoidProteinName" label="Qual proteína?" ctx={ctx} />
          </ConditionalPanel>
        </Question>
        <Question title="Existe algum alimento que você sabe que faz mal para ele ou que ele não tolera bem?">
          <Pills name="intolerance" options={['Não', 'Sim']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.intolerance === 'Sim'}>
            <Field id="intoleranceName" label="Qual alimento?" ctx={ctx} />
          </ConditionalPanel>
        </Question>
      </>
    ),
  },
  {
    eyebrow: '16 · Carboidratos',
    title: 'Carboidratos',
    intro: 'Quais carboidratos você gostaria de usar? Pode selecionar mais de uma.',
    body: (ctx) => (
      <MultiCards
        name="carbs"
        ctx={ctx}
        options={['Arroz', 'Batata-doce', 'Batata', 'Mandioca', 'Inhame', 'Aveia', 'Tanto faz (escolham por mim)']}
      />
    ),
  },
  {
    eyebrow: '17 · Vegetais',
    title: 'Vegetais',
    intro: 'Preferências ajudam o Zilla a sugerir combinações mais fáceis para a rotina.',
    body: (ctx) => (
      <>
        <Question first title="Existe algum vegetal que você prefere não usar?">
          <Pills name="avoidVegetable" options={['Não', 'Sim']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.avoidVegetable === 'Sim'}>
            <Field id="avoidVegetableName" label="Qual vegetal?" ctx={ctx} />
          </ConditionalPanel>
        </Question>
        <Question title="Se quiser, selecione alguns favoritos do seu cão:">
          <MultiCards
            name="vegetableFavorites"
            ctx={ctx}
            options={['Abóbora', 'Abobrinha', 'Cenoura', 'Chuchu', 'Brócolis', 'Vagem', 'Outro', 'Tanto faz']}
          />
        </Question>
      </>
    ),
  },
  {
    eyebrow: '18 · Preparo',
    title: 'Preferências de preparo',
    intro: 'Essas respostas viram o padrão sugerido nas próximas receitas.',
    body: (ctx) => (
      <>
        <Question first title="Como você costuma cozinhar?">
          <SingleCards
            name="cookingMethod"
            ctx={ctx}
            compact
            options={['Panela com água', 'Vapor', 'Panela de pressão', 'Forno', 'Air fryer', 'Varia conforme o alimento']}
          />
        </Question>
        <Question title="Como você gostaria de receber sua receita?">
          <SingleCards
            name="recipeFormat"
            ctx={ctx}
            compact
            options={['Quantidade dos alimentos crus', 'Quantidade dos alimentos prontos', 'Os dois']}
          />
        </Question>
      </>
    ),
  },
  {
    eyebrow: '19 · Refeições',
    title: 'Quantas refeições por dia?',
    intro: 'Quantas refeições você prefere oferecer?',
    body: (ctx) => (
      <SingleCards
        name="preferredMeals"
        ctx={ctx}
        options={['1', '2', '3', '4', 'Quero que o Papazilla recomende']}
      />
    ),
  },
  {
    eyebrow: '20 · Observações',
    title: 'Observações finais',
    intro: 'Última etapa. Depois disso, você poderá revisar e atualizar tudo pela área Pets.',
    body: (ctx) => {
      const health = [...(ctx.multi.health ?? [])];
      const identity = [breedValue(ctx.singles, ctx.inputs), ctx.inputs.age, ctx.inputs.weight ? `${ctx.inputs.weight} kg` : '']
        .filter(Boolean)
        .join(' · ');
      const goal =
        ctx.singles.goal === 'Emagrecer' && ctx.inputs.idealWeight
          ? `Emagrecer · peso ideal ${ctx.inputs.idealWeight} kg`
          : ctx.singles.goal;
      return (
        <>
          <div className="profile-review profile-review--compact">
            <div className="profile-review__pet">
              <span>
                <img src={zillaIcon} alt="" />
              </span>
              <div>
                <strong>{ctx.inputs.name || 'Seu Monstrinho'}</strong>
                <small>{identity || 'Dados do cadastro'}</small>
              </div>
              <button type="button" onClick={() => ctx.goToStep(0)}>
                Editar
              </button>
            </div>
            <div className="review-list">
              <span>
                <small>Objetivo</small>
                <strong>{goal}</strong>
              </span>
              <span>
                <small>Atividade</small>
                <strong>
                  {ctx.singles.activityTime} por dia ·{' '}
                  {(ctx.singles.activityType ?? '').toLocaleLowerCase('pt-BR')}
                </strong>
              </span>
              <span>
                <small>Preparo preferido</small>
                <strong>
                  {ctx.singles.cookingMethod} ·{' '}
                  {(ctx.singles.recipeFormat ?? '').toLocaleLowerCase('pt-BR')}
                </strong>
              </span>
              <span>
                <small>Saúde informada</small>
                <strong>{health.includes('Nenhuma') ? 'Nenhuma condição' : health.join(', ')}</strong>
              </span>
            </div>
          </div>
          <label className="consent-card">
            <input
              type="checkbox"
              checked={ctx.consent}
              onChange={(e) => ctx.setConsent(e.target.checked)}
            />
            <span>Li e entendi</span>
            <div>
              <p>
                Importante: o Papazilla é uma ferramenta de apoio à alimentação e não substitui
                consulta, diagnóstico, prescrição clínica ou acompanhamento veterinário.
              </p>
              <p>
                As receitas são criadas com base nas informações fornecidas pelo tutor e em
                referências nutricionais publicadas na literatura veterinária. Cães com doenças,
                sintomas, alterações importantes de peso, uso contínuo de medicamentos ou necessidades
                específicas podem precisar de ajustes individualizados.
              </p>
              <p>Recomendamos compartilhar a receita com o médico-veterinário que acompanha seu cão.</p>
            </div>
          </label>
        </>
      );
    },
  },
];

const LAST = STEPS.length - 1;

export function AnamneseScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { petId } = useParams<{ petId: string }>();
  const editingPet = petId ? getPet(petId) : undefined;
  const isEditing = Boolean(petId);
  const returnToRecipe = !isEditing && (location.state as { returnTo?: string } | null)?.returnTo === 'recipe';
  const editState = useMemo(() => (editingPet ? buildEditState(editingPet) : null), [editingPet]);

  const [step, setStep] = useState(0);
  const [singles, setSingles] = useState<Singles>(() => editState?.singles ?? { ...DEFAULT_SINGLES });
  const [inputs, setInputs] = useState<Inputs>(() => editState?.inputs ?? {});
  const [multi, setMulti] = useState<Multi>(() => editState?.multi ?? defaultMulti());
  const [consent, setConsent] = useState(Boolean(editingPet));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const bodyRef = useRef<HTMLDivElement>(null);

  if (isEditing && !editingPet) return <Navigate to="/zilla" replace />;

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const hasHealthComplements = HEALTH_COMPLEMENTS.some((c) => multi.health?.has(c));

  function goToStep(index: number) {
    setStep(Math.max(0, Math.min(LAST, index)));
    bodyRef.current?.scrollTo({ top: 0 });
  }

  function adjacent(direction: 1 | -1) {
    let target = step + direction;
    if (target === 11 && !hasHealthComplements) target += direction;
    return Math.max(0, Math.min(LAST, target));
  }

  const ctx: Ctx = useMemo(
    () => ({
      singles,
      inputs,
      multi,
      consent,
      setSingle: (key, value) => setSingles((p) => ({ ...p, [key]: value })),
      setInput: (key, value) => setInputs((p) => ({ ...p, [key]: value })),
      toggleMulti: (key, value) =>
        setMulti((prev) => {
          const cur = new Set(prev[key] ?? []);
          const ex = EXCLUSIVE[key] ?? [];
          if (ex.includes(value)) {
            cur.clear();
            cur.add(value);
          } else {
            ex.forEach((e) => cur.delete(e));
            if (cur.has(value)) cur.delete(value);
            else cur.add(value);
            if (cur.size === 0 && FALLBACK[key]) cur.add(FALLBACK[key]);
          }
          return { ...prev, [key]: cur };
        }),
      setConsent,
      goToStep,
      toast,
    }),
    [singles, inputs, multi, consent],
  );

  const nextDisabled = !isStepComplete(step, { singles, inputs, multi, consent });

  const current = STEPS[step]!;

  function onNext() {
    if (step < LAST) goToStep(adjacent(1));
    else {
      const name = inputs.name?.trim() || '';
      const sex = singles.sex ?? '';
      const goal = singles.goal ?? '';
      const healthConditions = [...(multi.health ?? [])]
        .filter((c) => c !== 'Nenhuma')
        .map((c) => (c === 'Outra' && inputs.otherHealth?.trim() ? inputs.otherHealth.trim() : c));
      const bodyTop = singles.bodyTop ?? '';
      const ribs = singles.ribs ?? '';
      const belly = singles.belly ?? '';

      const petPatch = {
        name,
        sex,
        neutered: singles.neutered ?? '',
        senior: singles.senior ?? '',
        lifeStage: singles.lifeStage ?? '',
        puppyAgeBand: singles.lifeStage === 'Filhote' ? singles.puppyAgeBand ?? '' : '',
        expectedAdultSize: singles.lifeStage === 'Filhote' ? singles.expectedAdultSize ?? '' : '',
        weightTendency: deriveWeightTendency(
          bodyTop,
          ribs,
          belly,
          singles.activityTime ?? '',
          singles.activityType ?? '',
        ),
        breed: breedValue(singles, inputs),
        age: inputs.age?.trim() || '',
        weight: inputs.weight?.trim() || '',
        goal,
        idealWeight: goal === 'Emagrecer' ? inputs.idealWeight?.trim() || '' : '',
        bodyTop,
        ribs,
        belly,
        muscleChangeSigns: [...(multi.muscle ?? [])],
        muscleChangeSeverity: singles.muscleChange ?? '',
        weightChange: singles.weightChange ?? '',
        previousWeightKnown: singles.previousWeightKnown ?? '',
        previousWeight: singles.previousWeightKnown === 'Sim' ? inputs.previousWeight?.trim() || '' : '',
        activityTime: singles.activityTime ?? '',
        activityType: singles.activityType ?? '',
        appetite: singles.appetite ?? '',
        currentFood: singles.currentFood ?? '',
        currentMeals: singles.currentMeals ?? '',
        currentAmountKnown: singles.currentAmountKnown ?? '',
        currentAmount: singles.currentAmountKnown === 'Sim' ? inputs.currentAmount?.trim() || '' : '',
        treats: singles.treats ?? '',
        familyFood: singles.familyFood ?? '',
        stool: singles.stool ?? '',
        stoolFrequency: singles.stoolFrequency ?? '',
        digestionSigns: [...(multi.digestion ?? [])],
        pancreatitisHistory: healthConditions.includes('Pancreatite') ? singles.pancreatitisHistory ?? '' : '',
        urinaryType: healthConditions.includes('Cálculos ou cristais urinários') ? singles.urinaryType ?? '' : '',
        renalStage: healthConditions.includes('Doença renal') ? singles.renalStage ?? '' : '',
        healthConditions,
        medication: singles.medication ?? '',
        medicationName: singles.medication === 'Sim' ? inputs.medicationName?.trim() || '' : '',
        supplementsUse: singles.supplementsUse ?? '',
        currentSupplements: singles.supplementsUse === 'Sim' ? [...(multi.supplements ?? [])] : [],
        otherSupplementName:
          singles.supplementsUse === 'Sim' && multi.supplements?.has('Outro')
            ? inputs.otherSupplement?.trim() || ''
            : '',
        lastVet: singles.lastVet ?? '',
        bloodTests: singles.bloodTests ?? '',
        bloodNotes: singles.bloodTests === 'Sim, houve alguma alteração' ? inputs.bloodNotes?.trim() || '' : '',
        avoidProtein: singles.avoidProtein ?? '',
        proteins: [...(multi.proteins ?? [])],
        vegetableFavorites: [...(multi.vegetableFavorites ?? [])],
        carbs: [...(multi.carbs ?? [])],
        avoidProteinName: singles.avoidProtein === 'Sim' ? inputs.avoidProteinName?.trim() || '' : '',
        avoidVegetable: singles.avoidVegetable ?? '',
        avoidVegetableName:
          singles.avoidVegetable === 'Sim' ? inputs.avoidVegetableName?.trim() || '' : '',
        intolerance: singles.intolerance ?? '',
        intoleranceName: singles.intolerance === 'Sim' ? inputs.intoleranceName?.trim() || '' : '',
        cookingMethod: singles.cookingMethod ?? '',
        recipeFormat: singles.recipeFormat ?? '',
        preferredMeals: singles.preferredMeals ?? '',
      };

      if (editingPet) {
        updatePet(editingPet.id, petPatch);
        navigate(`/zilla/${editingPet.id}/respostas`, {
          replace: true,
          state: { toast: 'Respostas da anamnese atualizadas.' },
        });
      } else if (returnToRecipe) {
        addPet(petPatch);
        navigate('/receita', {
          replace: true,
          state: { toast: `${name || 'Novo Monstrinho'} cadastrado! Ele já está disponível para esta receita.` },
        });
      } else {
        addPet(petPatch);
        navigate('/sucesso', {
          replace: true,
          state: {
            name,
            sex,
            weight: inputs.weight?.trim() || '',
            goal,
            activityTime: singles.activityTime,
          },
        });
      }
    }
  }

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Fechar anamnese"
          onClick={() => navigate(editingPet ? `/zilla/${editingPet.id}/respostas` : returnToRecipe ? '/receita' : '/zilla')}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Perfil do Monstrinho</span>
        </div>
        <span className="flow-header__avatar">
          <img src={zillaIcon} alt="" />
        </span>
      </header>

      <div className="flow-progress">
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="flow-body" ref={bodyRef}>
        <div className="flow-intro">
          <p className="eyebrow">{current.eyebrow}</p>
          <h1>{current.title}</h1>
          <p>{current.intro}</p>
        </div>
        {current.body(ctx)}
      </div>

      <footer className="flow-footer">
        <button
          type="button"
          className="pz-button pz-button--outline"
          disabled={step === 0}
          onClick={() => goToStep(adjacent(-1))}
        >
          Voltar
        </button>
        <button
          type="button"
          className="pz-button pz-button--primary"
          disabled={nextDisabled}
          onClick={onNext}
        >
          {step === LAST ? (editingPet ? 'Salvar alterações' : 'Confirmar cadastro') : 'Continuar →'}
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
