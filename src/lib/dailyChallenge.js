import {
  buildDailyChallengeDefinition,
  getDailyChallengeCompletedCount,
  getDailyChallengeStarMultiplier,
  getNextDailyChallengeTarget,
  isDailyChallengeTarget,
} from '../game/dailyChallengeEngine.js';

const CHALLENGE_KEY = 'lexia_daily_challenge_v2';

export function getTodayChallengeKey() {
  return new Date().toISOString().slice(0, 10);
}

function readSavedChallenge() {
  try { return JSON.parse(localStorage.getItem(CHALLENGE_KEY)); } catch { return null; }
}

function writeSavedChallenge(challenge) {
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  return challenge;
}

export function getSavedDailyChallenge() {
  const today = getTodayChallengeKey();
  const saved = readSavedChallenge();
  if (saved?.schema !== 'lexia.daily-challenge.v2' || saved?.date !== today) return null;
  return saved;
}

export function getDailyChallenge(allProgress = []) {
  const saved = getSavedDailyChallenge();
  if (saved) return saved;

  const today = getTodayChallengeKey();
  const definition = buildDailyChallengeDefinition(allProgress, today);
  return writeSavedChallenge({
    ...definition,
    progress: Object.fromEntries(definition.targetKeys.map((key) => [key, false])),
    completed: false,
  });
}

export function updateChallengeProgress(entityKey, success) {
  const saved = getSavedDailyChallenge();
  if (!saved) return null;
  if (!isDailyChallengeTarget(saved, entityKey)) return saved;
  if (!success) return saved;

  saved.progress = { ...saved.progress, [entityKey]: true };
  saved.completed = saved.targetKeys.every((key) => Boolean(saved.progress[key]));
  return writeSavedChallenge(saved);
}

export function getChallengeStarMultiplier(challenge, entityKey) {
  return getDailyChallengeStarMultiplier(challenge, entityKey);
}

export function getChallengeCompletedCount(challenge) {
  return getDailyChallengeCompletedCount(challenge);
}

export function getNextChallengeTarget(challenge) {
  return getNextDailyChallengeTarget(challenge);
}

export function isChallengeTarget(challenge, entityKey) {
  return isDailyChallengeTarget(challenge, entityKey);
}

export function isChallengeCompleted() {
  return getSavedDailyChallenge()?.completed === true;
}
