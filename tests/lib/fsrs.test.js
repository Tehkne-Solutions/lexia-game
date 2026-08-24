import { describe, it, expect } from 'vitest';
import {
  createNewCard,
  reviewCard,
  getLettersDueForReview,
  calculateMastery,
  getSchedulingGrade,
} from '@/lib/fsrs';

describe('FSRS v4.5 Spaced Repetition Engine', () => {
  it('creates a canonical new card with zero initial values', () => {
    const card = createNewCard();
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.interval).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.lastGrade).toBe(0);
    expect(card.nextReview).toBeDefined();
  });

  it('updates first review with appropriate interval depending on grade', () => {
    const card = createNewCard();

    // Grade 1 (Again) -> interval 0
    const revAgain = reviewCard(card, 1);
    expect(revAgain.interval).toBe(0);
    expect(revAgain.repetitions).toBe(1);

    // Grade 3 (Good) -> interval 3
    const revGood = reviewCard(card, 3);
    expect(revGood.interval).toBe(3);
    expect(revGood.stability).toBeGreaterThan(0);

    // Grade 4 (Easy) -> interval 5
    const revEasy = reviewCard(card, 4);
    expect(revEasy.interval).toBe(5);
    expect(revEasy.stability).toBeGreaterThan(revGood.stability);
  });

  it('schedules subsequent reviews with valid repetitions and positive stability', () => {
    let card = createNewCard();
    card = reviewCard(card, 3);
    expect(card.interval).toBe(3);
    expect(card.repetitions).toBe(1);

    const secondRev = reviewCard(card, 3);
    expect(secondRev.repetitions).toBe(2);
    expect(secondRev.stability).toBeGreaterThan(0);
    expect(secondRev.interval).toBeGreaterThanOrEqual(1);
  });

  it('filters due reviews correctly based on timestamp', () => {
    const past = new Date(Date.now() - 3600 * 1000).toISOString();
    const future = new Date(Date.now() + 3600 * 1000).toISOString();

    const progressList = [
      { letter: 'A', next_review: past },
      { letter: 'B', next_review: future },
      { letter: 'C', next_review: past },
    ];

    const due = getLettersDueForReview(progressList);
    expect(due.map((p) => p.letter)).toEqual(['A', 'C']);
  });

  it('calculates mastery score correctly bounded between 0 and 100', () => {
    expect(calculateMastery(null)).toBe(0);
    expect(calculateMastery({ total_attempts: 0 })).toBe(0);

    const highMastery = calculateMastery({
      total_attempts: 20,
      correct_attempts: 20,
      stability: 10,
      streak: 5,
    });
    expect(highMastery).toBe(100);
  });

  it('handles due-only review scheduling grades safely', () => {
    const normalGrade = getSchedulingGrade(2, '');
    expect(normalGrade).toBe(2);

    const dueOnlyGrade = getSchedulingGrade(2, '?review=1');
    expect(dueOnlyGrade).toBe(1);
  });
});

