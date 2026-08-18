import assert from 'node:assert/strict';
import { getJourneyState, JOURNEY_STAGES, summarizeJourneyProgress } from '../src/game/journeyEngine.js';

const fresh = getJourneyState([]);
assert.equal(fresh.stage, JOURNEY_STAGES.LETTERS);
assert.equal(fresh.worldId, 'alphabet');
assert.equal(fresh.path, '/play');
assert.equal(fresh.target, 'I');
assert.equal(fresh.firstRun, true);
assert.equal(fresh.current, 0);
assert.equal(fresh.total, 26);

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const masteredLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
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
  stars_earned: 2,
}));

const syllables = Array.from({ length: 20 }, (_, index) => ({
  letter: `SYL_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
  stars_earned: 1,
}));
const words = Array.from({ length: 20 }, (_, index) => ({
  letter: `WORD_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
  stars_earned: 1,
}));

const afterLetters = getJourneyState(masteredLetters);
assert.equal(afterLetters.stage, JOURNEY_STAGES.SYLLABLES);
assert.equal(afterLetters.worldId, 'syllables_basic');
assert.equal(afterLetters.path, '/play-syllables');

const afterSyllables = getJourneyState([...masteredLetters, ...syllables]);
assert.equal(afterSyllables.stage, JOURNEY_STAGES.WORDS);
assert.equal(afterSyllables.worldId, 'words_basic');
assert.equal(afterSyllables.path, '/play-syllables?mode=words');

const complete = getJourneyState([...masteredLetters, ...syllables, ...words]);
assert.equal(complete.stage, JOURNEY_STAGES.MASTERY);
assert.equal(complete.completed, true);
assert.equal(complete.path, '/play?mode=practice');

const summary = summarizeJourneyProgress([...masteredLetters, ...syllables, ...words]);
assert.equal(summary.lettersMastered, 26);
assert.equal(summary.syllablesMastered, 20);
assert.equal(summary.wordsMastered, 20);
assert.equal(summary.totalStars, 92);

console.log('Lexia Journey Engine M07 contract: PASS (fresh start → letters → syllables → words → mastery)');
