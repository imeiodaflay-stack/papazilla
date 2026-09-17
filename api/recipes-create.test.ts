import { describe, expect, it } from 'vitest';
import { CARBS, PROTEINS, VEGETABLES } from '@papazilla/nutrition-engine';
import { validateBody } from './recipes-create.js';

const petId = '123e4567-e89b-42d3-a456-426614174000';
function validRequest() {
  return {
    petIds: [petId], formulation: 'padrao', supplement: 'food-dog', days: 7,
    format: 'Os dois',
    selection: {
      proteins: [PROTEINS[0]!.id], organs: [], carbs: [CARBS[0]!.id],
      vegetables: [VEGETABLES[0]!.id], herbs: [],
    },
  };
}

describe('entrada da API de receitas', () => {
  it('aceita apenas opções conhecidas e um período válido', () => {
    expect(validateBody(validRequest()).days).toBe(7);
    expect(() => validateBody({ ...validRequest(), days: 31 })).toThrow();
    expect(() => validateBody({ ...validRequest(), formulation: '__proto__' })).toThrow();
  });

  it('não aceita ingredientes forjados ou IDs de pets duplicados', () => {
    expect(() => validateBody({
      ...validRequest(), selection: { ...validRequest().selection, proteins: ['qualquer_coisa'] },
    })).toThrow();
    expect(() => validateBody({ ...validRequest(), petIds: [petId, petId] })).toThrow();
  });
});
