import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildStats } from '../src/lib/achievements.js';
import { buildParentJourneyInsights } from '../src/game/parentInsightsEngine.js';

const mixed = [
  {
    letter: 'I',
    total_attempts: 2,
    correct_attempts: 1,
    streak: 1,
    stability: 0,
    stars_earned: 1,
  },
  {
    letter: 'SYL_BA',
    total_attempts: 3,
    correct_attempts: 3,
    streak: 4,
    stars_earned: 2,
  },
];

const stats = buildStats(mixed);
assert.equal(stats.totalAttempts, 5, 'global attempts must cover letters and later curriculum entities');
assert.equal(stats.totalCorrect, 4);
assert.equal(stats.accuracy, 80, 'global accuracy must cover the whole practiced journey');
assert.equal(stats.maxStreak, 4, 'global streak must inspect the whole journey');
assert.equal(stats.totalStars, 3);
assert.equal(stats.letterAttempts, 2, 'letter chapter diagnostics must remain available');
assert.equal(stats.letterCorrect, 1);
assert.equal(stats.letterAccuracy, 50);
assert.equal(stats.letterMaxStreak, 1);

const insights = buildParentJourneyInsights(mixed);
assert.equal(insights.totalTargets, 106);
assert.equal(insights.totalAttempts, stats.totalAttempts);
assert.equal(insights.totalCorrect, stats.totalCorrect);
assert.equal(insights.overallAccuracy, stats.accuracy, 'learner and parent global accuracy must agree');
assert.equal(insights.maxStreak, stats.maxStreak, 'learner and parent global streak must agree');

const achievementsSource = await readFile(new URL('../src/lib/achievements.js', import.meta.url), 'utf8');
for (const required of [
  'const totalAttempts = records.reduce',
  'const totalCorrect = records.reduce',
  'const maxStreak = records.reduce',
  'const letterAttempts = letterProgress.reduce',
  'const letterAccuracy =',
  'letterMaxStreak',
]) {
  assert.ok(achievementsSource.includes(required), `whole-journey buildStats contract missing: ${required}`);
}
assert.ok(!achievementsSource.includes('const totalAttempts = letterProgress.reduce'), 'global attempts must never regress to letters-only');
assert.ok(!achievementsSource.includes('const totalCorrect = letterProgress.reduce'), 'global correctness must never regress to letters-only');
assert.ok(!achievementsSource.includes('const maxStreak = letterProgress.reduce'), 'global streak must never regress to letters-only');

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
for (const required of [
  'buildParentJourneyInsights',
  'getJourneyWorldExperience',
  'getWorldRelicProgress',
  "label: 'Jornada'",
  'journeyInsights.totalMastered',
  'journeyInsights.totalTargets',
  'relicProgress.unlocked',
  'activeExperience.chapter',
  'stats.letterAccuracy',
  'stats.letterAttempts',
  'Histórico de Letras',
  'overflow-x-auto',
]) {
  assert.ok(profile.includes(required), `learner journey Profile surface missing: ${required}`);
}
assert.ok(!profile.includes("{ icon: Trophy, label: 'Letras'"), 'Profile top trophy must not present letters as the whole journey');
assert.ok(profile.includes("{ id: 'letters', label: '🔤 Letras' }"), 'letter-specific detail tab must remain available');

const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ci.includes('Learner journey profile contract'));
assert.ok(ci.includes('node scripts/check-learner-journey-profile.mjs'));

console.log('Lexia M13 Learner Journey Profile contract: PASS (whole-journey global stats, 106-target learner profile, letter diagnostics preserved)');
