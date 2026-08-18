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

export function calculateMastery(progress) {
  if (!progress || progress.total_attempts === 0) return 0;
  const accuracyScore = (progress.correct_attempts / progress.total_attempts) * 40;
  const stabilityScore = Math.min(progress.stability / 10, 1) * 30;
  const streakScore = Math.min(progress.streak / 5, 1) * 30;
  return Math.round(accuracyScore + stabilityScore + streakScore);
}

/**
 * Smart next letter selection using FSRS priorities:
 * 1. Letters due for review (overdue first)
 * 2. New letters not yet started (introduced gradually)
 * 3. Mix some randomness to avoid pure alphabetical order
 */
export function pickNextLetter(allProgress, currentLetter, alphabet) {
  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.letter] = p; });

  const now = new Date();

  // Priority 1: overdue reviews (due more than 0 days ago)
  const overdue = allProgress
    .filter(p => p.total_attempts > 0 && new Date(p.next_review || 0) <= now && p.letter !== currentLetter)
    .sort((a, b) => new Date(a.next_review) - new Date(b.next_review));

  if (overdue.length > 0) {
    // Pick randomly among top-3 most overdue to add variety
    const pool = overdue.slice(0, Math.min(3, overdue.length));
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked.letter;
  }

  // Priority 2: letters with poor mastery that are due (mastery < 50)
  const struggling = allProgress.filter(p =>
    p.total_attempts > 0 &&
    calculateMastery(p) < 50 &&
    p.letter !== currentLetter
  );
  if (struggling.length > 0) {
    const picked = struggling[Math.floor(Math.random() * Math.min(3, struggling.length))];
    return picked.letter;
  }

  // Priority 3: introduce new letters not yet started
  // Introduce up to 4 new letters at a time (not necessarily in order)
  const startedLetters = new Set(allProgress.filter(p => p.total_attempts > 0).map(p => p.letter));
  const notStarted = alphabet.filter(a => !startedLetters.has(a.letter) && a.letter !== currentLetter);

  if (notStarted.length > 0) {
    // Introduce next 1-2 new letters with slight randomness
    const introPool = notStarted.slice(0, Math.min(2, notStarted.length));
    return introPool[Math.floor(Math.random() * introPool.length)].letter;
  }

  // Priority 4: all letters started — pick a random one weighted by difficulty
  const available = allProgress.filter(p => p.letter !== currentLetter);
  if (available.length === 0) return alphabet[0].letter;
  return available[Math.floor(Math.random() * available.length)].letter;
}