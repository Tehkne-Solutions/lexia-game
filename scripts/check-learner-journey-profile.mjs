import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildJourneyStats,
  isJourneyProgressMastered,
} from '../src/game/journeyStatsEngine.js';
import { buildParentJourneyInsights } from '../src/game/parentInsightsEngine.js';
import { JOURNEY_TOTAL_TARGETS } from '../src/game/journeyEngine.js';

const mixed = [
  { letter: 'I', total_attempts: 2, correct_attempts: 1, streak: 1, stability: 0, stars_earned: 1 },
  { letter: 'SYL_BA', total_attempts: 3, correct_attempts: 3, streak: 4, stars_earned: 2 },
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
assert.equal(insights.totalTargets, JOURNEY_TOTAL_TARGETS);
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

const achievementsSource = await readFile(new URL('../src/lib/achievements.js', import.meta.url), 'utf8');
for (const required of [
  "from '../game/journeyStatsEngine.js'",
  'buildJourneyStats',
  'isJourneyProgressMastered',
  'return isJourneyProgressMastered(progress)',
  'return buildJourneyStats(allProgress)',
]) {
  assert.ok(achievementsSource.includes(required), `achievement compatibility/delegation missing: ${required}`);
}

const [profile, profileContent, viewModel, profileStats] = await Promise.all([
  readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/hooks/useProfileViewModel.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/profile/ProfileStats.jsx', import.meta.url), 'utf8'),
]);

for (const required of [
  'buildParentJourneyInsights',
  'getJourneyWorldExperience',
  'getWorldRelicProgress',
]) {
  assert.ok(viewModel.includes(required), `learner journey view model missing: ${required}`);
}

for (const required of [
  'journeyInsights.totalMastered',
  'journeyInsights.totalTargets',
  "import ProfileStats from '@/components/profile/ProfileStats'",
]) {
  assert.ok(profileContent.includes(required), `learner journey ProfileContent surface missing: ${required}`);
}

for (const required of [
  "label: 'Jornada'",
  'journeyMastered',
  'journeyTotal',
]) {
  assert.ok(profileStats.includes(required), `learner journey ProfileStats surface missing: ${required}`);
}

console.log(`Lexia M13/M27 Learner Journey Profile contract: PASS (${JOURNEY_TOTAL_TARGETS}-target learner profile)`);
