import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildJourneyCollectibles,
  getJourneyCollectibleProgress,
} from '../src/game/journeyCollectiblesEngine.js';
import { getWorldRelics } from '../src/game/worldExperienceEngine.js';

const expected = [
  ['relic-alphabet-quill', '🪶', 'Capítulo I'],
  ['relic-syllable-shell', '🐚', 'Capítulo II'],
  ['relic-complex-compass', '🧭', 'Capítulo III'],
  ['relic-word-key', '🗝️', 'Capítulo IV'],
  ['relic-sentence-seed', '🌱', 'Capítulo V'],
  ['relic-mastery-lantern', '🏮', 'Epílogo'],
];

const emptyStats = {
  lettersMastered: 0,
  syllablesBasicMastered: 0,
  syllablesComplexMastered: 0,
  wordsMastered: 0,
  sentencesMastered: 0,
};
const empty = getJourneyCollectibleProgress(emptyStats);
assert.equal(empty.total, 6, 'journey collection must contain exactly six canonical relics');
assert.equal(empty.unlocked, 0, 'Fresh Start must begin with zero journey relics');
assert.deepEqual(
  empty.collectibles.map((item) => [item.id, item.emoji, item.chapter]),
  expected,
  'journey collectible identity/order must remain canonical',
);
assert.ok(empty.collectibles.every((item) => item.category === 'journey'));
assert.ok(empty.collectibles.every((item) => item.unlocked === false));

const chapterOne = getJourneyCollectibleProgress({ ...emptyStats, lettersMastered: 26 });
assert.equal(chapterOne.unlocked, 1);
assert.equal(chapterOne.collectibles[0].unlocked, true);
assert.equal(chapterOne.collectibles[1].unlocked, false);

const throughWords = getJourneyCollectibleProgress({
  lettersMastered: 26,
  syllablesBasicMastered: 20,
  syllablesComplexMastered: 20,
  wordsMastered: 20,
  sentencesMastered: 0,
});
assert.equal(throughWords.unlocked, 4);
assert.equal(throughWords.collectibles.find((item) => item.id === 'relic-word-key').unlocked, true);
assert.equal(throughWords.collectibles.find((item) => item.id === 'relic-sentence-seed').unlocked, false);
assert.equal(throughWords.collectibles.find((item) => item.id === 'relic-mastery-lantern').unlocked, false);

const completeStats = {
  lettersMastered: 26,
  syllablesBasicMastered: 20,
  syllablesComplexMastered: 20,
  wordsMastered: 20,
  sentencesMastered: 20,
};
const complete = getJourneyCollectibleProgress(completeStats);
assert.equal(complete.unlocked, 6, 'complete curriculum must unlock five chapter relics plus mastery lantern');
assert.ok(complete.collectibles.every((item) => item.unlocked));

const canonicalRelics = getWorldRelics(completeStats);
const collectibles = buildJourneyCollectibles(completeStats);
assert.deepEqual(
  collectibles.map((item) => [item.id, item.unlocked]),
  canonicalRelics.map((item) => [item.id, item.unlocked]),
  'collection unlock state must be derived directly from World Experience rules',
);

const engineSource = await readFile(new URL('../src/game/journeyCollectiblesEngine.js', import.meta.url), 'utf8');
assert.ok(engineSource.includes("import { getWorldRelics } from './worldExperienceEngine.js'"));
assert.ok(!engineSource.includes('lettersMastered >='), 'collectibles engine must not duplicate chapter unlock thresholds');
assert.ok(!engineSource.includes('syllablesBasicMastered >='), 'collectibles engine must not duplicate world rules');

const worldSource = await readFile(new URL('../src/game/worldExperienceEngine.js', import.meta.url), 'utf8');
assert.ok(worldSource.includes('export function getWorldRelics'));
assert.ok(worldSource.includes('getWorldRelics(stats).filter'));

const stickersSource = await readFile(new URL('../src/lib/stickers.js', import.meta.url), 'utf8');
for (const required of [
  'buildJourneyCollectibles',
  'export function getJourneyStickers',
  'export function getStickerCatalog',
  'getJourneyStickers(stats).forEach',
  'LETTER_STICKERS',
  'MILESTONE_STICKERS',
]) {
  assert.ok(stickersSource.includes(required), `sticker integration missing: ${required}`);
}

const album = await readFile(new URL('../src/components/game/StickerAlbum.jsx', import.meta.url), 'utf8');
for (const required of [
  'Relíquias da Jornada',
  'Álbum do Alfabeto',
  'Marcos da Aventura',
  'seis relíquias da jornada',
  'journeyUnlocked',
  'totalCollectibles',
]) {
  assert.ok(album.includes(required), `journey collection UI missing: ${required}`);
}
assert.ok(!album.includes('Domine letras para ganhar mais!'), 'collection must not present letters as the only progression source');
assert.ok(!album.includes('bg-gradient'), 'M14 collection must use flat game surfaces, not gradient cards');

const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ci.includes('Journey collectibles contract'));
assert.ok(ci.includes('node scripts/check-journey-collectibles.mjs'));

console.log('Lexia M14 Journey Collectibles contract: PASS (6 canonical relics, shared world unlock rules, alphabet + milestones preserved)');
