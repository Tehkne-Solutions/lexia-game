import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PARENT_JOURNEY_CHAPTERS,
  PARENT_JOURNEY_TOTAL_TARGETS,
  buildParentJourneyInsights,
  buildParentWeeklyReport,
} from '../src/game/parentInsightsEngine.js';
import { JOURNEY_STAGES } from '../src/game/journeyEngine.js';

assert.equal(PARENT_JOURNEY_TOTAL_TARGETS, 106, 'parent journey must cover 26 letters + four 20-target chapters');
assert.deepEqual(
  PARENT_JOURNEY_CHAPTERS.map((chapter) => [chapter.id, chapter.total]),
  [
    ['letters', 26],
    ['syllables-basic', 20],
    ['syllables-complex', 20],
    ['words', 20],
    ['sentences', 20],
  ],
  'parent chapter totals must mirror the canonical M08 journey',
);

const empty = buildParentJourneyInsights([]);
assert.equal(empty.totalTargets, 106);
assert.equal(empty.totalMastered, 0);
assert.equal(empty.totalAttempts, 0);
assert.equal(empty.overallAccuracy, 0);
assert.equal(empty.chaptersCompleted, 0);
assert.equal(empty.journey.stage, JOURNEY_STAGES.LETTERS);
assert.equal(empty.chapters.length, 5);

const mixed = buildParentJourneyInsights([
  {
    letter: 'I',
    total_attempts: 2,
    correct_attempts: 1,
    stability: 0,
    streak: 1,
    stars_earned: 1,
  },
  {
    letter: 'SYL_BA',
    total_attempts: 3,
    correct_attempts: 3,
    streak: 3,
    stars_earned: 1,
  },
  {
    letter: 'SYLC_BRA',
    total_attempts: 3,
    correct_attempts: 3,
    streak: 4,
    stars_earned: 1,
  },
]);
assert.equal(mixed.totalAttempts, 8, 'overall attempts must include letters + later curriculum records');
assert.equal(mixed.totalCorrect, 7);
assert.equal(mixed.overallAccuracy, 88, 'overall accuracy must not remain letters-only');
assert.equal(mixed.maxStreak, 4, 'overall streak must inspect all curriculum records');
assert.equal(mixed.totalStars, 3);
assert.equal(mixed.chapters.find((chapter) => chapter.id === 'syllables-basic').mastered, 1);
assert.equal(mixed.chapters.find((chapter) => chapter.id === 'syllables-complex').mastered, 1);
assert.equal(
  mixed.chapters.find((chapter) => chapter.id === 'syllables-basic').started,
  1,
  'SYLC_* records must not be counted as SYL_* simple syllables',
);

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
  letter,
  total_attempts: 3,
  correct_attempts: 3,
  stability: 10,
  streak: 5,
  stars_earned: 1,
}));
function masteredFamily(prefix, count) {
  return Array.from({ length: count }, (_, index) => ({
    letter: `${prefix}${String(index + 1).padStart(2, '0')}`,
    total_attempts: 3,
    correct_attempts: 3,
    streak: 3,
    stars_earned: 1,
  }));
}
const complete = buildParentJourneyInsights([
  ...letters,
  ...masteredFamily('SYL_TEST_', 20),
  ...masteredFamily('SYLC_TEST_', 20),
  ...masteredFamily('WORD_TEST_', 20),
  ...masteredFamily('SENT_TEST_', 20),
]);
assert.equal(complete.totalMastered, 106);
assert.equal(complete.totalTargets, 106);
assert.equal(complete.chaptersCompleted, 5);
assert.equal(complete.overallCompletionPct, 100);
assert.equal(complete.journey.stage, JOURNEY_STAGES.MASTERY);
assert.equal(complete.journey.completed, true);
assert.ok(complete.recommendations.some((item) => item.includes('jornada principal foi dominada')));

const report = buildParentWeeklyReport(complete);
for (const text of [
  'Relatório de Jornada — Lexia Game',
  'Progresso geral: 106/106 objetivos dominados (100%)',
  'Capítulos completos: 5/5',
  'Letras: 26/26',
  'Sílabas simples: 20/20',
  'Sílabas complexas: 20/20',
  'Palavras: 20/20',
  'Frases: 20/20',
  'Missão atual: Jornada dominada',
  'Recomendações:',
]) {
  assert.ok(report.includes(text), `weekly parent report missing: ${text}`);
}

const dashboard = await readFile(new URL('../src/pages/ParentDashboard.jsx', import.meta.url), 'utf8');
for (const required of [
  "buildParentJourneyInsights",
  "buildParentWeeklyReport",
  'Jornada de Alfabetização',
  'Precisão geral',
  'Próximo foco em casa',
  'Sílabas, palavras e frases',
  'Relatório de Jornada - Lexia Game',
]) {
  assert.ok(dashboard.includes(required), `Parent Dashboard M12 surface missing: ${required}`);
}
for (const retired of [
  "const letterProgress = allProgress.filter",
  "const totalAttempts = letterProgress.reduce",
  "const totalCorrect = letterProgress.reduce",
  "Relatório Semanal — Lexia Game",
  "Faltam ${26 - lettersMastered} letras",
]) {
  assert.ok(!dashboard.includes(retired), `letters-only parent logic must remain retired: ${retired}`);
}

const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ci.includes('Parent journey insights contract'));
assert.ok(ci.includes('node scripts/check-parent-journey-insights.mjs'));

console.log('Lexia M12 Parent Journey Insights contract: PASS (106-target journey, whole-curriculum accuracy/reporting, letters-only parent regression retired)');
