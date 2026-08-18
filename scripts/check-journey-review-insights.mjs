import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildParentJourneyInsights,
  buildParentWeeklyReport,
} from '../src/game/parentInsightsEngine.js';

const now = Date.parse('2026-08-18T18:00:00.000Z');
const hour = 60 * 60 * 1000;
const progress = [
  {
    letter: 'A',
    total_attempts: 5,
    correct_attempts: 5,
    streak: 5,
    stability: 8,
    stars_earned: 3,
    next_review: new Date(now - 2 * hour).toISOString(),
  },
  {
    letter: 'B',
    total_attempts: 4,
    correct_attempts: 4,
    streak: 4,
    stability: 6,
    stars_earned: 2,
    next_review: new Date(now + 5 * hour).toISOString(),
  },
  {
    letter: 'SYL_BA',
    total_attempts: 3,
    correct_attempts: 3,
    streak: 3,
    stability: 2,
    stars_earned: 2,
    next_review: new Date(now - hour).toISOString(),
  },
  {
    letter: 'WORD_CASA',
    total_attempts: 3,
    correct_attempts: 3,
    streak: 3,
    stability: 4,
    stars_earned: 2,
    next_review: new Date(now + 2 * hour).toISOString(),
  },
  {
    letter: 'SENT_01',
    total_attempts: 3,
    correct_attempts: 3,
    streak: 3,
    stability: 0,
    stars_earned: 1,
    next_review: 'not-a-date',
  },
  {
    letter: 'SYLC_BRA',
    total_attempts: 0,
    correct_attempts: 0,
    stability: 0,
    next_review: new Date(now - hour).toISOString(),
  },
];

const insights = buildParentJourneyInsights(progress, { now });
assert.equal(insights.dueReviews, 2, 'only attempted records with due timestamps count as ready reviews');
assert.equal(insights.scheduledReviews, 4, 'only attempted records with valid FSRS timestamps count as scheduled');
assert.equal(insights.upcomingReviews, 2, 'two reviews are scheduled in the future');
assert.equal(insights.nextReviewAt, new Date(now + 2 * hour).toISOString(), 'nearest future review must win globally');
assert.equal(insights.averageStability, 5, 'average stability ignores zero/uninitialized legacy stability');

const letters = insights.chapters.find((chapter) => chapter.id === 'letters');
const simple = insights.chapters.find((chapter) => chapter.id === 'syllables-basic');
const complex = insights.chapters.find((chapter) => chapter.id === 'syllables-complex');
const words = insights.chapters.find((chapter) => chapter.id === 'words');
const sentences = insights.chapters.find((chapter) => chapter.id === 'sentences');

assert.equal(letters.dueReviews, 1);
assert.equal(letters.upcomingReviews, 1);
assert.equal(letters.nextReviewAt, new Date(now + 5 * hour).toISOString());
assert.equal(simple.dueReviews, 1);
assert.equal(simple.upcomingReviews, 0);
assert.equal(words.dueReviews, 0);
assert.equal(words.upcomingReviews, 1);
assert.equal(words.nextReviewAt, new Date(now + 2 * hour).toISOString());
assert.equal(complex.scheduledReviews, 0, 'unattempted future/due timestamps are ignored');
assert.equal(sentences.scheduledReviews, 0, 'invalid legacy timestamps are not invented into scheduler data');

assert.equal(simple.mastered, 1, 'M19 must not reclassify existing advanced curriculum mastery');
assert.equal(words.mastered, 1, 'legacy 3-success mastery remains intact while FSRS is introduced');
assert.equal(sentences.mastered, 1, 'legacy records with zero stability must not lose mastered status');
assert.ok(
  insights.recommendations.some((recommendation) => recommendation.includes('2 revisões estão prontas agora')),
  'due reviews must become an actionable parent recommendation',
);

const report = buildParentWeeklyReport(insights);
assert.ok(report.includes('Revisões prontas agora: 2'));
assert.ok(report.includes('Revisões com agenda FSRS: 4'));
assert.ok(report.includes(`Próxima revisão futura: ${new Date(now + 2 * hour).toISOString()}`));
assert.ok(report.includes('Sílabas simples: 1/20 dominados'));
assert.ok(report.includes('Revisões agora 1'));

const engineSource = await readFile(new URL('../src/game/parentInsightsEngine.js', import.meta.url), 'utf8');
assert.ok(engineSource.includes('function summarizeReviewReadiness(records, now)'));
assert.ok(engineSource.includes('dueReviews'));
assert.ok(engineSource.includes('scheduledReviews'));
assert.ok(engineSource.includes('nextReviewAt'));
assert.ok(engineSource.includes('averageStability'));
assert.ok(engineSource.includes('function isRepeatedSuccessMastered(record)'), 'legacy advanced mastery rule must remain explicit during compatibility phase');
assert.ok(engineSource.includes('const now = Number.isFinite(options?.now)'), 'review insight clock must be injectable for deterministic tests');

const dashboardSource = await readFile(new URL('../src/pages/ParentDashboard.jsx', import.meta.url), 'utf8');
assert.ok(dashboardSource.includes('Ritmo de Revisão'));
assert.ok(dashboardSource.includes('Prontas agora'));
assert.ok(dashboardSource.includes('Estabilidade média'));
assert.ok(dashboardSource.includes('formatNextReview(insights.nextReviewAt)'));
assert.ok(dashboardSource.includes('o FSRS organiza revisões adaptativas em toda a jornada'));
assert.ok(dashboardSource.includes('Sílabas, palavras e frases também entram no ritmo de revisão'));
assert.ok(dashboardSource.includes('Os critérios de domínio curricular continuam preservados'));
assert.ok(!dashboardSource.includes('letras usam o algoritmo de repetição espaçada FSRS'), 'outdated letters-only FSRS explanation must be removed');

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Journey review insights contract'));
assert.ok(ciSource.includes('node scripts/check-journey-review-insights.mjs'));
assert.ok(ciSource.includes('Review insights browser QA'));

console.log('Lexia M19 Journey Review Insights contract: PASS (whole-journey due/upcoming schedule, deterministic clock, legacy mastery preserved)');
