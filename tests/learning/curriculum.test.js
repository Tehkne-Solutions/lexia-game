import { describe, it, expect } from 'vitest';
import {
  CURRICULUM_PHASES,
  CURRICULUM_SEQUENCE,
  getCurriculumOrder,
  getCurriculumMetadata,
  sortByCurriculum,
  getPhaseProgress,
  getCurriculumState,
} from '@/learning/curriculum';
import { calculateMastery } from '@/learning/mastery';

describe('Curriculum Pedagogical Engine', () => {
  it('defines 6 progressive curriculum phases covering all 26 letters', () => {
    expect(CURRICULUM_PHASES).toHaveLength(6);
    expect(CURRICULUM_SEQUENCE).toHaveLength(26);
    expect(new Set(CURRICULUM_SEQUENCE).size).toBe(26);
  });

  it('correctly maps vowels to Phase 1 (foundation-vowels)', () => {
    const vowels = ['I', 'U', 'E', 'A', 'O'];
    vowels.forEach((v) => {
      const meta = getCurriculumMetadata(v);
      expect(meta.curriculumPhase).toBe(1);
      expect(meta.curriculumPhaseId).toBe('foundation-vowels');
    });
  });

  it('orders letters according to curriculum sequence', () => {
    const letters = ['Z', 'A', 'I', 'B'];
    const sorted = sortByCurriculum(letters);
    expect(sorted).toEqual(['I', 'A', 'B', 'Z']);
  });

  it('calculates phase progress and advance readiness based on mastery and attempts', () => {
    const phase1 = CURRICULUM_PHASES[0]; // I, U, E, A, O
    const mockProgress = [
      { letter: 'I', total_attempts: 10, correct_attempts: 10, stability: 10, streak: 5 },
      { letter: 'U', total_attempts: 8, correct_attempts: 8, stability: 10, streak: 5 },
      { letter: 'E', total_attempts: 10, correct_attempts: 10, stability: 10, streak: 5 },
      { letter: 'A', total_attempts: 1, correct_attempts: 0, stability: 0, streak: 0 },
      { letter: 'O', total_attempts: 0, correct_attempts: 0, stability: 0, streak: 0 },
    ];

    const result = getPhaseProgress(mockProgress, phase1, calculateMastery);
    expect(result.phaseId).toBe('foundation-vowels');
    expect(result.attemptedCount).toBe(4);
    expect(result.masteredCount).toBe(3);
    expect(result.readyToAdvance).toBe(true);
  });

  it('computes initial empty state starting on Phase 1 with 5 unlocked letters', () => {
    const state = getCurriculumState([], calculateMastery);
    expect(state.activePhaseIndex).toBe(0);
    expect(state.activePhase.id).toBe('foundation-vowels');
    expect(state.unlockedLetters).toEqual(['I', 'U', 'E', 'A', 'O']);
    expect(state.isComplete).toBe(false);
  });
});

