import { useNavigate } from 'react-router-dom';
import zillaIcon from '../assets/icons/zilla.png';
import { getActivePet } from '../lib/petsStore.js';
import { describePet } from '../lib/petLabel.js';

/**
 * Benefícios da alimentação natural — nova tela entre "Cadastro concluído"
 * (`SucessoScreen`) e a oferta/receita. Decisão de produto (Flay, 2026-09):
 * reforçar por que a AN vale a pena logo depois do cadastro, enquanto o
 * tutor ainda está no pico de engajamento, antes de pedir pra criar a
 * receita (que puxa a assinatura pra quem ainda não assinou).
 *
 * O CTA leva pra `/receita`, não direto pra `/assinatura`: quem já assina
 * (2º, 3º pet em diante) cai direto no wizard sem ver a oferta de novo;
 * quem ainda não assina é redirecionado pra `/assinatura` pelo próprio
 * guard de `ReceitaScreen` — sem duplicar essa lógica aqui.
 */
function benefits(isFemale: boolean, preposition: string, displayName: string) {
  const pronoun = isFemale ? 'dela' : 'dele';
  return [
    {
      title: `Mais anos ao lado ${pronoun}`,
      text: 'Uma dieta natural balanceada é associada a mais longevidade e menos problemas crônicos.',
    },
    {
      title: 'Mais disposição, pelo mais bonito',
      text: 'Ingredientes de verdade nutrem por dentro — dá pra ver no brilho do pelo e na energia pra brincar.',
    },
    {
      title: 'Menos problemas digestivos e alérgicos',
      text: 'Sem ultraprocessados, conservantes ou excesso de sódio: o intestino agradece.',
    },
    {
      title: 'Comida de verdade, na medida certa',
      text: `Cada receita é calculada pro peso, idade e rotina ${preposition} ${displayName} — nunca uma tabela genérica.`,
    },
  ];
}

export function BeneficiosScreen() {
  const navigate = useNavigate();
  const activePet = getActivePet();
  const { isFemale, preposition, displayName } = describePet(activePet);
  const forPet = preposition === 'da' ? 'pra' : 'pro';
  const list = benefits(isFemale, preposition, displayName);

  return (
    <div className="beneficios-view">
      <header className="beneficios-header">
        <span>
          Perfil {preposition} {displayName} · concluído
        </span>
      </header>

      <div className="beneficios-content">
        <div className="beneficios-portrait">
          <img src={zillaIcon} alt="" />
        </div>

        <h1>
          Antes de ir pra cozinha, uma coisa importante {forPet} {displayName}:
        </h1>
        <p>
          Trocar o pote por uma alimentação natural balanceada é uma das decisões que mais impactam a saúde{' '}
          {preposition} {displayName} a longo prazo.
        </p>

        <ul className="paywall-benefits" aria-label="Benefícios da alimentação natural">
          {list.map((b) => (
            <li key={b.title}>
              <span aria-hidden="true">✓</span>
              <p>
                <strong>{b.title}</strong>
                <small>{b.text}</small>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="beneficios-actions">
        <button
          type="button"
          className="pz-button pz-button--primary wide"
          onClick={() => navigate('/receita', { replace: true })}
        >
          Criar minha receita personalizada →
        </button>
        <button
          type="button"
          className="pz-button pz-button--text"
          onClick={() => navigate('/papa', { replace: true })}
        >
          Agora não, quero só olhar
        </button>
      </div>
    </div>
  );
}
