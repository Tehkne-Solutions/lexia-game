import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildDailyChallenge,
  getChallengeStarMultiplier,
  getSavedDailyChallenge,
  setSavedDailyChallenge,
  updateChallengeProgress,
} from '../src/lib/dailyChallenge.js';
import { decorateProgressWithDailyChallenge } from '../src/platform/decorators/dailyChallengeProgressDecorator.js';
import { getJourneyState } from '../src/game/journeyEngine.js';

function makeProgress(letter, overrides = {}) {
  return {
    id: `progress-${letter}`,
    child_name: 'Jogador',
    letter,
    total_attempts: 10,
    correct_attempts: 9,
    streak: 3,
    stars_earned: 3,
    stability: 4,
    difficulty: 2,
    interval: 8,
    repetitions: 3,
    next_review: '2026-08-01T00:00:00.000Z',
    last_grade: 4,
    level: 1,
    ...overrides,
  };
}

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
};

const alphabetProgress = Array.from({ length: 26 }, (_, index) => makeProgress(String.fromCharCode(65 + index)));
const journeyAfterAlphabet = getJourneyState(alphabetProgress);
assert.equal(journeyAfterAlphabet.stage, 'syllables', 'full alphabet mastery should hand off to syllables');

const challenge = buildDailyChallenge(alphabetProgress, new Date('2026-08-01T10:00:00.000Z'));
assert.equal(challenge.type, 'syllables', 'daily challenge must follow Journey Engine stage');
assert.equal(challenge.playPath, '/PlaySyllables?mode=syllables', 'syllable challenge uses the canonical play route');
assert.equal(challenge.targets.length, 3, 'daily challenge keeps three targets');
assert.ok(challenge.targets.every((target) => target.key.startsWith('SYL_')), 'daily syllable targets use canonical persistence keys');

setSavedDailyChallenge(challenge);
const firstKey = challenge.targets[0].key;
assert.equal(getChallengeStarMultiplier(challenge, firstKey), 2, 'active pending target gets double stars');
assert.equal(getChallengeStarMultiplier(challenge, 'SYL_FAKE'), 1, 'non-target keeps regular stars');

const completedOnce = updateChallengeProgress(firstKey, true);
assert.equal(completedOnce.completedCount, 1, 'correct daily target completion is persisted');
assert.equal(completedOnce.targets.find((target) => target.key === firstKey)?.completed, true);
assert.equal(getChallengeStarMultiplier(completedOnce, firstKey), 1, 'completed daily target no longer gets duplicate bonus');

const unchangedOnRetry = updateChallengeProgress(firstKey, true);
assert.equal(unchangedOnRetry.completedCount, 1, 'repeating the same completed target is idempotent');

const unchangedOnFailure = updateChallengeProgress(challenge.targets[1].key, false);
assert.equal(unchangedOnFailure.completedCount, 1, 'incorrect answers never advance the challenge');

const secondKey = challenge.targets[1].key;
const thirdKey = challenge.targets[2].key;
const writes = [];
const progress = {
  async create(data) {
    writes.push({ type: 'create', data });
    return { id: `created-${writes.length}`, ...data };
  },
  async update(id, data) {
    writes.push({ type: 'update', id, data });
    return { id, ...data };
  },
};
const decorated = decorateProgressWithDailyChallenge(progress);

setSavedDailyChallenge(challenge);
await decorated.create({
  letter: firstKey,
  last_grade: 4,
  stars_earned: 1,
  level: 1,
});
assert.equal(writes.at(-1).data.stars_earned, 2, 'decorated create applies double-star persistence exactly once');
assert.equal(writes.at(-1).data.level, 1, 'level remains derived from the boosted star total');
assert.equal(getSavedDailyChallenge().completedCount, 1, 'create completes daily target only after remote write succeeds');

await decorated.update('row-1', {
  letter: firstKey,
  last_grade: 4,
  stars_earned: 2,
  level: 1,
});
assert.equal(writes.at(-1).data.stars_earned, 2, 'completed target is not boosted twice');
assert.equal(getSavedDailyChallenge().completedCount, 1, 'completed target stays idempotent through update');

await decorated.update('row-fail', {
  letter: secondKey,
  last_grade: 2,
  stars_earned: 0,
  level: 1,
});
assert.equal(writes.at(-1).data.stars_earned, 0, 'incorrect persisted answer never gets daily bonus');
assert.equal(getSavedDailyChallenge().completedCount, 1, 'incorrect persisted answer never completes daily target');

await decorated.update('row-2', {
  letter: secondKey,
  last_grade: 3,
  stars_earned: 1,
  level: 1,
});
await decorated.update('row-3', {
  letter: thirdKey,
  last_grade: 3,
  stars_earned: 1,
  level: 1,
});
assert.equal(getSavedDailyChallenge().completed, true, 'three successful distinct targets complete the daily mission');

const engineSource = await readFile(new URL('../src/game/dailyChallengeEngine.js', import.meta.url), 'utf8');
for (const forbidden of [
  'lettersMastered >=',
  'syllablesBasicMastered >=',
  'syllablesComplexMastered >=',
  'wordsMastered >=',
  'sentencesMastered >=',
]) {
  assert.ok(!engineSource.includes(forbidden), `daily challenge must not duplicate Journey Engine thresholds: ${forbidden}`);
}
assert.ok(engineSource.includes('getJourneyState(allProgress)'), 'daily challenge stage must come from Journey Engine');

const platformIndex = await readFile(new URL('../src/platform/index.js', import.meta.url), 'utf8');
assert.ok(platformIndex.includes('decorateProgressWithDailyChallenge(resilientProvider.progress)'), 'all providers must share the same daily write decoration after read resilience');

const decoratorSource = await readFile(new URL('../src/platform/decorators/dailyChallengeProgressDecorator.js', import.meta.url), 'utf8');
assert.ok(decoratorSource.includes("from '../../lib/dailyChallenge.js'"), 'decorator must remain directly testable by Node');
assert.ok(decoratorSource.indexOf('await progress.create') < decoratorSource.indexOf('updateChallengeProgress(prepared.entityKey, true)'), 'create completion must happen after the remote write');
assert.ok(decoratorSource.indexOf('await progress.update') < decoratorSource.lastIndexOf('updateChallengeProgress(prepared.entityKey, true)'), 'update completion must happen after the remote write');

const cardSource = await readFile(new URL('../src/components/game/DailyChallengeCard.jsx', import.meta.url), 'utf8');
assert.ok(cardSource.includes('withDailyTarget(challenge.playPath, nextTarget?.key)'), 'daily CTA must launch the exact next target');
assert.ok(!cardSource.includes('Pratique as 3 letras'), 'daily card copy must not remain alphabet-only');

const welcomeSource = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcomeSource.includes('if (!canLoadProgress || isFetching) return;'), 'Welcome must not create a Fresh Start challenge before returning progress loads');
assert.ok(welcomeSource.includes('Desafio diário · {dailyChallenge.typeLabel}'));

console.log('Lexia M16 Journey Daily Challenge contract: PASS (stage-aware targets, persistent completion, atomic ×2 stars, duplicate-safe bonus)');
