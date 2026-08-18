import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALPHABET } from '../src/lib/alphabetData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../src/lib/syllablesData.js';
import { BASIC_SENTENCES } from '../src/lib/sentencesData.js';
import {
  CANONICAL_REVIEW_TARGETS,
  REVIEW_CHAPTER_IDS,
  getCanonicalReviewChapterId,
  getCanonicalReviewTarget,
  isCanonicalReviewTarget,
} from '../src/game/reviewTargetCatalog.js';
import {
  buildLearnerReviewQuest,
  getLearnerReviewContinuation,
} from '../src/game/learnerReviewQuestEngine.js';

const now = Date.parse('2026-08-18T18:00:00.000Z');
const hour = 60 * 60 * 1000;
const future = new Date(now + 24 * hour).toISOString();
const due = (hoursAgo) => new Date(now - hoursAgo * hour).toISOString();

assert.equal(CANONICAL_REVIEW_TARGETS.length, 106, 'review catalog must cover the exact 106-target literacy journey');
assert.equal(new Set(CANONICAL_REVIEW_TARGETS.map((target) => target.key)).size, 106, 'canonical review keys must be unique');
assert.equal(ALPHABET.length, 26);
assert.equal(BASIC_SYLLABLES.length, 20);
assert.equal(COMPLEX_SYLLABLES.length, 20);
assert.equal(BASIC_WORDS.length, 20);
assert.equal(BASIC_SENTENCES.length, 20);

for (const [key, chapterId] of [
  ['A', REVIEW_CHAPTER_IDS.LETTERS],
  ['Z', REVIEW_CHAPTER_IDS.LETTERS],
  ['SYL_VO', REVIEW_CHAPTER_IDS.SIMPLE_SYLLABLES],
  ['SYLC_TRI', REVIEW_CHAPTER_IDS.COMPLEX_SYLLABLES],
  ['WORD_VACA', REVIEW_CHAPTER_IDS.WORDS],
  ['SENT_20', REVIEW_CHAPTER_IDS.SENTENCES],
]) {
  assert.equal(isCanonicalReviewTarget(key), true, `${key} must be in the canonical review catalog`);
  assert.equal(getCanonicalReviewChapterId(key), chapterId, `${key} must resolve to its canonical chapter`);
  assert.equal(getCanonicalReviewTarget(key)?.key, key);
}

for (const stale of [
  'SYL_TEST_1',
  'SYLC_TEST_1',
  'WORD_TEST_1',
  'SENT_TEST_1',
  'SYL_GHOST',
  'WORD_LEGACY_REMOVED',
  'SENT_99',
  'AA',
  '',
]) {
  assert.equal(isCanonicalReviewTarget(stale), false, `${stale || '<empty>'} must not become a playable review target`);
  assert.equal(getCanonicalReviewChapterId(stale), null);
  assert.equal(getCanonicalReviewTarget(stale), null);
}

function letterRecord(letter, nextReview = future) {
  return {
    letter,
    total_attempts: 5,
    correct_attempts: 5,
    stability: 10,
    difficulty: 3,
    interval: 30,
    repetitions: 5,
    next_review: nextReview,
    streak: 5,
    last_grade: 4,
    stars_earned: 2,
  };
}

function advancedRecord(letter, nextReview = future) {
  return {
    letter,
    total_attempts: 3,
    correct_attempts: 3,
    stability: 6,
    difficulty: 3,
    interval: 14,
    repetitions: 3,
    next_review: nextReview,
    streak: 3,
    last_grade: 4,
    stars_earned: 1,
  };
}

const masteredLetters = ALPHABET.map((item) => letterRecord(item.letter));
const staleOlderThanReal = advancedRecord('SYL_GHOST', due(20));
const realDue = advancedRecord('SYL_VO', due(2));
const stageSyllables = buildLearnerReviewQuest([
  ...masteredLetters,
  staleOlderThanReal,
  realDue,
], { now });

assert.equal(stageSyllables.totalDue, 1, 'stale prefixed progress must be excluded even when it is older than a real due target');
assert.equal(stageSyllables.nextEntityKey, 'SYL_VO');
assert.equal(stageSyllables.nextPath, '/play-syllables?review=1&reviewTarget=SYL_VO');
assert.equal(stageSyllables.chapters.find((chapter) => chapter.id === REVIEW_CHAPTER_IDS.SIMPLE_SYLLABLES)?.dueCount, 1);

const onlyStale = buildLearnerReviewQuest([
  ...masteredLetters,
  advancedRecord('SYL_GHOST', due(5)),
  advancedRecord('SYL_REMOVED', due(4)),
], { now });
assert.equal(onlyStale.totalDue, 0, 'a queue containing only stale targets must be considered empty');
assert.equal(onlyStale.hasDueReviews, false);
assert.equal(onlyStale.nextPath, null);

const continuation = getLearnerReviewContinuation([
  ...masteredLetters,
  advancedRecord('SYL_GHOST', due(5)),
], { now });
assert.equal(continuation.complete, true, 'stale-only progress must not trap a due-only review session');
assert.equal(continuation.path, '/?reviewComplete=1');
assert.equal(continuation.remainingDue, 0);

const catalogSource = await readFile(new URL('../src/game/reviewTargetCatalog.js', import.meta.url), 'utf8');
for (const required of [
  "from '../lib/alphabetData.js'",
  "from '../lib/syllablesData.js'",
  "from '../lib/sentencesData.js'",
  'CANONICAL_REVIEW_TARGETS',
  'REVIEW_TARGET_BY_KEY',
  'getCanonicalReviewChapterId',
]) {
  assert.ok(catalogSource.includes(required), `canonical catalog source missing: ${required}`);
}

const engineSource = await readFile(new URL('../src/game/learnerReviewQuestEngine.js', import.meta.url), 'utf8');
assert.ok(engineSource.includes("import { getCanonicalReviewChapterId } from './reviewTargetCatalog.js'"));
assert.ok(engineSource.includes('return getCanonicalReviewChapterId(record?.letter)'));
for (const retired of [
  "key.startsWith('SYLC_')",
  "key.startsWith('SYL_')",
  "key.startsWith('WORD_')",
  "key.startsWith('SENT_')",
]) {
  assert.ok(!engineSource.includes(retired), `prefix-only queue recognition must remain retired: ${retired}`);
}

const m20Source = await readFile(new URL('../scripts/check-learner-review-quest.mjs', import.meta.url), 'utf8');
assert.ok(m20Source.includes('BASIC_SYLLABLES.map'));
assert.ok(m20Source.includes('COMPLEX_SYLLABLES.map'));
assert.ok(m20Source.includes('BASIC_WORDS.map'));
assert.ok(m20Source.includes('BASIC_SENTENCES.map'));
assert.ok(!m20Source.includes('SYL_TEST_'), 'M20 review fixtures must no longer normalize stale test keys as playable content');

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Canonical review queue contract'));
assert.ok(ciSource.includes('node scripts/check-canonical-review-queue.mjs'));

console.log('Lexia M25 Canonical Review Queue contract: PASS (106 official targets, stale prefixes excluded, stale-only queue cannot trap Review)');
