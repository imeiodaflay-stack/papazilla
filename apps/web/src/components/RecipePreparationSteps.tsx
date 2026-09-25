import type { DailyPlan } from '@papazilla/nutrition-engine';
import receitaIcon from '../assets/icons/receita.png';
import type { StoredPet } from '../lib/petsStore.js';
import { prepPortionsText } from '../lib/recipeDisplay.js';

/**
 * Modo de preparo genérico (passo a passo de segurança alimentar) — igual
 * pra qualquer combinação de ingredientes, fiel ao protótipo. Compartilhado
 * entre o resultado do wizard (`RecipeResultCard`) e a receita salva
 * (`RecipeDetailScreen`); só o passo 5 ("Divida a fornalha") varia com os
 * pets/dias reais da receita.
 */
export function RecipePreparationSteps({
  petPlans,
  days,
}: {
  petPlans: { pet: StoredPet; plan: DailyPlan }[];
  days: number;
}) {
  return (
    <details className="recipe-preparation">
      <summary>
        <span>
          <img src={receitaIcon} alt="" />
          Modo de preparo
        </span>
        <b aria-hidden="true">⌄</b>
      </summary>
      <div className="recipe-preparation__body">
        <p className="recipe-preparation__intro">
          Passo a passo para esta combinação. Os tempos consideram cortes pequenos e são aproximados.
        </p>
        <ol className="prep-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Organize uma bancada limpa</strong>
              <p>
                Lave as mãos por 20 segundos. Separe tábua e faca usadas na carne crua, não lave o frango e pese todos os
                ingredientes ainda crus.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Faça cortes uniformes</strong>
              <p>
                Corte carnes em cubos de 2–3 cm; vísceras em pedaços de 1,5–2 cm; tubérculos e vegetais em cubos de 1,5–2
                cm. Tamanhos parecidos cozinham por igual.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Cozinhe sem temperos</strong>
              <p>Cozinhe cada grupo separadamente, em água ou no vapor. Não use cebola, alho, molhos ou temperos prontos.</p>
              <p>
                Se cozinhar em água, guarde o caldo: parte das vitaminas B e C migra pra ele. Sirva um pouco à parte ou
                reintegre na porção.
              </p>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>Escorra, espere amornar e misture</strong>
              <p>Desfie ou pique depois de cozido. Misture tudo até os ingredientes ficarem bem distribuídos; não ofereça a comida quente.</p>
            </div>
          </li>
          <li>
            <span>5</span>
            <div>
              <strong>Divida a fornalha</strong>
              <p>{prepPortionsText(petPlans, days)}</p>
            </div>
          </li>
          <li>
            <span>6</span>
            <div>
              <strong>Finalize somente na hora de servir</strong>
              <p>
                Adicione suplemento, óleos e qualquer dose individual indicada à porção já fria ou morna. Não aqueça o
                suplemento (Food Dog ou Nutroplus) nem tempere a receita por conta própria.
              </p>
            </div>
          </li>
          <li>
            <span>7</span>
            <div>
              <strong>Guarde com segurança</strong>
              <p>Refrigere em até 2 horas e use as porções refrigeradas em 3–4 dias. Congele o restante e descongele dentro da geladeira.</p>
            </div>
          </li>
        </ol>
      </div>
    </details>
  );
}
