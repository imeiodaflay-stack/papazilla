import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  FRIDGE_DAYS, addDays, daysFromGrams, formatKg, getInProgress, stockFornalha, todayIso,
  type PotMode,
} from '../lib/fornalhaStore.js';
import { formatGrams } from '../lib/recipeDisplay.js';
import '../fornalha.css';

/** Montar o estoque: potes por cão, geladeira x freezer, etiquetas. */
export function EstoqueScreen() {
  const navigate = useNavigate();
  const fornalha = getInProgress();
  const [mode, setMode] = useState<PotMode>(fornalha?.potMode ?? 'day');

  if (!fornalha || !fornalha.finalGrams) return <Navigate to="/papa" replace />;

  const days = daysFromGrams(fornalha.finalGrams, fornalha.cookedGramsPerDay);
  const cookDate = fornalha.cookDate ?? todayIso();
  const leftover = Math.max(0, Math.round(fornalha.finalGrams - days * fornalha.cookedGramsPerDay));
  const perPet = fornalha.pets.map((pet) => {
    const potsPerDay = mode === 'meal' ? pet.meals : 1;
    return { pet, pots: days * potsPerDay, size: Math.round(pet.gramsPerDay / potsPerDay), potsPerDay };
  });
  const potsPerDay = perPet.reduce((sum, p) => sum + p.potsPerDay, 0);
  const totalPots = perPet.reduce((sum, p) => sum + p.pots, 0);
  const fridgePots = Math.min(days, FRIDGE_DAYS) * potsPerDay;
  const freezerPots = totalPots - fridgePots;

  function finish() {
    if (!fornalha) return;
    stockFornalha(fornalha.id, { potMode: mode, endDate: addDays(cookDate, Math.max(1, days) - 1) });
    navigate('/papa', { state: { toast: 'Estoque montado. Agora o Papazilla acompanha os dias para você.' } });
  }

  return (
    <div className="fz-kitchen">
      <main className="fz-kitchen__body" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="fz-icon-btn" aria-label="Voltar para Guardar comida" onClick={() => navigate('/papa/cozinha')}>←</button>
          <div className="fz-stack" style={{ gap: '0.2rem' }}>
            <h1 className="fz-h1" style={{ fontSize: '1.6rem' }}>Montar o estoque</h1>
            <p className="fz-kicker">{formatKg(fornalha.finalGrams)} prontos · {days} {days === 1 ? 'dia' : 'dias'} · {fornalha.pets.length} {fornalha.pets.length === 1 ? 'cão' : 'cães'}</p>
          </div>
        </header>

        {days === 0 ? (
          <p className="fz-note fz-note--warn"><span>O peso final não fecha nem um dia de comida para a matilha. Volte e confira o peso.</span></p>
        ) : null}

        <div className="fz-segmented" role="radiogroup" aria-label="Como dividir">
          <button type="button" role="radio" aria-checked={mode === 'day'} onClick={() => setMode('day')}>Pote por dia</button>
          <button type="button" role="radio" aria-checked={mode === 'meal'} onClick={() => setMode('meal')}>Pote por refeição</button>
        </div>

        <div className="fz-tiles">
          {perPet.map(({ pet, pots, size }) => (
            <section key={pet.id} className="fz-pet-tile" aria-label={pet.name}>
              <strong style={{ font: '600 1.25rem/1.1 var(--pz-font-display)' }}>{pet.name}</strong>
              <b>{pots}</b>
              <span className="fz-muted">potes de <strong style={{ color: 'var(--pz-chocolate)' }}>{formatGrams(size)}</strong></span>
            </section>
          ))}
        </div>

        <section className="fz-card fz-card--line fz-stack" style={{ gap: '0.75rem' }} aria-labelledby="fz-onde">
          <h2 id="fz-onde" style={{ margin: 0, font: '700 0.9375rem/1.2 var(--pz-font-support)' }}>Onde guardar os {totalPots} potes</h2>
          <div className="fz-row" style={{ alignItems: 'baseline' }}>
            <span><strong>Geladeira · {fridgePots} potes</strong><br /><small className="fz-muted">Os próximos {Math.min(days, FRIDGE_DAYS)} dias. Na geladeira, no máximo {FRIDGE_DAYS} dias.</small></span>
          </div>
          {freezerPots > 0 ? (
            <div className="fz-row"><span><strong>Freezer · {freezerPots} potes</strong><br /><small className="fz-muted">Do {FRIDGE_DAYS + 1}º dia em diante.</small></span></div>
          ) : null}
          {leftover > 0 ? (
            <p className="fz-muted" style={{ paddingTop: '0.6rem', borderTop: '1px solid var(--pz-border)' }}>Sobram {formatGrams(leftover)}: dá para usar como petisco nos próximos dias.</p>
          ) : null}
        </section>
      </main>

      <footer className="fz-kitchen__foot">
        <button type="button" className="pz-button pz-button--primary wide" disabled={days === 0} onClick={finish}>Acompanhar estoque →</button>
      </footer>

    </div>
  );
}
