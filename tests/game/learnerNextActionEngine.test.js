import { describe, it, expect } from 'vitest';
import { getLearnerNextAction } from '../../src/game/learnerNextActionEngine';

describe('Learner Next Action Engine - Fallbacks', () => {
  it('retorna estrutura segura de curriculum quando usuario ou jornada forem nulos', () => {
    const action = getLearnerNextAction(null, null);
    expect(action.kind).toBe('curriculum');
    expect(action.path).toBe('/journey');
    expect(action.cta).toBe('Continuar missão');
  });
});