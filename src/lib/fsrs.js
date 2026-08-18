import { calculateMastery } from '../learning/mastery.js';
import { pickNextLearningLetter } from '../learning/engine.js';

// FSRS v4.5 - Free Spaced Repetition Scheduler
// Simplified implementation for alphabet learning

const DEFAULT_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
};

export function createNewCard() {
  return {
    stability: 0,
    difficulty: 0,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastGrade: 0,
  };
}

// Grade: 1=Again, 2=Hard, 3=Good, 4=Easy
export function reviewCard(card, grade) {
  const now = new Date();
  const w = DEFAULT_PARAMS.w;

  let newStability, newDifficulty, newInterval;

  if (card.repetitions === 0) {
    newStability = w[grade - 1];
    newDifficulty = w[4] - (grade - 3) * w[5];
    newDifficulty = Math.max(1, Math.min(10, newDifficulty));

    if (grade === 1) newInterval = 0;
    else if (grade === 2) newInterval = 1;
    else if (grade === 3) newInterval = 3;
    else newInterval = 5;
  } else {
    const elapsedDays = Math.max(0, (now - new Date(card.nextReview)) / (1000 * 60 * 60 * 24));
    const retrievability = Math.pow(1 + elapsedDays / (9 * card.stability), -1);

    newDifficulty = card.difficulty - w[6] * (grade - 3);
    newDifficulty = Math.max(1, Math.min(10, newDifficulty));

    if (grade === 1) {
      newStability = w[11] * Math.pow(card.stability, -w[12]) * (Math.pow(card.difficulty + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
      newStability = Math.max(0.1, newStability);
      newInterval = 0;
    } else {
      const multiplier = grade === 2 ? w[15] : grade === 3 ? 1 : w[16];
      newStability = card.stability * (1 + Math.exp(w[8]) * (11 - newDifficulty) * Math.pow(card.stability, -w[9]) * (Math.exp((1 - retrievability) * w[10]) - 1) * multiplier);
      newStability = Math.max(0.1, newStability);
      newInterval = Math.round(9 * newStability * (1 / DEFAULT_PARAMS.requestRetention - 1));
      newInterval = Math.max(1, Math.min(365, newInterval));
    }
  }

  const nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    stability: newStability,
    difficulty: newDifficulty,
    interval: newInterval,
    repetitions: card.repetitions + 1,
    nextReview: nextReview.toISOString(),
    lastGrade: grade,
  };
}

export function getLettersDueForReview(progressList) {
  const now = new Date();
  return progressList
    .filter(p => new Date(p.next_review || 0) <= now)
    .sort((a, b) => new Date(a.next_review || 0) - new Date(b.next_review || 0));
}

export { calculateMastery };

// Compatibility API: existing game screens keep calling pickNextLetter while
// the scheduling decision is now delegated to Learning Engine 2.0.
export function pickNextLetter(allProgress, currentLetter, alphabet) {
  return pickNextLearningLetter(allProgress, currentLetter, alphabet);
}
