import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALPHABET } from '../src/lib/alphabetData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../src/lib/syllablesData.js';
import { BASIC_SENTENCES } from '../src/lib/sentencesData.js';
import { getJourneyState, JOURNEY_STAGES } from '../src/game/journeyEngine.js';
import { createSessionQuest } from '../src/game/sessionQuestEngine.js';
import { isWorldUnlocked, WORLDS } from '../src/lib/worldMap.js';

assert.ok(COMPLEX_SYLLABLES.length > 0, 'complex syllable world must expose canonical mastery targets');
assert.equal(new Set(COMPLEX_SYLLABLES.map((item) => item.syllable)).size, COMPLEX_SYLLABLES.length, 'complex syllable targets must be unique');
assert.ok(COMPLEX_SYLLABLES.every((item) => /^[A-Z]{3}$/.test(item.syllable)), 'complex syllables must be normalized three-letter targets');

assert.ok(BASIC_SENTENCES.length > 0, 'sentence world must expose canonical mastery targets');
assert.equal(new Set(BASIC_SENTENCES.map((item) => item.id)).size, BASIC_SENTENCES.length, 'sentence IDs must be unique');
for (const item of BASIC_SENTENCES) {
  assert.equal(item.words.join(' '), item.sentence, `sentence ${item.id} words must reproduce the canonical target`);
  assert.ok(item.words.length >= 3 && item.words.length <= 4, `sentence ${item.id} must remain mobile-friendly`);
}

const alphabetWorld = WORLDS.find((world) => world.id === 'alphabet');
const simpleWorld = WORLDS.find((world) => world.id === 'syllables_basic');
const complexWorld = WORLDS.find((world) => world.id === 'syllables_complex');
const wordsWorld = WORLDS.find((world) => world.id === 'words_basic');
const sentenceWorld = WORLDS.find((world) => world.id === 'sentences');
assert.equal(complexWorld.playPath, '/play-syllables?mode=complex');
assert.equal(sentenceWorld.playPath, '/play-sentences');
assert.equal(alphabetWorld.totalLessons, ALPHABET.length);
assert.equal(simpleWorld.totalLessons, BASIC_SYLLABLES.length);
assert.equal(complexWorld.totalLessons, COMPLEX_SYLLABLES.length);
assert.equal(wordsWorld.totalLessons, BASIC_WORDS.length);
assert.equal(sentenceWorld.totalLessons, BASIC_SENTENCES.length);

const lettersOnlyStats = { lettersMastered: ALPHABET.length, totalStars: 52 };
assert.equal(isWorldUnlocked(complexWorld, lettersOnlyStats), false, 'finishing letters alone must not skip the simple-syllable chapter');
assert.equal(isWorldUnlocked(wordsWorld, lettersOnlyStats), false, 'finishing letters alone must not unlock first words anymore');
assert.equal(isWorldUnlocked(sentenceWorld, lettersOnlyStats), false, 'finishing letters alone must not unlock sentences');

const afterSimpleStats = { ...lettersOnlyStats, syllablesBasicMastered: BASIC_SYLLABLES.length };
assert.equal(isWorldUnlocked(complexWorld, afterSimpleStats), true, 'complex syllables unlock after all canonical simple syllables are mastered');

const afterComplexStats = { ...afterSimpleStats, syllablesComplexMastered: COMPLEX_SYLLABLES.length };
assert.equal(isWorldUnlocked(wordsWorld, afterComplexStats), true, 'words unlock after all canonical complex syllables are mastered');

const afterWordsStats = { ...afterComplexStats, wordsMastered: BASIC_WORDS.length };
assert.equal(isWorldUnlocked(sentenceWorld, afterWordsStats), true, 'sentences unlock after all canonical first words are mastered');

