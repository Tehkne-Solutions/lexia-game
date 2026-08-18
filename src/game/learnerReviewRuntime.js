import { getLearnerReviewContinuation } from './learnerReviewQuestEngine.js';

export const REVIEW_REMAINING_STORAGE_KEY = 'lexia.review.remaining.v1';
const MAX_REVIEW_REMAINING = 106;

function resolveStorage(storage = globalThis?.sessionStorage) {
  return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' && typeof storage.removeItem === 'function'
    ? storage
    : null;
}

function normalizeRemaining(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_REVIEW_REMAINING) return null;
  return parsed;
}

export function getLearnerReviewRemaining(storage = globalThis?.sessionStorage) {
  const target = resolveStorage(storage);
  if (!target) return null;
  try {
    return normalizeRemaining(target.getItem(REVIEW_REMAINING_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setLearnerReviewRemaining(value, storage = globalThis?.sessionStorage) {
  const target = resolveStorage(storage);
  const remaining = normalizeRemaining(value);
  if (!target) return null;
  try {
    if (remaining === null) {
      target.removeItem(REVIEW_REMAINING_STORAGE_KEY);
      return null;
    }
    target.setItem(REVIEW_REMAINING_STORAGE_KEY, String(remaining));
    return remaining;
  } catch {
    return null;
  }
}

export function clearLearnerReviewRemaining(storage = globalThis?.sessionStorage) {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.removeItem(REVIEW_REMAINING_STORAGE_KEY);
  } catch {
    // Display-only snapshot: storage failures must never block canonical navigation.
  }
}

export async function loadLearnerReviewContinuation(progressProvider, options = {}) {
  if (!progressProvider || typeof progressProvider.list !== 'function') {
    throw new Error('Learner review continuation requires a progress provider with list()');
  }
  const allProgress = await progressProvider.list();
  return {
    allProgress: Array.isArray(allProgress) ? allProgress : [],
    continuation: getLearnerReviewContinuation(allProgress, options),
  };
}

export function navigateLearnerReviewContinuation(
  continuation,
  locationObject = globalThis?.location,
  storage = globalThis?.sessionStorage,
) {
  const path = continuation?.path;
  if (!path) throw new Error('Learner review continuation is missing a destination path');
  if (!locationObject || typeof locationObject.assign !== 'function') {
    throw new Error('Learner review continuation requires location.assign()');
  }

  if (continuation?.complete || Number(continuation?.remainingDue || 0) <= 0) {
    clearLearnerReviewRemaining(storage);
  } else {
    setLearnerReviewRemaining(continuation?.remainingDue, storage);
  }

  locationObject.assign(path);
}
