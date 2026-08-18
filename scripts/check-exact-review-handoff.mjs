import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildExactReviewPath,
  buildLearnerReviewQuest,
  getRequestedReviewTarget,
} from '../src/game/learnerReviewQuestEngine.js';

const now = Date.parse('2026-08-18T18:00:00.000Z');
const due = new Date(now - 60 * 60 * 1000).toISOString();
const future = new Date(now + 24 * 60 * 60 * 1000).toISOString();

function record(letter, nextReview = future) {
  return {
    letter,
    total_attempts: 3,
    correct_attempts: 3,
    stability: 8,
    streak: 3,
    stars_earned: 1,
    next_review: nextReview,
  };
}

assert.equal(buildExactReviewPath('/play?review=1', 'Z'), '/play?review=1&reviewTarget=Z');
assert.equal(
  buildExactReviewPath('/play-syllables?mode=complex&review=1', 'SYLC_BRA'),
  '/play-syllables?mode=complex&review=1&reviewTarget=SYLC_BRA',
);
assert.equal(getRequestedReviewTarget('?review=1&reviewTarget=Z'), 'Z');
assert.equal(getRequestedReviewTarget('?mode=complex&review=1&reviewTarget=SYLC_BRA'), 'SYLC_BRA');
assert.equal(getRequestedReviewTarget('?reviewTarget=Z'), null, 'review target is inert outside review mode');

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => record(letter));
letters[25] = record('Z', due);
const simple = Array.from({ length: 20 }, (_, index) => record(`SYL_TEST_${index + 1}`));
const complex = Array.from({ length: 20 }, (_, index) => record(`SYLC_TEST_${index + 1}`));
const words = Array.from({ length: 20 }, (_, index) => record(`WORD_TEST_${index + 1}`));
const sentences = Array.from({ length: 20 }, (_, index) => record(`SENT_TEST_${index + 1}`));
const quest = buildLearnerReviewQuest([...letters, ...simple, ...complex, ...words, ...sentences], { now });
assert.equal(quest.nextEntityKey, 'Z');
assert.equal(quest.nextPath, '/play?review=1&reviewTarget=Z');
assert.equal(quest.nextChapter?.oldestEntityKey, 'Z');
assert.equal(quest.nextChapter?.reviewPath, '/play?review=1&reviewTarget=Z');

const playSource = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
for (const required of [
  "const isReviewMode = urlParams.get('review') === '1'",
  "const requestedReviewTargetKey = isReviewMode ? urlParams.get('reviewTarget') : null",
  'requestedDailyLetter || requestedReviewLetter || getInitialLearningLetter(ALPHABET)',
  '(isReviewMode && requestedReviewLetter)',
  '!isPracticeMode && !isReviewMode && journey.stage === JOURNEY_STAGES.LETTERS',
  'requestedReviewLetter || pickNextLetter(allProgress, currentLetter, ALPHABET)',
  '!isPracticeMode && !isReviewMode && (',
]) {
  assert.ok(playSource.includes(required), `PlayGame exact-review invariant missing: ${required}`);
}

const practiceSource = await readFile(new URL('../src/pages/PracticeHub.jsx', import.meta.url), 'utf8');
assert.ok(practiceSource.includes('reviewChapter.reviewPath'));
assert.ok(!practiceSource.includes('to={reviewChapter.path}'), 'per-chapter review CTA must not drop the exact target');

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Exact review handoff contract'));
assert.ok(ciSource.includes('Exact review browser QA'));

console.log('Lexia M21 Exact Review Handoff contract: PASS (oldest due target encoded, letter mission override retired, exact per-chapter CTA)');
