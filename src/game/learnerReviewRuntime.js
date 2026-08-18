import { getLearnerReviewContinuation } from './learnerReviewQuestEngine.js';

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

export function navigateLearnerReviewContinuation(continuation, locationObject = globalThis?.location) {
  const path = continuation?.path;
  if (!path) throw new Error('Learner review continuation is missing a destination path');
  if (!locationObject || typeof locationObject.assign !== 'function') {
    throw new Error('Learner review continuation requires location.assign()');
  }
  locationObject.assign(path);
}
