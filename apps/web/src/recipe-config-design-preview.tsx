import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@papazilla/design-system/tokens.css';
import '@papazilla/design-system/reset.css';
import './recipe-config-design-preview.css';
import calculatorIcon from './assets/icons/calculator.webp';
import infoIcon from './assets/icons/info.png';
import potinhoIcon from './assets/icons/potinho.png';
import receitaIcon from './assets/icons/receita.png';
import snackImage from './assets/originals/snack-pa-pum.jpeg';
import mealImage from './assets/originals/basico-brasileiro.jpg';
import mochaPhoto from './assets/preview/mocha.webp';
import chloePhoto from './assets/preview/chloe.webp';
import mochiPhoto from './assets/preview/mochi.webp';

type ScreenKind = 'meal' | 'treat' | 'custom';
type PackSize = 'one' | 'many';

const pets = [
  { name: 'Mocha', photo: mochaPhoto, detail: '11 kg · Emagrecer', daily: '480 g por dia · 2 refeições' },
  { name: 'Chloe', photo: chloePhoto, detail: '1,9 kg · Emagrecer', daily: '118 g por dia · 2 refeições' },
  { name: 'Mochi', photo: mochiPhoto, detail: '1 kg · Ganhar peso', daily: '92 g por dia · 3 refeições' },
];

function PetPicker({ packSize, mode = 'meal' }: { packSize: PackSize; mode?: 'meal' | 'treat' }) {
  const visiblePets = packSize === 'one' ? pets.slice(0, 1) : pets;

  if (packSize === 'one') {
    const pet = visiblePets[0]!;
    return (
      <div className="cfg-pet-single">
        <img src={pet.photo} alt={`Foto de ${pet.name}`} />
        <div>
          <span className="cfg-selected-pill">✓ Selecionada</span>
          <strong>{pet.name}</strong>
          <small>{pet.detail}</small>
          <b>{mode === 'treat' ? 'Limite calculado por perfil' : pet.daily}</b>
        </div>
      </div>
    );
  }

  return (
    <div className="cfg-pet-grid">
      {visiblePets.map((pet) => (
        <button className="cfg-pet-tile is-selected" type="button" key={pet.name}>
          <img src={pet.photo} alt={`Foto de ${pet.name}`} />
          <span className="cfg-pet-check">✓</span>
          <span className="cfg-pet-tile__label"><strong>{pet.name}</strong><small>{pet.detail}</small></span>
        </button>
      ))}
    </div>
  );
}

function DaysPicker({ treat = false }: { treat?: boolean }) {
  const options = treat ? [7, 15, 30] : [1, 3, 7];
  return (
    <>
      <div className="cfg-days">
        {options.map((day, index) => (
          <button type="button" className={index === (treat ? 1 : 2) ? 'is-selected' : ''} key={day}>
            <strong>{day}</strong><span>{day === 1 ? 'dia' : 'dias'}</span>
          </button>
        ))}
      </div>
      <label className="cfg-custom-days">
        <span><strong>Outro período</strong><small>De 1 a 30 dias</small></span>
        <span className="cfg-custom-days__field"><input type="number" placeholder="Ex.: 10" /><b>dias</b></span>
      </label>
    </>
  );
}

function OriginalHero({ kind }: { kind: 'meal' | 'treat' }) {
  const isTreat = kind === 'treat';
  return (
    <article className="cfg-original-hero">
      <img src={isTreat ? snackImage : mealImage} alt="" />
      <div>
        <span>PAPAZILLA ORIGINAL</span>
        <h2>{isTreat ? 'Snack Pá-pum' : 'Básico Brasileiro'}</h2>
        <p>{isTreat ? 'Proteico e com 2 ingredientes' : 'Comida de verdade com ingredientes do dia a dia'}</p>
      </div>
    </article>
  );
}

function Header({ kind }: { kind: ScreenKind }) {
  const label = kind === 'custom' ? 'Receita personalizada' : 'Papazilla Originals';
  return (
    <>
      <header className="cfg-header">
        <button type="button" aria-label="Voltar">←</button>
        <div><span>{label}</span><strong>Configurar receita</strong></div>
        <span className="cfg-header__icon"><img src={kind === 'custom' ? potinhoIcon : receitaIcon} alt="" /></span>
      </header>
      <div className="cfg-progress"><span style={{ width: kind === 'custom' ? '11%' : '50%' }} /></div>
    </>
  );
}

function MealScreen({ packSize }: { packSize: PackSize }) {
  return (
    <ScreenFrame kind="meal" primary="Calcular receita →">
      <OriginalHero kind="meal" />
      <section className="cfg-section">
        <div className="cfg-section-title"><span>1</span><div><h1>Para quem vamos cozinhar?</h1><p>A base pode ser preparada junta. As porções continuam individuais.</p></div></div>
        <PetPicker packSize={packSize} />
      </section>
      <section className="cfg-section">
        <div className="cfg-section-title"><span>2</span><div><h2>Quantos dias de comida?</h2><p>Vamos multiplicar a receita na medida da sua fornalha.</p></div></div>
        <DaysPicker />
      </section>
      <section className="cfg-section">
        <div className="cfg-section-title"><span>3</span><div><h2>Refeições por dia</h2><p>Usamos o perfil de cada pet e separamos tudo na receita pronta.</p></div></div>
        <div className="cfg-profile-list">
          {(packSize === 'one' ? pets.slice(0, 1) : pets).map((pet, index) => (
            <div key={pet.name}><img src={pet.photo} alt="" /><span><strong>{pet.name}</strong><small>{index === 2 ? '3 refeições por dia' : '2 refeições por dia'}</small></span><button type="button">Alterar</button></div>
          ))}
        </div>
      </section>
      <div className="cfg-note cfg-note--blue"><img src={calculatorIcon} alt="" /><p><strong>Cada focinho, uma medida</strong>{packSize === 'one' ? 'O cálculo da Mocha usa o peso ideal de 9 kg porque o objetivo é emagrecer.' : 'A receita pronta separa a quantidade diária e cada refeição de Mocha, Chloe e Mochi.'}</p></div>
    </ScreenFrame>
  );
}

