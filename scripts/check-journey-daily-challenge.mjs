import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DAILY_CHALLENGE_TYPES,
  buildDailyChallengeDefinition,
  getDailyChallengeType,
} from '../src/game/dailyChallengeEngine.js';
import {
  getDailyChallenge,
  getSavedDailyChallenge,
} from '../src/lib/dailyChallenge.js';
import { decorateProgressWithDailyChallenge } from '../src/platform/decorators/dailyChallengeProgressDecorator.js';

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
const complexSyllables = Array.from({ length: 20 }, (_, index) => ({
  letter: `SYLC_${index}`,
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
const sentences = Array.from({ length: 20 }, (_, index) => ({
  letter: `SENT_${String(index + 1).padStart(2, '0')}`,
  total_attempts: 3,
  correct_attempts: 3,
  stars_earned: 1,
}));

const stageCases = [
  {
    name: 'letters',
    progress: [],
    type: DAILY_CHALLENGE_TYPES.LETTERS,
    path: '/play?daily=1',
    key: (value) => value.length === 1,
  },
  {
    name: 'simple syllables',
    progress: masteredLetters,
    type: DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES,
    path: '/play-syllables?daily=1',
    key: (value) => value.startsWith('SYL_'),
  },
  {
    name: 'complex syllables',
    progress: [...masteredLetters, ...syllables],
    type: DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES,
    path: '/play-syllables?mode=complex&daily=1',
    key: (value) => value.startsWith('SYLC_'),
  },
  {
    name: 'words',
    progress: [...masteredLetters, ...syllables, ...complexSyllables],
    type: DAILY_CHALLENGE_TYPES.WORDS,
    path: '/play-syllables?mode=words&daily=1',
    key: (value) => value.startsWith('WORD_'),
  },
  {
    name: 'sentences',
    progress: [...masteredLetters, ...syllables, ...complexSyllables, ...words],
    type: DAILY_CHALLENGE_TYPES.SENTENCES,
    path: '/play-sentences?daily=1',
    key: (value) => value.startsWith('SENT_'),
  },
];

for (const stage of stageCases) {
  const definition = buildDailyChallengeDefinition(stage.progress, '2026-08-18');
  assert.equal(definition.schema, 'lexia.daily-challenge.v2', `${stage.name}: schema`);
  assert.equal(definition.type, stage.type, `${stage.name}: type must follow Journey Engine stage`);
  assert.equal(definition.playPath, stage.path, `${stage.name}: route must preserve the real mechanic`);
  assert.equal(definition.targets.length, 3, `${stage.name}: exactly three targets`);
  assert.equal(definition.targetKeys.length, 3, `${stage.name}: exactly three target keys`);
  assert.ok(definition.targetKeys.every(stage.key), `${stage.name}: keys must belong to the current mechanic`);
  assert.equal(definition.starsMultiplier, 2, `${stage.name}: first completion bonus must remain x2`);
  assert.deepEqual(
    buildDailyChallengeDefinition(stage.progress, '2026-08-18'),
    definition,
    `${stage.name}: same day and progress must be deterministic`,
  );
}

const complete = [...masteredLetters, ...syllables, ...complexSyllables, ...words, ...sentences];
const masteryRotation = new Set(
  Array.from({ length: 100 }, (_, index) => getDailyChallengeType(complete, `rotation-${index}`)),
);
assert.deepEqual(
  new Set(Object.values(DAILY_CHALLENGE_TYPES)),
  masteryRotation,
  'mastery daily rotation must still reach all five curriculum families',
);

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
  clear: () => memory.clear(),
};

memory.clear();
const challenge = getDailyChallenge([]);
assert.equal(challenge.targets.length, 3);
const [firstKey, secondKey, thirdKey] = challenge.targetKeys;
const writes = [];
const provider = {
  list: async () => [],
  remove: async () => null,
  clearAll: async () => [],
  create: async (data) => { writes.push({ kind: 'create', data }); return data; },
  update: async (id, data) => { writes.push({ kind: 'update', id, data }); return data; },
};
const decorated = decorateProgressWithDailyChallenge(provider);

await decorated.create({
  letter: firstKey,
  last_grade: 4,
  stars_earned: 4,
  level: 1,
});
assert.equal(writes.at(-1).data.stars_earned, 5, 'platform boundary must add exactly one bonus star to the page base reward');
assert.equal(writes.at(-1).data.level, 2, 'letter level must be recalculated after the bonus crosses a level boundary');
assert.equal(getSavedDailyChallenge().progress[firstKey], true, 'target is completed only after successful remote create');

await decorated.update('row-1', {
  letter: firstKey,
  last_grade: 4,
  stars_earned: 6,
  level: 2,
});
assert.equal(writes.at(-1).data.stars_earned, 6, 'repeating the same daily target must not farm another bonus');

await decorated.update('row-2', {
  letter: secondKey,
  last_grade: 1,
  stars_earned: 0,
  level: 1,
});
assert.equal(writes.at(-1).data.stars_earned, 0, 'incorrect attempts never receive a daily bonus');
assert.equal(getSavedDailyChallenge().progress[secondKey], false, 'incorrect attempts never complete a target');

const failing = decorateProgressWithDailyChallenge({
  ...provider,
  update: async () => { throw new Error('remote write failed'); },
});
await assert.rejects(
  failing.update('row-2', {
    letter: secondKey,
    last_grade: 3,
    stars_earned: 1,
    level: 1,
  }),
  /remote write failed/,
);
assert.equal(getSavedDailyChallenge().progress[secondKey], false, 'failed remote writes must not mutate local daily completion');

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
assert.ok(platformIndex.includes('decorateProgressWithDailyChallenge(selectedProvider.progress)'), 'all providers must share the same daily write decoration');

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

const playGameSource = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(playGameSource.includes("const isDailyMode = urlParams.get('daily') === '1'"));
assert.ok(
  playGameSource.includes('requestedDailyLetter || requestedReviewLetter || getInitialLearningLetter(ALPHABET)'),
  'Daily target must keep first precedence while Review becomes the secondary explicit handoff',
);
assert.ok(
  playGameSource.indexOf('requestedDailyLetter || requestedReviewLetter') >= 0,
  'Daily target must remain ahead of Review target in letter initialization',
);
assert.ok(playGameSource.includes("dailyChallenge?.type === 'letters'"), 'letter-only inline launcher must hide incompatible daily types');
assert.ok(!playGameSource.includes('challenge?.letters?.includes'), 'PlayGame must retire the v1 letter-array challenge contract');

const syllableSource = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
assert.ok(syllableSource.includes('findDailyItemIndex(requestedDailyTargetKey)'));
assert.ok(syllableSource.includes('getNextChallengeTarget(challenge)'));
assert.ok(syllableSource.includes('alvo novo vale ⭐×2'));

const sentenceSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
assert.ok(sentenceSource.includes('findDailySentenceIndex(requestedDailyTargetKey)'));
assert.ok(sentenceSource.includes('getNextChallengeTarget(challenge)'));
assert.ok(sentenceSource.includes('alvo novo vale ⭐×2'));

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Journey daily challenge contract'));
assert.ok(ciSource.includes('node scripts/check-journey-daily-challenge.mjs'));
assert.ok(ciSource.includes('Daily challenge browser QA'));

console.log('Lexia M16 Journey Daily Challenge contract: PASS (5-stage daily missions, exact targets, provider-neutral x2, idempotent remote-safe completion)');
