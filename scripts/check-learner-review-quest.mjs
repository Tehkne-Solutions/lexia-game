import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildLearnerReviewQuest,
  getLearnerReviewQuestLabel,
  LEARNER_REVIEW_CHAPTERS,
} from '../src/game/learnerReviewQuestEngine.js';
import {
  createSessionQuest,
  isLearnerReviewRuntime,
} from '../src/game/sessionQuestEngine.js';
import { JOURNEY_STAGES } from '../src/game/journeyEngine.js';

const now = Date.parse('2026-08-18T18:00:00.000Z');
const hour = 60 * 60 * 1000;

function letterRecord(letter, nextReview) {
  return {
    letter,
    total_attempts: 3,
    correct_attempts: 3,
    stability: 10,
    streak: 5,
    stars_earned: 1,
    next_review: nextReview,
  };
}

function advancedRecord(key, nextReview) {
  return {
    letter: key,
    total_attempts: 3,
    correct_attempts: 3,
    stability: 4,
    streak: 3,
    stars_earned: 1,
    next_review: nextReview,
  };
}

const future = new Date(now + 24 * hour).toISOString();
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => letterRecord(letter, future));
const simple = Array.from({ length: 20 }, (_, index) => advancedRecord(`SYL_TEST_${index + 1}`, future));
const complex = Array.from({ length: 20 }, (_, index) => advancedRecord(`SYLC_TEST_${index + 1}`, future));
const words = Array.from({ length: 20 }, (_, index) => advancedRecord(`WORD_TEST_${index + 1}`, future));
const sentences = Array.from({ length: 20 }, (_, index) => advancedRecord(`SENT_TEST_${index + 1}`, future));

letters[0].next_review = new Date(now - 5 * hour).toISOString();
simple[0].next_review = new Date(now - 4 * hour).toISOString();
complex[0].next_review = new Date(now - 3 * hour).toISOString();
words[0].next_review = new Date(now - 2 * hour).toISOString();
sentences[0].next_review = new Date(now - hour).toISOString();

const mastered = buildLearnerReviewQuest([
  ...letters,
  ...simple,
  ...complex,
  ...words,
  ...sentences,
], { now });

assert.equal(LEARNER_REVIEW_CHAPTERS.length, 5);
assert.equal(mastered.journeyStage, JOURNEY_STAGES.MASTERY);
assert.equal(mastered.totalDue, 5);
assert.equal(mastered.hasDueReviews, true);
assert.equal(mastered.nextChapter?.id, 'letters', 'oldest due review must win across the whole journey');
assert.equal(mastered.nextPath, '/play?review=1');
assert.equal(mastered.nextEntityKey, 'A');
assert.equal(mastered.chapters.find((chapter) => chapter.id === 'letters').dueCount, 1);
assert.equal(mastered.chapters.find((chapter) => chapter.id === 'syllables-basic').dueCount, 1);
assert.equal(mastered.chapters.find((chapter) => chapter.id === 'syllables-complex').dueCount, 1);
assert.equal(mastered.chapters.find((chapter) => chapter.id === 'words').dueCount, 1);
assert.equal(mastered.chapters.find((chapter) => chapter.id === 'sentences').dueCount, 1);
assert.equal(getLearnerReviewQuestLabel(mastered), '5 revisões prontas');

const lockedAdvanced = buildLearnerReviewQuest([
  letterRecord('A', new Date(now - hour).toISOString()),
  advancedRecord('WORD_LOCKED', new Date(now - 10 * hour).toISOString()),
], { now });
assert.equal(lockedAdvanced.journeyStage, JOURNEY_STAGES.LETTERS);
assert.equal(lockedAdvanced.totalDue, 1, 'due records from locked chapters must stay hidden');
assert.equal(lockedAdvanced.nextEntityKey, 'A');
assert.deepEqual(lockedAdvanced.chapters.map((chapter) => chapter.id), ['letters']);

const noAttempts = buildLearnerReviewQuest([
  {
    letter: 'A',
    total_attempts: 0,
    correct_attempts: 0,
    stability: 0,
    next_review: new Date(now - hour).toISOString(),
  },
], { now });
assert.equal(noAttempts.totalDue, 0, 'unattempted records must never become review quests');
assert.equal(getLearnerReviewQuestLabel(noAttempts), 'Revisões em dia');

assert.equal(isLearnerReviewRuntime('?review=1'), true);
assert.equal(isLearnerReviewRuntime('?mode=complex&review=1'), true);
assert.equal(isLearnerReviewRuntime('?practice=true'), false);
const disabledReviewQuest = createSessionQuest(
  { stage: JOURNEY_STAGES.WORDS, worldId: 'words_basic' },
  { reviewMode: true },
);
assert.equal(disabledReviewQuest.enabled, false, 'review mode must never advance Session Quest');
assert.equal(disabledReviewQuest.goal, 0);

const normalQuest = createSessionQuest(
  { stage: JOURNEY_STAGES.WORDS, worldId: 'words_basic' },
  { reviewMode: false },
);
assert.equal(normalQuest.enabled, true, 'normal campaign expeditions must remain enabled');
assert.equal(normalQuest.goal, 4);

const welcomeSource = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcomeSource.includes('buildLearnerReviewQuest'));
assert.ok(welcomeSource.includes('Revisão inteligente'));
assert.ok(welcomeSource.includes('Revisar agora'));
assert.ok(welcomeSource.includes('reviewQuest.nextPath'));

const practiceSource = await readFile(new URL('../src/pages/PracticeHub.jsx', import.meta.url), 'utf8');
assert.ok(practiceSource.includes('buildLearnerReviewQuest'));
assert.ok(practiceSource.includes('Revisões inteligentes atualizam o FSRS sem avançar a expedição'));
assert.ok(practiceSource.includes('reviewChapter.path'));
assert.ok(practiceSource.includes('Revisar {dueCount} agora'));

console.log('Lexia M20 Learner Review Quest contract: PASS (whole-journey due queue, locked-stage guard, FSRS persistence path, Session Quest excluded)');
