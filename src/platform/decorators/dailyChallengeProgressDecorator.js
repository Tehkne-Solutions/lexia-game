import {
  getChallengeStarMultiplier,
  getSavedDailyChallenge,
  updateChallengeProgress,
} from '@/lib/dailyChallenge';

function prepareDailyChallengeWrite(data) {
  const entityKey = data?.letter;
  const isCorrect = Number(data?.last_grade || 0) >= 3;
  const challenge = getSavedDailyChallenge();
  const multiplier = isCorrect
    ? getChallengeStarMultiplier(challenge, entityKey)
    : 1;

  if (!entityKey || !isCorrect || multiplier <= 1) {
    return {
      data,
      entityKey,
      isCorrect,
      multiplier: 1,
      shouldCompleteTarget: false,
    };
  }

  return {
    data: {
      ...data,
      stars_earned: Number(data?.stars_earned || 0) + (multiplier - 1),
    },
    entityKey,
    isCorrect,
    multiplier,
    shouldCompleteTarget: true,
  };
}

export function decorateProgressWithDailyChallenge(progress) {
  return {
    ...progress,
    async create(data) {
      const prepared = prepareDailyChallengeWrite(data);
      const result = await progress.create(prepared.data);
      if (prepared.shouldCompleteTarget) {
        updateChallengeProgress(prepared.entityKey, true);
      }
      return result;
    },
    async update(id, data) {
      const prepared = prepareDailyChallengeWrite(data);
      const result = await progress.update(id, prepared.data);
      if (prepared.shouldCompleteTarget) {
        updateChallengeProgress(prepared.entityKey, true);
      }
      return result;
    },
  };
}

export { prepareDailyChallengeWrite };
