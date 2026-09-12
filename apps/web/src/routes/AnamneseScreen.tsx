import { type ReactNode, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import addIcon from '../assets/icons/adicionar.png';
import infoIcon from '../assets/icons/info.png';
import { addPet } from '../lib/petsStore.js';

/**
 * Anamnese do Monstrinho — fiel à tela "profile" de `papazilla-prototype`.
 * 20 seções com o texto literal de `Claude outputs/questionario-cadastro-pet.md`:
 * cards de escolha única, pílulas, multi-seleção com opções exclusivas, campos e
 * áreas de texto, painéis condicionais, aviso clínico, revisão e aceite.
 *
 * Fase 0: sem persistência. Ao confirmar, vai para /sucesso.
 * Diferença consciente do protótipo: os campos de texto (nome, peso, etc.) começam
 * vazios — pré-preencher "Mel"/"10" seria dado falso num app real.
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

const DEFAULT_SINGLES: Singles = {
  sex: 'Fêmea',
  neutered: 'Sim',
  goal: 'Melhorar a qualidade da alimentação',
  bodyTop: 'Corpo proporcional, com cintura visível',
  ribs: 'Consigo sentir facilmente',
  belly: 'Levemente recolhida',
  muscleChange: 'Não sei',
  weightChange: 'Ficou praticamente igual',
  previousWeightKnown: 'Não sei',
  activityTime: '40 a 60 minutos',
  activityType: 'Brincadeiras ativas',
  appetite: 'Come normalmente',
  currentFood: 'Ração seca',
  currentMeals: '2',
  currentAmountKnown: 'Não sei',
  treats: '1 a 2 por dia',
  familyFood: 'Às vezes',
  stool: 'Firmes e bem formadas',
  stoolFrequency: '2 vezes por dia',
  pancreatitisHistory: 'Não sei',
  urinaryType: 'Não sei',
  renalStage: 'Não sei',
  medication: 'Não',
  supplementsUse: 'Não',
  lastVet: 'Há menos de 6 meses',
  bloodTests: 'Sim, estavam normais',
  avoidProtein: 'Não',
  intolerance: 'Não',
  avoidVegetable: 'Não',
  cookingMethod: 'Panela com água',
  recipeFormat: 'Os dois',
  preferredMeals: 'Quero que o Papazilla recomende',
};

function defaultMulti(): Multi {
  return {
    muscle: new Set(['Nenhuma dessas mudanças']),
    digestion: new Set(['Nenhuma dessas']),
    health: new Set(['Nenhuma']),
    supplements: new Set(),
    proteins: new Set(['Todas']),
    carbs: new Set(['Tanto faz (escolham por mim)']),
    vegetableFavorites: new Set(['Cenoura']),
  };
}

const HEALTH_COMPLEMENTS = ['Pancreatite', 'Cálculos ou cristais urinários', 'Doença renal'];
const DECIMAL_KEYS = ['weight', 'idealWeight', 'previousWeight', 'currentAmount'];

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
          <Field id="breed" label="Raça" ctx={ctx} />
          <Field id="age" label="Data de nascimento ou idade" ctx={ctx} />
          <Field id="weight" label="Peso atual" ctx={ctx} suffix="kg" />
        </div>
        <Question title="Sexo">
          <Pills name="sex" options={['Macho', 'Fêmea']} ctx={ctx} />
        </Question>
        <Question title="É castrado?">
          <Pills name="neutered" options={['Sim', 'Não']} ctx={ctx} />
        </Question>
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
    intro: 'Olhe por cima, passe as mãos pelas laterais do peito e depois observe a barriga de lado.',
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
    body: (ctx) => (
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
        <Question title="Você sabe quanto ele pesava antes?">
          <Pills name="previousWeightKnown" options={['Sim', 'Não sei']} ctx={ctx} />
          <ConditionalPanel show={ctx.singles.previousWeightKnown === 'Sim'}>
            <Field id="previousWeight" label="Peso anterior" ctx={ctx} suffix="kg" />
          </ConditionalPanel>
        </Question>
      </>
    ),
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
    body: (ctx) => (
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
    ),
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
                  Você informou: <b>{conditions.join(', ')}</b>. O perfil será salvo normalmente. Antes
                  de oferecer uma receita, recomendamos compartilhá-la com o veterinário que acompanha
                  seu cão.
                </span>
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
      const identity = [ctx.inputs.breed, ctx.inputs.age, ctx.inputs.weight ? `${ctx.inputs.weight} kg` : '']
        .filter(Boolean)
        .join(' · ');
      const goal =
        ctx.singles.goal === 'Emagrecer' && ctx.inputs.idealWeight
          ? `Emagrecer · peso ideal ${ctx.inputs.idealWeight} kg`
          : ctx.singles.goal;
      return (
        <>
          <Textarea
            id="finalNotes"
            label="Existe alguma coisa importante sobre seu cão que você acha que deveríamos saber?"
            ctx={ctx}
            placeholder="Escreva aqui, se quiser"
          />
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
  const [step, setStep] = useState(0);
  const [singles, setSingles] = useState<Singles>({ ...DEFAULT_SINGLES });
  const [inputs, setInputs] = useState<Inputs>({});
  const [multi, setMulti] = useState<Multi>(defaultMulti);
  const [consent, setConsent] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const bodyRef = useRef<HTMLDivElement>(null);

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

  const missingIdealWeight =
    step === 1 && singles.goal === 'Emagrecer' && !(inputs.idealWeight ?? '').trim();
  const missingConsent = step === LAST && !consent;
  const nextDisabled = missingIdealWeight || missingConsent;

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

      addPet({
        name,
        sex,
        neutered: singles.neutered ?? '',
        breed: inputs.breed?.trim() || '',
        age: inputs.age?.trim() || '',
        weight: inputs.weight?.trim() || '',
        goal,
        idealWeight: goal === 'Emagrecer' ? inputs.idealWeight?.trim() || '' : '',
        bodyTop: singles.bodyTop ?? '',
        weightChange: singles.weightChange ?? '',
        activityTime: singles.activityTime ?? '',
        activityType: singles.activityType ?? '',
        appetite: singles.appetite ?? '',
        currentMeals: singles.currentMeals ?? '',
        stool: singles.stool ?? '',
        healthConditions,
        medication: singles.medication ?? '',
        medicationName: singles.medication === 'Sim' ? inputs.medicationName?.trim() || '' : '',
        proteins: [...(multi.proteins ?? [])],
        vegetableFavorites: [...(multi.vegetableFavorites ?? [])],
        avoidProteinName: singles.avoidProtein === 'Sim' ? inputs.avoidProteinName?.trim() || '' : '',
        avoidVegetableName:
          singles.avoidVegetable === 'Sim' ? inputs.avoidVegetableName?.trim() || '' : '',
        intoleranceName: singles.intolerance === 'Sim' ? inputs.intoleranceName?.trim() || '' : '',
        cookingMethod: singles.cookingMethod ?? '',
        recipeFormat: singles.recipeFormat ?? '',
      });

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

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Fechar anamnese"
          onClick={() => navigate('/zilla')}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Perfil do Monstrinho</span>
          <strong>
            Etapa {step + 1} de {STEPS.length}
          </strong>
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
          {step === LAST ? 'Confirmar cadastro' : 'Continuar →'}
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
