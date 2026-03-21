// Simplified FSRS implementation for spaced repetition learning
export interface Card {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  last_review?: Date;
}

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export function createEmptyCard(): Card {
  return {
    due: new Date(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 'New',
  };
}

export function fsrs(grade: Grade, card: Card): Card {
  const now = new Date();
  let newCard = { ...card };

  // Update reps and lapses
  newCard.reps += 1;
  if (grade === 1) {
    newCard.lapses += 1;
  }

  // Calculate new difficulty
  if (newCard.state === 'New') {
    newCard.difficulty = Math.max(1, Math.min(10, 7 - (grade - 1) * 2));
  } else {
    const difficulty_delta = (grade - 3) * (0.1 - (grade - 3) * 0.01);
    newCard.difficulty = Math.max(1, Math.min(10, newCard.difficulty + difficulty_delta));
  }

  // Calculate new stability
  if (grade === 1) {
    newCard.stability = Math.max(0.1, newCard.stability * 0.8);
  } else if (grade === 2) {
    newCard.stability = Math.max(0.1, newCard.stability * 0.9);
  } else if (grade === 3) {
    newCard.stability = newCard.stability * (1 + newCard.difficulty * 0.1);
  } else if (grade === 4) {
    newCard.stability = newCard.stability * (1 + newCard.difficulty * 0.15);
  }

  // Ensure minimum stability
  newCard.stability = Math.max(0.1, newCard.stability);

  // Calculate next interval
  if (grade === 1) {
    newCard.scheduled_days = 0.1; // Review soon
  } else if (grade === 2) {
    newCard.scheduled_days = Math.max(1, newCard.stability * 0.8);
  } else if (grade === 3) {
    newCard.scheduled_days = Math.max(1, newCard.stability);
  } else if (grade === 4) {
    newCard.scheduled_days = Math.max(1, newCard.stability * 1.2);
  }

  // Update state
  if (newCard.reps === 1) {
    newCard.state = 'Learning';
  } else if (grade >= 3) {
    newCard.state = 'Review';
  } else {
    newCard.state = 'Relearning';
  }

  // Set due date
  newCard.due = new Date(now.getTime() + newCard.scheduled_days * 24 * 60 * 60 * 1000);
  newCard.last_review = now;

  return newCard;
}

export function getNextReview(card: Card): Date {
  return card.due;
}

export function needsReview(card: Card): boolean {
  return new Date() >= card.due;
}
