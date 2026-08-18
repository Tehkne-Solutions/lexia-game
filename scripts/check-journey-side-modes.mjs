import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../src/lib/syllablesData.js';
import { STORY_CHAPTERS } from '../src/lib/stories.js';
import {
  getStoryLibrary,
  getUnlockedStoryChapters,
  getSpeedChallengeProfile,
} from '../src/game/sideModesEngine.js';

const fresh = {
  lettersMastered: 0,
  syllablesBasicMastered: 0,
  syllablesComplexMastered: 0,
  wordsMastered: 0,
  sentencesMastered: 0,
};

assert.equal(STORY_CHAPTERS.length, 6, 'Story Mode must mirror five curriculum chapters plus mastery epilogue');
assert.deepEqual(
  STORY_CHAPTERS.map((chapter) => [chapter.worldId, chapter.unlockAfterRelicId]),
  [
    ['alphabet', null],
    ['syllables_basic', 'relic-alphabet-quill'],
    ['syllables_complex', 'relic-syllable-shell'],
    ['words_basic', 'relic-complex-compass'],
    ['sentences', 'relic-word-key'],
    ['mastery', 'relic-sentence-seed'],
  ],
  'Story Mode unlocks must follow canonical relic progression rather than counters',
);
assert.ok(STORY_CHAPTERS.every((chapter) => chapter.pages.length === 5), 'each journey storybook must remain a short five-page read-aloud');

const freshStories = getStoryLibrary(fresh);
assert.equal(getUnlockedStoryChapters(fresh).length, 1, 'Fresh Start must expose only the first storybook');
assert.equal(freshStories[0].unlocked, true);
assert.equal(freshStories[1].unlocked, false);
assert.equal(freshStories[1].requiredRelicName, 'Pena das 26 Vozes');

const afterLetters = { ...fresh, lettersMastered: 26 };
assert.equal(getUnlockedStoryChapters(afterLetters).length, 2);
const afterSimple = { ...afterLetters, syllablesBasicMastered: 20 };
assert.equal(getUnlockedStoryChapters(afterSimple).length, 3);
const afterComplex = { ...afterSimple, syllablesComplexMastered: 20 };
assert.equal(getUnlockedStoryChapters(afterComplex).length, 4);
const afterWords = { ...afterComplex, wordsMastered: 20 };
assert.equal(getUnlockedStoryChapters(afterWords).length, 5);
const complete = { ...afterWords, sentencesMastered: 20 };
assert.equal(getUnlockedStoryChapters(complete).length, 6);

const freshSpeed = getSpeedChallengeProfile(fresh);
assert.equal(freshSpeed.unlockedTierCount, 1);
assert.equal(freshSpeed.totalTierCount, 4);
assert.equal(freshSpeed.label, 'Letras');
assert.equal(freshSpeed.pool.length, 26);
assert.ok(freshSpeed.pool.every((item) => item.kind === 'letter'));

const letterSpeed = getSpeedChallengeProfile(afterLetters);
assert.equal(letterSpeed.unlockedTierCount, 2);
assert.equal(letterSpeed.label, 'Sílabas simples');
assert.equal(letterSpeed.pool.length, 26 + BASIC_SYLLABLES.length);

const simpleSpeed = getSpeedChallengeProfile(afterSimple);
assert.equal(simpleSpeed.unlockedTierCount, 3);
assert.equal(simpleSpeed.label, 'Sílabas complexas');
assert.equal(simpleSpeed.pool.length, 26 + BASIC_SYLLABLES.length + COMPLEX_SYLLABLES.length);

const complexSpeed = getSpeedChallengeProfile(afterComplex);
assert.equal(complexSpeed.unlockedTierCount, 4);
assert.equal(complexSpeed.label, 'Primeiras palavras');
assert.equal(complexSpeed.pool.length, 26 + BASIC_SYLLABLES.length + COMPLEX_SYLLABLES.length + BASIC_WORDS.length);
assert.ok(complexSpeed.pool.some((item) => item.kind === 'word'));
assert.equal(complexSpeed.sentenceTrainingPath, '/play-sentences');
assert.ok(complexSpeed.sentenceTrainingReason.includes('composição por palavras'));

const sideEngine = await readFile(new URL('../src/game/sideModesEngine.js', import.meta.url), 'utf8');
assert.ok(sideEngine.includes("import { getWorldRelics } from './worldExperienceEngine.js'"));
for (const forbidden of [
  'lettersMastered >=',
  'syllablesBasicMastered >=',
  'syllablesComplexMastered >=',
  'wordsMastered >=',
]) {
  assert.ok(!sideEngine.includes(forbidden), `side modes must not duplicate journey mastery thresholds: ${forbidden}`);
}

const storiesSource = await readFile(new URL('../src/lib/stories.js', import.meta.url), 'utf8');
assert.ok(!storiesSource.includes('unlockLetters'), 'Story Mode must retire letter-count unlock metadata');
assert.ok(!storiesSource.includes('getUnlockedChapters(lettersMastered)'), 'Story Mode must retire letter-only unlock helper');
assert.ok(storiesSource.includes("unlockAfterRelicId: 'relic-word-key'"));
assert.ok(storiesSource.includes("unlockAfterRelicId: 'relic-sentence-seed'"));

const storyPage = await readFile(new URL('../src/pages/StoryMode.jsx', import.meta.url), 'utf8');
for (const required of [
  'Biblioteca da Jornada',
  'getStoryLibrary(stats)',
  'Cada nova relíquia abre o próximo livro',
  'Biblioteca descoberta',
  'requiredRelicName',
]) {
  assert.ok(storyPage.includes(required), `Story Mode M15 UI missing: ${required}`);
}
assert.ok(!storyPage.includes('domina mais letras'), 'Story Mode must not frame every story as alphabet-only progression');
assert.ok(!storyPage.includes('Letras dominadas:'), 'Story Mode footer must represent the story library, not alphabet count');

const speedPage = await readFile(new URL('../src/pages/SpeedChallenge.jsx', import.meta.url), 'utf8');
for (const required of [
  'getSpeedChallengeProfile(stats)',
  'Treino atual',
  'speedProfile.unlockedTierCount',
  'Recorde deste nível',
  'bestScoreKey(speedProfile.id)',
  'Frases continuam no modo próprio de composição',
]) {
  assert.ok(speedPage.includes(required), `Speed Challenge M15 UI missing: ${required}`);
}
assert.ok(!speedPage.includes('bg-gradient'), 'Speed Challenge must not reintroduce gradient CTA styling');
assert.ok(!speedPage.includes('Quantas letras e sílabas'), 'Speed Challenge copy must not remain fixed to two early curriculum types');

const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ci.includes('Journey side modes contract'));
assert.ok(ci.includes('node scripts/check-journey-side-modes.mjs'));

console.log('Lexia M15 Journey Side Modes contract: PASS (relic-gated story library, adaptive speed tiers, no duplicated mastery thresholds)');
