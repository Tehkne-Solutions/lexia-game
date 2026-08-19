import {
  buildDailyChallengeDefinition,
  getDailyChallengeCompletedCount,
  getDailyChallengeStarMultiplier,
  getNextDailyChallengeTarget,
  isDailyChallengeTarget,
} from '../game/dailyChallengeEngine.js';

const CHALLENGE_KEY = 'lexia_daily_challenge_v2';
export const DAILY_CHALLENGE_COMPLETE_PATH = '/?dailyComplete=1';

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

function isDailyRoute(locationObject = globalThis?.location) {
  try {
    return new URLSearchParams(locationObject?.search || '').get('daily') === '1';
  } catch {
    return false;
  }
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

export function navigateDailyChallengeCompletion(
  challenge,
  locationObject = globalThis?.location,
) {
  if (!challenge?.completed || !isDailyRoute(locationObject)) return false;
  if (!locationObject || typeof locationObject.assign !== 'function') return false;
  locationObject.assign(DAILY_CHALLENGE_COMPLETE_PATH);
  return true;
}

export function getNextChallengeTarget(
  challenge,
  locationObject = globalThis?.location,
) {
  const nextTarget = getNextDailyChallengeTarget(challenge);
  if (nextTarget) return nextTarget;
  navigateDailyChallengeCompletion(challenge, locationObject);
  return null;
}

export function isChallengeTarget(challenge, entityKey) {
  return isDailyChallengeTarget(challenge, entityKey);
}

export function isChallengeCompleted() {
  return getSavedDailyChallenge()?.completed === true;
}
