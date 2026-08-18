import assert from 'node:assert/strict';
import { ALPHABET, LEARNING_SEQUENCE } from '../src/lib/alphabetData.js';
import {
  CURRICULUM_PHASES,
  CURRICULUM_SEQUENCE,
  getCurriculumState,
} from '../src/learning/curriculum.js';
import {
  getDailyChallengeCandidates,
  getInitialLearningLetter,
  pickNextLearningLetter,
} from '../src/learning/engine.js';
import { calculateMastery } from '../src/learning/mastery.js';

const EXPECTED_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

assert.equal(ALPHABET.length, 26, 'alphabet catalog must contain 26 letters');
assert.deepEqual(
  [...ALPHABET.map((item) => item.letter)].sort(),
  EXPECTED_ALPHABET,
  'alphabet catalog must contain A-Z exactly once'
);
assert.equal(new Set(CURRICULUM_SEQUENCE).size, 26, 'curriculum sequence must not repeat letters');
assert.deepEqual(
  [...CURRICULUM_SEQUENCE].sort(),
  EXPECTED_ALPHABET,
  'curriculum must cover all 26 letters'
);
assert.equal(LEARNING_SEQUENCE.length, 26, 'learning sequence must expose all letters');
assert.equal(getInitialLearningLetter(ALPHABET), 'I', 'first guided letter should preserve the original easy-start curriculum');

const emptyState = getCurriculumState([], calculateMastery);
assert.equal(emptyState.activePhase.level, 1, 'new learners must start in phase 1');
assert.deepEqual(emptyState.unlockedLetters, CURRICULUM_PHASES[0].letters);

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const masteredPhaseOne = CURRICULUM_PHASES[0].letters.map((letter) => ({
  letter,
  stability: 10,
  difficulty: 3,
  interval: 30,
  repetitions: 5,
  next_review: futureDate,
  total_attempts: 5,
  correct_attempts: 5,
  streak: 5,
  last_grade: 4,
}));

const advancedState = getCurriculumState(masteredPhaseOne, calculateMastery);
assert.equal(advancedState.activePhase.level, 2, 'mastering phase 1 should unlock phase 2');

const nextLetter = pickNextLearningLetter(masteredPhaseOne, null, ALPHABET);
assert.ok(CURRICULUM_PHASES[1].letters.includes(nextLetter), 'next new letter should come from the newly unlocked phase');

const challengeCandidates = getDailyChallengeCandidates(masteredPhaseOne, ALPHABET, 8);
assert.ok(challengeCandidates.length >= 3, 'daily challenge needs at least three candidates');
assert.ok(
  challengeCandidates.slice(0, CURRICULUM_PHASES[1].letters.length).some((item) => CURRICULUM_PHASES[1].letters.includes(item.letter)),
  'daily challenge candidates should include newly unlocked curriculum letters'
);

console.log('Lexia Learning Engine 2.0 contract: PASS');
