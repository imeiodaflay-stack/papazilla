/**
 * Ponte entre a anamnese e a entrada do motor nutricional.
 *
 * ATENÇÃO — port fiel + lacunas conhecidas (`auditoria-calculadora-original-vs-app.md`):
 * a calculadora original tem campos estruturados (fase de vida, faixa etária do
 * filhote, porte adulto, tendência a engordar/normal/ativo, castração/idoso/estação)
 * que o questionário atual NÃO coleta da mesma forma. Não há mapeamento aprovado por
 * Flay para derivar `lifeStage`, `puppyAgeBand`, `expectedAdultSize` e `weightTendency`
 * a partir das respostas. Este módulo só preenche o que é inequívoco e devolve a lista
 * de campos que ainda precisam vir do wizard ou de uma decisão de produto.
 *
 * NÃO inventar regras clínicas nem de fase de vida aqui.
 */
import type { DailyPlanInput } from '@papazilla/nutrition-engine';
import type { AnamnesisAnswers } from './anamnesis.js';
import { hasClinicalReviewCondition } from './anamnesis.js';

export type UnresolvedPlanField =
  | 'lifeStage'
  | 'puppyAgeBand'
  | 'expectedAdultSize'
  | 'weightTendency'
  | 'season'
  | 'neutered' // coletado, mas o efeito no motor depende de lifeStage=adult
  | 'senior';

export interface DailyPlanInputDraft {
  /** Campos derivados sem ambiguidade da anamnese. */
  known: Pick<DailyPlanInput, 'currentWeightKg' | 'goal' | 'idealWeightKg' | 'healthConditionsPresent'>;
  /**
   * Campos que precisam ser resolvidos antes de chamar `calculateDailyPlan`:
   * pelo wizard da receita, pelo perfil do pet ou por decisão de produto.
   */
  unresolved: UnresolvedPlanField[];
}

export function draftDailyPlanInput(answers: AnamnesisAnswers): DailyPlanInputDraft {
  const known: DailyPlanInputDraft['known'] = {
    currentWeightKg: answers.currentWeightKg,
    goal: answers.goal,
    healthConditionsPresent: hasClinicalReviewCondition(answers.healthConditions),
  };
  if (answers.goal === 'lose' && typeof answers.idealWeightKg === 'number') {
    known.idealWeightKg = answers.idealWeightKg;
  }

  return {
    known,
    unresolved: [
      'lifeStage',
      'puppyAgeBand',
      'expectedAdultSize',
      'weightTendency',
      'season',
      'neutered',
      'senior',
    ],
  };
}
