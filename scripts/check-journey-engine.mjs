import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALPHABET } from '../src/lib/alphabetData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../src/lib/syllablesData.js';
import { BASIC_SENTENCES } from '../src/lib/sentencesData.js';
import {
  getJourneyState,
  JOURNEY_STAGES,
  JOURNEY_TARGET_TOTALS,
  JOURNEY_TOTAL_TARGETS,
  summarizeJourneyProgress,
} from '../src/game/journeyEngine.js';

const fresh = getJourneyState([]);
assert.equal(fresh.stage, JOURNEY_STAGES.LETTERS);
assert.equal(fresh.worldId, 'alphabet');
assert.equal(fresh.path, '/play');
assert.equal(fresh.target, 'I');
assert.equal(fresh.firstRun, true);
assert.equal(fresh.current, 0);
assert.equal(fresh.total, ALPHABET.length);

assert.deepEqual(JOURNEY_TARGET_TOTALS, {
  LETTERS: ALPHABET.length,
  SYLLABLES: BASIC_SYLLABLES.length,
  COMPLEX_SYLLABLES: COMPLEX_SYLLABLES.length,
  WORDS: BASIC_WORDS.length,
  SENTENCES: BASIC_SENTENCES.length,
});
assert.equal(
  JOURNEY_TOTAL_TARGETS,
  ALPHABET.length + BASIC_SYLLABLES.length + COMPLEX_SYLLABLES.length + BASIC_WORDS.length + BASIC_SENTENCES.length,
);

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const masteredLetters = ALPHABET.map(({ letter }) => ({
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
const mastered = (letter) => ({ letter, total_attempts: 3, correct_attempts: 3, stars_earned: 1 });
const syllables = BASIC_SYLLABLES.map((item) => mastered(`SYL_${item.syllable}`));
const complexSyllables = COMPLEX_SYLLABLES.map((item) => mastered(`SYLC_${item.syllable}`));
const words = BASIC_WORDS.map((item) => mastered(`WORD_${item.word}`));
const sentences = BASIC_SENTENCES.map((item) => mastered(`SENT_${item.id}`));

const afterLetters = getJourneyState(masteredLetters);
assert.equal(afterLetters.stage, JOURNEY_STAGES.SYLLABLES);
assert.equal(afterLetters.total, BASIC_SYLLABLES.length);

const almostSyllables = getJourneyState([...masteredLetters, ...syllables.slice(0, -1)]);
assert.equal(almostSyllables.stage, JOURNEY_STAGES.SYLLABLES, 'catalog chapter must not complete with one official target missing');

const afterSyllables = getJourneyState([...masteredLetters, ...syllables]);
assert.equal(afterSyllables.stage, JOURNEY_STAGES.COMPLEX_SYLLABLES);
assert.equal(afterSyllables.total, COMPLEX_SYLLABLES.length);

const afterComplex = getJourneyState([...masteredLetters, ...syllables, ...complexSyllables]);
assert.equal(afterComplex.stage, JOURNEY_STAGES.WORDS);
assert.equal(afterComplex.total, BASIC_WORDS.length);

const afterWords = getJourneyState([...masteredLetters, ...syllables, ...complexSyllables, ...words]);
assert.equal(afterWords.stage, JOURNEY_STAGES.SENTENCES);
assert.equal(afterWords.total, BASIC_SENTENCES.length);

const completeRecords = [...masteredLetters, ...syllables, ...complexSyllables, ...words, ...sentences];
const complete = getJourneyState(completeRecords);
assert.equal(complete.stage, JOURNEY_STAGES.MASTERY);
assert.equal(complete.completed, true);
assert.equal(complete.path, '/play?mode=practice');

const summary = summarizeJourneyProgress(completeRecords);
assert.equal(summary.lettersMastered, ALPHABET.length);
assert.equal(summary.syllablesMastered, BASIC_SYLLABLES.length);
assert.equal(summary.complexSyllablesMastered, COMPLEX_SYLLABLES.length);
assert.equal(summary.wordsMastered, BASIC_WORDS.length);
assert.equal(summary.sentencesMastered, BASIC_SENTENCES.length);

const welcome = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcome.includes('getJourneyState'));
assert.ok(welcome.includes('enabled: canLoadProgress'), 'public Supabase Welcome must not query private progress');
assert.ok(welcome.includes('Missão atual'));
assert.ok(welcome.includes('to={journey.path}'));

const worldMap = await readFile(new URL('../src/pages/WorldMap.jsx', import.meta.url), 'utf8');
assert.ok(worldMap.includes('const journey = getJourneyState(allProgress)'));
assert.ok(worldMap.includes("journey.worldId === world.id"));
assert.ok(worldMap.includes("isRecommended ? journey.path : world.playPath"));

const playGame = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(playGame.includes('isFetched: hasLoadedProgress'), 'guided activity must wait for learner progress before syncing mission');
assert.ok(playGame.includes('setCurrentLetter(journey.target)'), 'PlayGame must start on the Journey Engine target for returning learners');
assert.ok(playGame.includes("journey.stage === JOURNEY_STAGES.LETTERS"));
assert.ok(playGame.includes('Ver jornada no mapa'));

console.log(`Lexia Journey Engine M08/M27 contract: PASS (${JOURNEY_TOTAL_TARGETS} canonical targets → mastery)`);
