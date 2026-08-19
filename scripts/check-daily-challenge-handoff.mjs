import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DAILY_CHALLENGE_COMPLETE_PATH,
  getNextChallengeTarget,
  navigateDailyChallengeCompletion,
} from '../src/lib/dailyChallenge.js';

function locationMock(pathname, search) {
  const assigned = [];
  return {
    pathname,
    search,
    assigned,
    assign: (path) => assigned.push(path),
  };
}

const incomplete = {
  completed: false,
  targets: [
    { key: 'A', display: 'A' },
    { key: 'B', display: 'B' },
  ],
  targetKeys: ['A', 'B'],
  progress: { A: true, B: false },
};
const dailyLetters = locationMock('/play', '?daily=1&dailyTarget=A');
const next = getNextChallengeTarget(incomplete, dailyLetters);
assert.equal(next?.key, 'B', 'incomplete daily challenge must keep the next exact target');
assert.deepEqual(dailyLetters.assigned, [], 'incomplete daily challenge must not hand off');

const complete = {
  completed: true,
  targets: [
    { key: 'A' },
    { key: 'B' },
    { key: 'C' },
  ],
  targetKeys: ['A', 'B', 'C'],
  progress: { A: true, B: true, C: true },
};
const completedLetters = locationMock('/play', '?daily=1&dailyTarget=C');
assert.equal(getNextChallengeTarget(complete, completedLetters), null);
assert.deepEqual(
  completedLetters.assigned,
  [DAILY_CHALLENGE_COMPLETE_PATH],
  'completed letter bonus must hand off to Home',
);

const completedWords = locationMock('/play-syllables', '?mode=words&daily=1&dailyTarget=WORD_CASA');
assert.equal(navigateDailyChallengeCompletion(complete, completedWords), true);
assert.deepEqual(completedWords.assigned, [DAILY_CHALLENGE_COMPLETE_PATH]);

const completedSentences = locationMock('/play-sentences', '?daily=1&dailyTarget=SENT_3');
assert.equal(navigateDailyChallengeCompletion(complete, completedSentences), true);
assert.deepEqual(completedSentences.assigned, [DAILY_CHALLENGE_COMPLETE_PATH]);

const home = locationMock('/', '');
assert.equal(getNextChallengeTarget(complete, home), null);
assert.deepEqual(home.assigned, [], 'completed challenge card on Home must never redirect by itself');

const review = locationMock('/play', '?review=1&reviewTarget=A');
assert.equal(navigateDailyChallengeCompletion(complete, review), false);
assert.deepEqual(review.assigned, [], 'review flow must remain independent from daily completion');

const regularCurriculum = locationMock('/play-syllables', '?mode=complex');
assert.equal(navigateDailyChallengeCompletion(complete, regularCurriculum), false);
assert.deepEqual(regularCurriculum.assigned, [], 'normal curriculum must remain independent from daily completion');

const missingLocation = { pathname: '/play', search: '?daily=1' };
assert.equal(navigateDailyChallengeCompletion(complete, missingLocation), false, 'runtime must fail closed without location.assign');

for (const page of ['PlayGame.jsx', 'PlaySyllables.jsx', 'PlaySentences.jsx']) {
  const source = await readFile(new URL(`../src/pages/${page}`, import.meta.url), 'utf8');
  assert.ok(source.includes('getNextChallengeTarget(challenge)'), `${page} must keep using the shared daily continuation wrapper`);
}

const runtimeSource = await readFile(new URL('../src/lib/dailyChallenge.js', import.meta.url), 'utf8');
assert.ok(runtimeSource.includes("new URLSearchParams(locationObject?.search || '').get('daily') === '1'"));
assert.ok(runtimeSource.includes("DAILY_CHALLENGE_COMPLETE_PATH = '/?dailyComplete=1'"));
assert.ok(runtimeSource.indexOf('getNextDailyChallengeTarget(challenge)') < runtimeSource.indexOf('navigateDailyChallengeCompletion(challenge, locationObject)'), 'next target must always win before completion handoff');

console.log('Lexia M32 Daily Challenge Handoff contract: PASS (next target first, completed daily → Home, Home/review/curriculum fail closed)');