const oneSimpleShort = { ...lettersOnlyStats, syllablesBasicMastered: Math.max(BASIC_SYLLABLES.length - 1, 0) };
assert.equal(isWorldUnlocked(complexWorld, oneSimpleShort), false, 'one missing canonical simple syllable must keep the next world locked');

assert.equal(isWorldUnlocked(complexWorld, { totalStars: 200 }), true, 'star bypass remains available for complex syllables');
assert.equal(isWorldUnlocked(wordsWorld, { totalStars: 150 }), true, 'existing word star bypass remains available');
assert.equal(isWorldUnlocked(sentenceWorld, { totalStars: 300 }), true, 'sentence star bypass remains available');

const complexQuest = createSessionQuest({ stage: JOURNEY_STAGES.COMPLEX_SYLLABLES, worldId: 'syllables_complex' });
assert.equal(complexQuest.id, 'complex-syllables-expedition');
assert.equal(complexQuest.goal, 4);
const sentenceQuest = createSessionQuest({ stage: JOURNEY_STAGES.SENTENCES, worldId: 'sentences' });
assert.equal(sentenceQuest.id, 'sentences-expedition');
assert.equal(sentenceQuest.goal, 4);

const masteredLetters = ALPHABET.map(({ letter }) => ({
  letter,
  stability: 10,
  difficulty: 3,
  interval: 30,
  repetitions: 5,
  next_review: new Date(Date.now() + 86400000).toISOString(),
  total_attempts: 5,
  correct_attempts: 5,
  streak: 5,
  last_grade: 4,
}));
const masteredSimple = BASIC_SYLLABLES.map((item) => ({ letter: `SYL_${item.syllable}`, total_attempts: 3, correct_attempts: 3 }));
const masteredComplex = COMPLEX_SYLLABLES.map((item) => ({ letter: `SYLC_${item.syllable}`, total_attempts: 3, correct_attempts: 3 }));
const masteredWords = BASIC_WORDS.map((item) => ({ letter: `WORD_${item.word}`, total_attempts: 3, correct_attempts: 3 }));

const sentenceJourney = getJourneyState([
  ...masteredLetters,
  ...masteredSimple,
  ...masteredComplex,
  ...masteredWords,
]);
assert.equal(sentenceJourney.stage, JOURNEY_STAGES.SENTENCES);
assert.equal(sentenceJourney.path, '/play-sentences');

const syllablePage = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
assert.ok(syllablePage.includes("entityPrefix: 'SYLC_'"));
assert.ok(syllablePage.includes('COMPLEX_SYLLABLES'));
assert.ok(syllablePage.includes('<SessionQuestBar quest={sessionQuest} />'));

const sentencePage = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
assert.ok(sentencePage.includes('BASIC_SENTENCES'));
assert.ok(sentencePage.includes('`SENT_${current.id}`'));
assert.ok(sentencePage.includes('selectedSentence === current.sentence'));
assert.ok(sentencePage.includes('<SessionQuestBar quest={sessionQuest} />'));

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.ok(app.includes("<Route path=\"/play-sentences\" element={<PlaySentences />} />"));

const statsSource = await readFile(new URL('../src/game/journeyStatsEngine.js', import.meta.url), 'utf8');
assert.ok(statsSource.includes("startsWith('SYLC_')"));
assert.ok(statsSource.includes("startsWith('SENT_')"));
assert.ok(statsSource.includes('syllablesComplexMastered'));
assert.ok(statsSource.includes('sentencesMastered'));

const achievementFacade = await readFile(new URL('../src/lib/achievements.js', import.meta.url), 'utf8');
assert.ok(achievementFacade.includes('buildJourneyStats'));
assert.ok(achievementFacade.includes('return buildJourneyStats(allProgress)'));

console.log(`Lexia Curriculum Worlds M08/M27 contract: PASS (${ALPHABET.length + BASIC_SYLLABLES.length + COMPLEX_SYLLABLES.length + BASIC_WORDS.length + BASIC_SENTENCES.length} canonical targets across five worlds)`);
