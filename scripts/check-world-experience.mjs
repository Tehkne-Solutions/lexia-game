import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getJourneyWorldExperience,
  getUnlockedWorldRelics,
  getWorldExperience,
  getWorldRelicProgress,
  WORLD_EXPERIENCES,
} from '../src/game/worldExperienceEngine.js';

assert.equal(Object.keys(WORLD_EXPERIENCES).length, 6, 'world experience catalog must cover five chapters plus mastery epilogue');

const fresh = getWorldExperience('alphabet', {});
assert.equal(fresh.chapter, 'Capítulo I');
assert.equal(fresh.title, 'O Bosque dos Símbolos');
assert.equal(fresh.relic.name, 'Pena das 26 Vozes');
assert.equal(fresh.relicUnlocked, false);

const lettersComplete = { lettersMastered: 26 };
assert.equal(getWorldExperience('alphabet', lettersComplete).relicUnlocked, true);
assert.equal(getWorldExperience('syllables_basic', lettersComplete).relicUnlocked, false);
assert.deepEqual(
  getUnlockedWorldRelics(lettersComplete).map((relic) => relic.id),
  ['relic-alphabet-quill'],
  'only rewards already justified by existing mastery may unlock'
);

const coreComplete = {
  lettersMastered: 26,
  syllablesBasicMastered: 20,
  wordsMastered: 20,
};
const relicProgress = getWorldRelicProgress(coreComplete);
assert.equal(relicProgress.unlocked, 4, 'alphabet, syllables, words and mastery relics should derive from completed core journey');
assert.equal(relicProgress.total, 6);
assert.deepEqual(
  relicProgress.relics.map((relic) => relic.id),
  ['relic-alphabet-quill', 'relic-syllable-shell', 'relic-word-key', 'relic-mastery-lantern']
);

const wordsExperience = getJourneyWorldExperience({ worldId: 'words_basic' }, coreComplete);
assert.equal(wordsExperience.chapter, 'Capítulo IV');
assert.equal(wordsExperience.title, 'A Biblioteca Desperta');
assert.equal(wordsExperience.relicUnlocked, true);

const worldMap = await readFile(new URL('../src/pages/WorldMap.jsx', import.meta.url), 'utf8');
assert.ok(worldMap.includes('getJourneyWorldExperience'));
assert.ok(worldMap.includes('getWorldRelicProgress'));
assert.ok(worldMap.includes('<WorldNarrativePanel experience={activeExperience} journey={journey} />'));
assert.ok(worldMap.includes('<WorldRelicBadge experience={worldExperience} />'));
assert.ok(worldMap.includes('Relíquias:'));

const welcome = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcome.includes('getJourneyWorldExperience'));
assert.ok(welcome.includes('activeExperience.chapter'));
assert.ok(welcome.includes('activeExperience.title'));

const engine = await readFile(new URL('../src/game/worldExperienceEngine.js', import.meta.url), 'utf8');
assert.equal(engine.includes('lexiaPlatform'), false, 'world narrative/relic engine must remain persistence-free');
assert.equal(engine.includes('progress.create'), false, 'relics must be derived, never persisted as a parallel score');

console.log('Lexia World Experience M07-F contract: PASS (chapter narrative + deterministic relics, no parallel scoring)');
