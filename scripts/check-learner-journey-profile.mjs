import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildJourneyStats,
  isJourneyProgressMastered,
} from '../src/game/journeyStatsEngine.js';
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

const stats = buildJourneyStats(mixed);
assert.equal(stats.totalAttempts, 5, 'global attempts must cover letters and later curriculum entities');
assert.equal(stats.totalCorrect, 4);
assert.equal(stats.accuracy, 80, 'global accuracy must cover the whole practiced journey');
assert.equal(stats.maxStreak, 4, 'global streak must inspect the whole journey');
assert.equal(stats.totalStars, 3);
assert.equal(stats.letterAttempts, 2, 'letter chapter diagnostics must remain available');
assert.equal(stats.letterCorrect, 1);
assert.equal(stats.letterAccuracy, 50);
assert.equal(stats.letterMaxStreak, 1);
assert.equal(isJourneyProgressMastered(mixed[0]), false, 'weak letter attempt must not be mastered');
assert.equal(isJourneyProgressMastered(mixed[1]), true, 'repeated-success syllable must be mastered');

const insights = buildParentJourneyInsights(mixed);
assert.equal(insights.totalTargets, 106);
assert.equal(insights.totalAttempts, stats.totalAttempts);
assert.equal(insights.totalCorrect, stats.totalCorrect);
assert.equal(insights.overallAccuracy, stats.accuracy, 'learner and parent global accuracy must agree');
assert.equal(insights.maxStreak, stats.maxStreak, 'learner and parent global streak must agree');

const statsEngineSource = await readFile(new URL('../src/game/journeyStatsEngine.js', import.meta.url), 'utf8');
for (const required of [
  "import { calculateMastery } from '../learning/mastery.js'",
  'const totalAttempts = records.reduce',
  'const totalCorrect = records.reduce',
  'const maxStreak = records.reduce',
  'const letterAttempts = letterProgress.reduce',
  'const letterAccuracy =',
  'letterMaxStreak',
  "key.startsWith('SYL_')",
  "key.startsWith('SYLC_')",
  "key.startsWith('WORD_')",
  "key.startsWith('SENT_')",
]) {
  assert.ok(statsEngineSource.includes(required), `pure whole-journey stats engine missing: ${required}`);
}
for (const forbidden of [
  "from '@/",
  'const totalAttempts = letterProgress.reduce',
  'const totalCorrect = letterProgress.reduce',
  'const maxStreak = letterProgress.reduce',
]) {
  assert.ok(!statsEngineSource.includes(forbidden), `pure journey stats engine must not contain: ${forbidden}`);
}

const achievementsSource = await readFile(new URL('../src/lib/achievements.js', import.meta.url), 'utf8');
for (const required of [
  "from '../game/journeyStatsEngine.js'",
  'buildJourneyStats',
  'isJourneyProgressMastered',
  'return isJourneyProgressMastered(progress)',
  'return buildJourneyStats(allProgress)',
  'Atinja 80% de precisão geral',
  'Faça 50 tentativas no total',
]) {
  assert.ok(achievementsSource.includes(required), `achievement compatibility/delegation missing: ${required}`);
}
assert.ok(!achievementsSource.includes("from '@/lib/fsrs'"), 'achievement facade must not own mastery math after M13');

const stickersSource = await readFile(new URL('../src/lib/stickers.js', import.meta.url), 'utf8');
assert.ok(stickersSource.includes("import { isProgressMastered } from '@/lib/achievements'"), 'sticker compatibility import must remain valid');

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

console.log('Lexia M13 Learner Journey Profile contract: PASS (pure whole-journey stats engine, 106-target learner profile, letter diagnostics preserved)');
