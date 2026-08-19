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
});
assert.equal(firstRunWithImpossibleReviewDebt.kind, LEARNER_NEXT_ACTION_KIND.CURRICULUM);
assert.equal(firstRunWithImpossibleReviewDebt.path, '/play');
assert.equal(firstRunWithImpossibleReviewDebt.cta, 'Começar com a letra I');

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
});
assert.equal(dueReview.kind, LEARNER_NEXT_ACTION_KIND.REVIEW);
assert.equal(dueReview.path, '/play?review=1&reviewTarget=B');
assert.equal(dueReview.cta, 'Revisar agora');
assert.equal(dueReview.title, 'Letras');
assert.equal(dueReview.totalDue, 4);
assert.equal(dueReview.entityKey, 'B');
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
});
assert.equal(curriculumFallback.kind, LEARNER_NEXT_ACTION_KIND.CURRICULUM);
assert.equal(curriculumFallback.path, '/play-syllables');
assert.equal(curriculumFallback.cta, 'Continuar sílabas');

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

console.log('Lexia M29-B Learner Next Action contract: PASS (first-run priority, due-review priority, curriculum fallback, Home integration)');
