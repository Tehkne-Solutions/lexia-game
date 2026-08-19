import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getLearnerNextAction,
  LEARNER_NEXT_ACTION_KIND,
} from '../src/game/learnerNextActionEngine.js';

const firstRunJourney = {
  firstRun: true,
  path: '/play',
  cta: 'Começar com a letra I',
  title: 'Primeira descoberta',
  description: 'Descubra sua primeira letra.',
};

const firstRunWithImpossibleReviewDebt = getLearnerNextAction(firstRunJourney, {
  hasDueReviews: true,
  totalDue: 3,
  nextPath: '/play?review=1&reviewTarget=A',
  nextEntityKey: 'A',
}, { reviewCompleted: true, dailyCompleted: true });
assert.equal(firstRunWithImpossibleReviewDebt.kind, LEARNER_NEXT_ACTION_KIND.CURRICULUM);
assert.equal(firstRunWithImpossibleReviewDebt.path, '/play');
assert.equal(firstRunWithImpossibleReviewDebt.cta, 'Começar com a letra I');
assert.equal(firstRunWithImpossibleReviewDebt.reviewCompleted, false);
assert.equal(firstRunWithImpossibleReviewDebt.dailyCompleted, false);

const activeJourney = {
  firstRun: false,
  path: '/play-syllables',
  cta: 'Continuar sílabas',
  title: 'Sílabas Simples',
  description: 'Continue atravessando as pontes do som.',
};

const dueReview = getLearnerNextAction(activeJourney, {
  hasDueReviews: true,
  totalDue: 4,
  nextPath: '/play?review=1&reviewTarget=B',
  nextEntityKey: 'B',
  nextChapter: { id: 'letters', title: 'Letras' },
}, { reviewCompleted: true, dailyCompleted: true });
assert.equal(dueReview.kind, LEARNER_NEXT_ACTION_KIND.REVIEW);
assert.equal(dueReview.path, '/play?review=1&reviewTarget=B');
assert.equal(dueReview.cta, 'Revisar agora');
assert.equal(dueReview.title, 'Letras');
assert.equal(dueReview.totalDue, 4);
assert.equal(dueReview.entityKey, 'B');
assert.equal(dueReview.reviewCompleted, false);
assert.equal(dueReview.dailyCompleted, false);
assert.match(dueReview.description, /4 revisões prontas/);

const singleDueReview = getLearnerNextAction(activeJourney, {
  hasDueReviews: true,
  totalDue: 1,
  nextPath: '/play-syllables?review=1&reviewTarget=SYL_BA',
  nextEntityKey: 'SYL_BA',
  nextChapter: { title: 'Sílabas Simples' },
});
assert.match(singleDueReview.description, /1 revisão pronta/);

const curriculumFallback = getLearnerNextAction(activeJourney, {
  hasDueReviews: false,
  totalDue: 0,
  nextPath: null,
}, { reviewCompleted: false, dailyCompleted: false });
assert.equal(curriculumFallback.kind, LEARNER_NEXT_ACTION_KIND.CURRICULUM);
assert.equal(curriculumFallback.path, '/play-syllables');
assert.equal(curriculumFallback.cta, 'Continuar sílabas');
assert.equal(curriculumFallback.reviewCompleted, false);
assert.equal(curriculumFallback.dailyCompleted, false);

const postReviewHandoff = getLearnerNextAction(activeJourney, {
  hasDueReviews: false,
  totalDue: 0,
  nextPath: null,
}, { reviewCompleted: true, dailyCompleted: false });
assert.equal(postReviewHandoff.kind, LEARNER_NEXT_ACTION_KIND.CURRICULUM);
assert.equal(postReviewHandoff.path, '/play-syllables');
assert.equal(postReviewHandoff.cta, 'Continuar missão');
assert.equal(postReviewHandoff.reviewCompleted, true);
assert.equal(postReviewHandoff.dailyCompleted, false);
assert.match(postReviewHandoff.description, /^Revisões concluídas\./);
assert.match(postReviewHandoff.description, /Continue atravessando as pontes do som/);

const postDailyHandoff = getLearnerNextAction(activeJourney, {
  hasDueReviews: false,
  totalDue: 0,
  nextPath: null,
}, { reviewCompleted: false, dailyCompleted: true });
assert.equal(postDailyHandoff.kind, LEARNER_NEXT_ACTION_KIND.CURRICULUM);
assert.equal(postDailyHandoff.path, '/play-syllables');
assert.equal(postDailyHandoff.cta, 'Continuar missão');
assert.equal(postDailyHandoff.title, 'Bônus concluído!');
assert.equal(postDailyHandoff.reviewCompleted, false);
assert.equal(postDailyHandoff.dailyCompleted, true);
assert.match(postDailyHandoff.description, /^Desafio diário concluído\./);
assert.match(postDailyHandoff.description, /Continue atravessando as pontes do som/);

const originalLocation = globalThis.location;
try {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { search: '?reviewComplete=1' },
  });
  const routeDerivedReview = getLearnerNextAction(activeJourney, {
    hasDueReviews: false,
    totalDue: 0,
    nextPath: null,
  });
  assert.equal(routeDerivedReview.path, '/play-syllables');
  assert.equal(routeDerivedReview.cta, 'Continuar missão');
  assert.equal(routeDerivedReview.reviewCompleted, true);
  assert.equal(routeDerivedReview.dailyCompleted, false);

  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { search: '?dailyComplete=1' },
  });
  const routeDerivedDaily = getLearnerNextAction(activeJourney, {
    hasDueReviews: false,
    totalDue: 0,
    nextPath: null,
  });
  assert.equal(routeDerivedDaily.path, '/play-syllables');
  assert.equal(routeDerivedDaily.cta, 'Continuar missão');
  assert.equal(routeDerivedDaily.title, 'Bônus concluído!');
  assert.equal(routeDerivedDaily.reviewCompleted, false);
  assert.equal(routeDerivedDaily.dailyCompleted, true);
} finally {
  if (originalLocation === undefined) delete globalThis.location;
  else Object.defineProperty(globalThis, 'location', { configurable: true, value: originalLocation });
}

assert.throws(
  () => getLearnerNextAction({ firstRun: false }, null),
  /valid journey path and CTA/,
  'invalid journey state must fail closed',
);

const welcomeSource = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcomeSource.includes('getLearnerNextAction'));
assert.ok(welcomeSource.includes('primaryAction.path'));
assert.ok(welcomeSource.includes('primaryAction.cta'));
assert.ok(welcomeSource.includes("primaryAction.kind === 'review'"));

console.log('Lexia M33 Learner Next Action contract: PASS (first-run, due-review, post-review and post-daily handoff priorities)');
