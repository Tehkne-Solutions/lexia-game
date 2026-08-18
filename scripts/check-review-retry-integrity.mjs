import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createNewCard,
  getSchedulingGrade,
  isDueOnlyReviewScheduling,
  reviewCard,
} from '../src/lib/fsrs.js';

assert.equal(isDueOnlyReviewScheduling('?review=1'), true);
assert.equal(isDueOnlyReviewScheduling('?review=1&reviewTarget=Z'), true);
assert.equal(isDueOnlyReviewScheduling('?review=1&daily=1&reviewTarget=Z'), false, 'Daily must keep scheduling precedence over Review');
assert.equal(isDueOnlyReviewScheduling('?mode=practice'), false);
assert.equal(isDueOnlyReviewScheduling(''), false);

assert.equal(getSchedulingGrade(1, '?review=1'), 1);
assert.equal(getSchedulingGrade(2, '?review=1'), 1, 'incomplete grade 2 review must remain Again/due');
assert.equal(getSchedulingGrade(3, '?review=1'), 3);
assert.equal(getSchedulingGrade(4, '?review=1'), 4);
assert.equal(getSchedulingGrade(2, '?review=1&daily=1'), 2, 'Daily grade 2 behavior must remain unchanged');
assert.equal(getSchedulingGrade(2, ''), 2, 'campaign grade 2 behavior must remain unchanged');

const originalLocation = globalThis.location;
try {
  globalThis.location = { search: '?review=1&reviewTarget=Z' };
  const reviewedHard = reviewCard(createNewCard(), 2);
  assert.equal(reviewedHard.interval, 0, 'grade 2 must stay immediately due in due-only Review');
  assert.equal(reviewedHard.lastGrade, 1, 'scheduler state uses Again semantics for incomplete review');
  assert.ok(Date.parse(reviewedHard.nextReview) <= Date.now() + 1000, 'review grade 2 must not be scheduled tomorrow');

  globalThis.location = { search: '' };
  const campaignHard = reviewCard(createNewCard(), 2);
  assert.equal(campaignHard.interval, 1, 'campaign Hard remains the existing +1 day behavior');
  assert.equal(campaignHard.lastGrade, 2);
  assert.ok(Date.parse(campaignHard.nextReview) > Date.now() + 20 * 60 * 60 * 1000);

  globalThis.location = { search: '?review=1&daily=1' };
  const dailyHard = reviewCard(createNewCard(), 2);
  assert.equal(dailyHard.interval, 1, 'malformed Daily+Review URL must preserve Daily scheduling behavior');
  assert.equal(dailyHard.lastGrade, 2);
} finally {
  if (originalLocation === undefined) delete globalThis.location;
  else globalThis.location = originalLocation;
}

const playSource = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(playSource.includes('const isCorrect = gradeValue >= 3'), 'UI correctness threshold remains 3+');
assert.ok(playSource.includes('last_grade: gradeValue'), 'raw AI grade must remain persisted for diagnosis even when scheduler normalizes Review');
assert.ok(playSource.includes('const reviewed = reviewCard(card, gradeValue)'), 'letters continue to use the shared FSRS boundary');
assert.ok(playSource.includes('if (isReviewMode && !isDailyMode)'), 'due-only continuation must remain explicit after the write');

const badgeSource = await readFile(new URL('../src/components/game/AiResultBadge.jsx', import.meta.url), 'utf8');
assert.ok(badgeSource.includes("label: 'Quase lá!'"), 'grade 2 remains visibly incomplete to the learner');
assert.ok(badgeSource.includes('grade < 3'), 'incomplete recognition feedback remains aligned with the retry policy');

const fsrsSource = await readFile(new URL('../src/lib/fsrs.js', import.meta.url), 'utf8');
assert.ok(fsrsSource.includes("params.get('review') === '1' && params.get('daily') !== '1'"));
assert.ok(fsrsSource.includes('if (isDueOnlyReviewScheduling(search) && normalized < 3) return 1'));

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Review retry integrity contract'));
assert.ok(ciSource.includes('node scripts/check-review-retry-integrity.mjs'));

console.log('Lexia M24 Review Retry Integrity contract: PASS (grade 2 stays due in Review, raw AI grade preserved, Campaign/Daily unchanged)');
