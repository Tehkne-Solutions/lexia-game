// Shared mastery score used by curriculum progression, game stats and FSRS scheduling.
export function calculateMastery(progress) {
  if (!progress || (progress.total_attempts || 0) === 0) return 0;

  const totalAttempts = progress.total_attempts || 0;
  const correctAttempts = progress.correct_attempts || 0;
  const accuracyScore = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 40 : 0;
  const stabilityScore = Math.min((progress.stability || 0) / 10, 1) * 30;
  const streakScore = Math.min((progress.streak || 0) / 5, 1) * 30;

  return Math.round(accuracyScore + stabilityScore + streakScore);
}
