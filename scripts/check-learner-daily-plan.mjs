import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildLearnerDailyPlan,
  LEARNER_DAILY_PLAN_KIND,
  LEARNER_DAILY_PLAN_STATE,
} from '../src/game/learnerDailyPlanEngine.js';

const firstRunJourney = {
  firstRun: true,
  path: '/play',
  cta: 'Começar jornada',
  title: 'Primeira descoberta',
  description: 'Descubra a letra I.',
  current: 0,
  total: 26,
};

const returningJourney = {
  firstRun: false,
  path: '/play-syllables',
  cta: 'Continuar sílabas',
  title: 'Missão: Sílabas Simples',
  description: 'Combine letras e sons.',
  current: 8,
  total: 53,
};

const dailyChallenge = {
  playPath: '/play-syllables?daily=1&dailyTarget=SYL_BA',
  typeLabel: 'Sílabas simples',
  completed: false,
};

const freshPlan = buildLearnerDailyPlan({
  journey: firstRunJourney,
  reviewQuest: { hasDueReviews: true, totalDue: 9, nextPath: '/play?review=1&reviewTarget=A' },
  dailyChallenge,
  dailyCompletedCount: 0,
});
assert.equal(freshPlan.hasReviewFirst, false, 'first run must never be displaced by review debt');
assert.deepEqual(freshPlan.steps.map((step) => step.kind), [
  LEARNER_DAILY_PLAN_KIND.CURRICULUM,
  LEARNER_DAILY_PLAN_KIND.DAILY_BONUS,
]);
assert.equal(freshPlan.steps[0].path, '/play');
assert.equal(freshPlan.steps[0].state, LEARNER_DAILY_PLAN_STATE.CURRENT);
assert.equal(freshPlan.steps[1].state, LEARNER_DAILY_PLAN_STATE.OPTIONAL);
assert.equal(freshPlan.currentStep.kind, LEARNER_DAILY_PLAN_KIND.CURRICULUM);
assert.equal(freshPlan.nextRequiredStep, null);
assert.equal(freshPlan.requiredCount, 1);
assert.equal(freshPlan.summary, 'Missão atual → bônus opcional');

const duePlan = buildLearnerDailyPlan({
  journey: returningJourney,
  reviewQuest: {
    hasDueReviews: true,
    totalDue: 2,
    nextPath: '/play?review=1&reviewTarget=A',
  },
  dailyChallenge,
  dailyCompletedCount: 1,
});
assert.equal(duePlan.hasReviewFirst, true);
assert.deepEqual(duePlan.steps.map((step) => step.kind), [
  LEARNER_DAILY_PLAN_KIND.REVIEW,
  LEARNER_DAILY_PLAN_KIND.CURRICULUM,
  LEARNER_DAILY_PLAN_KIND.DAILY_BONUS,
]);
assert.deepEqual(duePlan.steps.map((step) => step.state), [
  LEARNER_DAILY_PLAN_STATE.CURRENT,
  LEARNER_DAILY_PLAN_STATE.NEXT,
  LEARNER_DAILY_PLAN_STATE.OPTIONAL,
]);
assert.equal(duePlan.currentStep.kind, LEARNER_DAILY_PLAN_KIND.REVIEW);
assert.equal(duePlan.nextRequiredStep.kind, LEARNER_DAILY_PLAN_KIND.CURRICULUM);
assert.equal(duePlan.steps[0].path, '/play?review=1&reviewTarget=A');
assert.equal(duePlan.steps[0].progressTotal, 2);
assert.equal(duePlan.steps[1].path, '/play-syllables');
assert.equal(duePlan.steps[2].required, false);
assert.equal(duePlan.steps[2].progressCurrent, 1);
assert.equal(duePlan.requiredCount, 2);
assert.equal(duePlan.summary, 'Revisão curta → missão atual → bônus opcional');

const healthyPlan = buildLearnerDailyPlan({
  journey: returningJourney,
  reviewQuest: { hasDueReviews: false, totalDue: 0, nextPath: null },
  dailyChallenge: { ...dailyChallenge, completed: true },
  dailyCompletedCount: 3,
});
assert.deepEqual(healthyPlan.steps.map((step) => step.kind), [
  LEARNER_DAILY_PLAN_KIND.CURRICULUM,
  LEARNER_DAILY_PLAN_KIND.DAILY_BONUS,
]);
assert.equal(healthyPlan.steps[0].state, LEARNER_DAILY_PLAN_STATE.CURRENT);
assert.equal(healthyPlan.steps[1].state, LEARNER_DAILY_PLAN_STATE.COMPLETE);
assert.equal(healthyPlan.steps[1].completed, true);
assert.equal(healthyPlan.steps[1].progressCurrent, 3);
assert.equal(healthyPlan.currentStep.kind, LEARNER_DAILY_PLAN_KIND.CURRICULUM);
assert.equal(healthyPlan.bonusStep.state, LEARNER_DAILY_PLAN_STATE.COMPLETE);
assert.equal(healthyPlan.requiredCount, 1);

const noBonusPlan = buildLearnerDailyPlan({
  journey: returningJourney,
  reviewQuest: { hasDueReviews: false },
  dailyChallenge: null,
});
assert.deepEqual(noBonusPlan.steps.map((step) => step.kind), [LEARNER_DAILY_PLAN_KIND.CURRICULUM]);
assert.equal(noBonusPlan.hasDailyBonus, false);
assert.equal(noBonusPlan.currentStep.state, LEARNER_DAILY_PLAN_STATE.CURRENT);
assert.equal(noBonusPlan.summary, 'Missão atual');

assert.throws(
  () => buildLearnerDailyPlan({ journey: {}, reviewQuest: null, dailyChallenge: null }),
  /requires a valid journey/,
);

const welcomeSource = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
for (const required of [
  'buildLearnerDailyPlan',
  'Plano de aventura',
  'dailyPlan.headline',
  'dailyPlan.summary',
]) {
  assert.ok(welcomeSource.includes(required), `Welcome daily-plan integration missing: ${required}`);
}

const workflowSource = await readFile(new URL('../.github/workflows/learner-daily-plan.yml', import.meta.url), 'utf8');
assert.ok(workflowSource.includes('Learner daily plan contract'));
assert.ok(workflowSource.includes('node scripts/check-learner-daily-plan.mjs'));

console.log('Lexia M30 Learner Daily Plan contract: PASS (current → next → optional/complete focus states, first-run guard, compact Home integration)');
