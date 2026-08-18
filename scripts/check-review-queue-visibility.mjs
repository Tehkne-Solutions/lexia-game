import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  REVIEW_REMAINING_STORAGE_KEY,
  clearLearnerReviewRemaining,
  getLearnerReviewRemaining,
  navigateLearnerReviewContinuation,
  setLearnerReviewRemaining,
} from '../src/game/learnerReviewRuntime.js';
import { buildExactReviewPath } from '../src/game/learnerReviewQuestEngine.js';

function createStorage() {
  const memory = new Map();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    memory,
  };
}

const storage = createStorage();
assert.equal(REVIEW_REMAINING_STORAGE_KEY, 'lexia.review.remaining.v1');
assert.equal(getLearnerReviewRemaining(storage), null);
assert.equal(setLearnerReviewRemaining(4, storage), 4);
assert.equal(storage.getItem(REVIEW_REMAINING_STORAGE_KEY), '4');
assert.equal(getLearnerReviewRemaining(storage), 4);
assert.equal(setLearnerReviewRemaining(1, storage), 1);
assert.equal(getLearnerReviewRemaining(storage), 1);

for (const invalid of [0, -1, 107, 1.5, 'abc', null, undefined]) {
  assert.equal(setLearnerReviewRemaining(invalid, storage), null, `invalid remaining count ${String(invalid)} must clear the snapshot`);
  assert.equal(getLearnerReviewRemaining(storage), null);
}

setLearnerReviewRemaining(7, storage);
clearLearnerReviewRemaining(storage);
assert.equal(getLearnerReviewRemaining(storage), null);

let assigned = null;
navigateLearnerReviewContinuation(
  {
    complete: false,
    path: '/play-syllables?mode=words&review=1&reviewTarget=WORD_VACA',
    remainingDue: 3,
    nextEntityKey: 'WORD_VACA',
  },
  { assign: (path) => { assigned = path; } },
  storage,
);
assert.equal(assigned, '/play-syllables?mode=words&review=1&reviewTarget=WORD_VACA');
assert.equal(getLearnerReviewRemaining(storage), 3, 'cross-chapter handoff must cache the fresh canonical remaining count');

navigateLearnerReviewContinuation(
  {
    complete: true,
    path: '/?reviewComplete=1',
    remainingDue: 0,
    nextEntityKey: null,
  },
  { assign: (path) => { assigned = path; } },
  storage,
);
assert.equal(assigned, '/?reviewComplete=1');
assert.equal(getLearnerReviewRemaining(storage), null, 'review completion must clear the display snapshot');

assert.equal(
  buildExactReviewPath('/play?review=1', 'Z'),
  '/play?review=1&reviewTarget=Z',
  'M26 visibility must not change canonical review URLs',
);
assert.equal(
  buildExactReviewPath('/play-syllables?mode=words&review=1', 'WORD_VACA'),
  '/play-syllables?mode=words&review=1&reviewTarget=WORD_VACA',
);

const runtimeSource = await readFile(new URL('../src/game/learnerReviewRuntime.js', import.meta.url), 'utf8');
for (const required of [
  "export const REVIEW_REMAINING_STORAGE_KEY = 'lexia.review.remaining.v1'",
  'setLearnerReviewRemaining(continuation?.remainingDue, storage)',
  'clearLearnerReviewRemaining(storage)',
  'locationObject.assign(path)',
]) {
  assert.ok(runtimeSource.includes(required), `review runtime visibility invariant missing: ${required}`);
}

const barSource = await readFile(new URL('../src/components/game/SessionQuestBar.jsx', import.meta.url), 'utf8');
for (const required of [
  "queryKey: ['childProgress']",
  'buildLearnerReviewQuest(reviewProgress)',
  'getLearnerReviewRemaining()',
  'reviewQuest.totalDue',
  "'Última revisão pronta'",
  '`${remaining} revisões na fila`',
  "reviewRemaining === 1 ? '1 restante' : `${reviewRemaining} restantes`",
]) {
  assert.ok(barSource.includes(required), `review queue banner invariant missing: ${required}`);
}
assert.ok(
  barSource.indexOf('canonicalRemaining ?? storedRemaining') >= 0,
  'live canonical queue must override the display snapshot whenever a due count is available',
);

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Review queue visibility contract'));
assert.ok(ciSource.includes('node scripts/check-review-queue-visibility.mjs'));
assert.ok(ciSource.includes('Review queue visibility browser QA'));

console.log('Lexia M26 Review Queue Visibility contract: PASS (canonical live count + handoff snapshot, URLs unchanged, completion clears cache)');