function TreatScreen({ packSize }: { packSize: PackSize }) {
  return (
    <ScreenFrame kind="treat" primary="Calcular petiscos →">
      <OriginalHero kind="treat" />
      <section className="cfg-section">
        <div className="cfg-section-title"><span>1</span><div><h1>Para quem são os petiscos?</h1><p>O limite diário será calculado para cada Monstrinho.</p></div></div>
        <PetPicker packSize={packSize} mode="treat" />
      </section>
      <section className="cfg-section">
        <div className="cfg-section-title"><span>2</span><div><h2>Para quantos dias?</h2><p>Escolha o tamanho do lote que quer preparar.</p></div></div>
        <DaysPicker treat />
      </section>
      <section className="cfg-section">
        <div className="cfg-section-title"><span>3</span><div><h2>Limite recomendado</h2><p>Petisco complementa a rotina e não substitui uma refeição.</p></div></div>
        <div className="cfg-treat-limits">
          {(packSize === 'one' ? pets.slice(0, 1) : pets).map((pet, index) => (
            <div key={pet.name}><img src={pet.photo} alt="" /><span><strong>{pet.name}</strong><small>{index === 0 ? 'até 2 unidades por dia' : 'até 1 unidade por dia'}</small></span></div>
          ))}
        </div>
      </section>
      <div className="cfg-note cfg-note--green"><img src={infoIcon} alt="" /><p><strong>“Por dia” é um limite</strong>Na receita pronta, você verá o rendimento, o tamanho de cada unidade e quanto oferecer a cada pet.</p></div>
    </ScreenFrame>
  );
}

function CustomScreen({ packSize }: { packSize: PackSize }) {
  return (
    <ScreenFrame kind="custom" primary="Continuar →">
      <div className="cfg-custom-intro">
        <span>PASSO 1 DE 9 · A MATILHA À MESA</span>
        <h1>Para quem vamos cozinhar?</h1>
        <p>Escolha um ou mais Monstrinhos. A base pode ser preparada junta; porções e finalizadores continuam individuais.</p>
      </div>
      <PetPicker packSize={packSize} />
      <div className="cfg-note cfg-note--blue"><img src={infoIcon} alt="" /><p><strong>{packSize === 'one' ? 'Uma receita para Mocha' : 'Uma base, porções separadas'}</strong>{packSize === 'one' ? 'Você também pode incluir outro Monstrinho nesta fornalha.' : 'Vamos somar os ingredientes e marcar quanto pertence a Mocha, Chloe e Mochi.'}</p></div>
      <button type="button" className="cfg-add-pet"><span>＋</span><div><strong>Cadastrar outro Monstrinho</strong><small>Ele aparecerá aqui nas próximas receitas</small></div></button>
    </ScreenFrame>
  );
}

function ScreenFrame({ kind, primary, children }: { kind: ScreenKind; primary: string; children: React.ReactNode }) {
  return (
    <main className="cfg-phone">
      <Header kind={kind} />
      <div className="cfg-body">{children}</div>
      <footer className="cfg-footer"><button type="button" className="cfg-button cfg-button--ghost">{kind === 'custom' ? 'Cancelar' : 'Voltar'}</button><button type="button" className="cfg-button cfg-button--primary">{primary}</button></footer>
    </main>
  );
}

function Preview() {
  const [kind, setKind] = useState<ScreenKind>('meal');
  const [packSize, setPackSize] = useState<PackSize>('one');
  return (
    <div className="cfg-preview">
      <aside className="cfg-preview-controls">
        <div><span className="cfg-preview-kicker">PAPAZILLA · ESTUDO DE TELA</span><h1>Configurar receita</h1><p>Compare as três experiências e veja como cada uma responde à quantidade de pets cadastrados.</p></div>
        <fieldset><legend>Tipo de receita</legend><div className="cfg-segmented"><button className={kind === 'meal' ? 'is-active' : ''} onClick={() => setKind('meal')}>Original · Refeição</button><button className={kind === 'treat' ? 'is-active' : ''} onClick={() => setKind('treat')}>Original · Petisco</button><button className={kind === 'custom' ? 'is-active' : ''} onClick={() => setKind('custom')}>Personalizada</button></div></fieldset>
        <fieldset><legend>Quantidade de pets</legend><div className="cfg-segmented cfg-segmented--small"><button className={packSize === 'one' ? 'is-active' : ''} onClick={() => setPackSize('one')}>1 pet</button><button className={packSize === 'many' ? 'is-active' : ''} onClick={() => setPackSize('many')}>3 pets</button></div></fieldset>
        <div className="cfg-preview-note"><strong>Decisão aplicada</strong><p>Originals usam uma tela curta. A receita personalizada preserva o wizard e todos os elementos atuais.</p></div>
      </aside>
      <div className="cfg-phone-stage" key={`${kind}-${packSize}`}>
        {kind === 'meal' ? <MealScreen packSize={packSize} /> : kind === 'treat' ? <TreatScreen packSize={packSize} /> : <CustomScreen packSize={packSize} />}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
