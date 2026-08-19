import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALPHABET } from '../src/lib/alphabetData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../src/lib/syllablesData.js';
import { BASIC_SENTENCES } from '../src/lib/sentencesData.js';
import {
  PARENT_JOURNEY_CHAPTERS,
  PARENT_JOURNEY_TOTAL_TARGETS,
  buildParentJourneyInsights,
  buildParentWeeklyReport,
} from '../src/game/parentInsightsEngine.js';
import { JOURNEY_STAGES, JOURNEY_TARGET_TOTALS, JOURNEY_TOTAL_TARGETS } from '../src/game/journeyEngine.js';

assert.equal(PARENT_JOURNEY_TOTAL_TARGETS, JOURNEY_TOTAL_TARGETS, 'parent journey must use the canonical Journey Engine cardinality');
assert.deepEqual(
  PARENT_JOURNEY_CHAPTERS.map((chapter) => [chapter.id, chapter.total]),
  [
    ['letters', JOURNEY_TARGET_TOTALS.LETTERS],
    ['syllables-basic', JOURNEY_TARGET_TOTALS.SYLLABLES],
    ['syllables-complex', JOURNEY_TARGET_TOTALS.COMPLEX_SYLLABLES],
    ['words', JOURNEY_TARGET_TOTALS.WORDS],
    ['sentences', JOURNEY_TARGET_TOTALS.SENTENCES],
  ],
);

const empty = buildParentJourneyInsights([]);
assert.equal(empty.totalTargets, JOURNEY_TOTAL_TARGETS);
assert.equal(empty.totalMastered, 0);
assert.equal(empty.chaptersCompleted, 0);
assert.equal(empty.journey.stage, JOURNEY_STAGES.LETTERS);
assert.equal(empty.chapters.length, 5);

const mixed = buildParentJourneyInsights([
  { letter: 'I', total_attempts: 2, correct_attempts: 1, stability: 0, streak: 1, stars_earned: 1 },
  { letter: 'SYL_BA', total_attempts: 3, correct_attempts: 3, streak: 3, stars_earned: 1 },
  { letter: 'SYLC_BRA', total_attempts: 3, correct_attempts: 3, streak: 4, stars_earned: 1 },
]);
assert.equal(mixed.totalAttempts, 8);
assert.equal(mixed.totalCorrect, 7);
assert.equal(mixed.overallAccuracy, 88);
assert.equal(mixed.maxStreak, 4);
assert.equal(mixed.totalStars, 3);
assert.equal(mixed.chapters.find((chapter) => chapter.id === 'syllables-basic').mastered, 1);
assert.equal(mixed.chapters.find((chapter) => chapter.id === 'syllables-complex').mastered, 1);
assert.equal(mixed.chapters.find((chapter) => chapter.id === 'syllables-basic').started, 1);

const mastered = (letter) => ({
  letter,
  total_attempts: 3,
  correct_attempts: 3,
  stability: 10,
  streak: 5,
  stars_earned: 1,
});
const completeRecords = [
  ...ALPHABET.map((item) => mastered(item.letter)),
  ...BASIC_SYLLABLES.map((item) => mastered(`SYL_${item.syllable}`)),
  ...COMPLEX_SYLLABLES.map((item) => mastered(`SYLC_${item.syllable}`)),
  ...BASIC_WORDS.map((item) => mastered(`WORD_${item.word}`)),
  ...BASIC_SENTENCES.map((item) => mastered(`SENT_${item.id}`)),
];
const complete = buildParentJourneyInsights(completeRecords);
assert.equal(complete.totalMastered, JOURNEY_TOTAL_TARGETS);
assert.equal(complete.totalTargets, JOURNEY_TOTAL_TARGETS);
assert.equal(complete.chaptersCompleted, 5);
assert.equal(complete.overallCompletionPct, 100);
assert.equal(complete.journey.stage, JOURNEY_STAGES.MASTERY);
assert.equal(complete.journey.completed, true);
assert.ok(complete.recommendations.some((item) => item.includes('jornada principal foi dominada')));

const report = buildParentWeeklyReport(complete);
for (const text of [
  'Relatório de Jornada — Lexia Game',
  `Progresso geral: ${JOURNEY_TOTAL_TARGETS}/${JOURNEY_TOTAL_TARGETS} objetivos dominados (100%)`,
  'Capítulos completos: 5/5',
  `Letras: ${ALPHABET.length}/${ALPHABET.length}`,
  `Sílabas simples: ${BASIC_SYLLABLES.length}/${BASIC_SYLLABLES.length}`,
  `Sílabas complexas: ${COMPLEX_SYLLABLES.length}/${COMPLEX_SYLLABLES.length}`,
  `Palavras: ${BASIC_WORDS.length}/${BASIC_WORDS.length}`,
  `Frases: ${BASIC_SENTENCES.length}/${BASIC_SENTENCES.length}`,
  'Missão atual: Jornada dominada',
  'Recomendações:',
]) {
  assert.ok(report.includes(text), `weekly parent report missing: ${text}`);
}

const dashboard = await readFile(new URL('../src/pages/ParentDashboard.jsx', import.meta.url), 'utf8');
for (const required of [
  'buildParentJourneyInsights',
  'buildParentWeeklyReport',
  'Jornada de Alfabetização',
  'Precisão geral',
  'Próximo foco em casa',
  'Sílabas, palavras e frases',
]) {
  assert.ok(dashboard.includes(required), `Parent Dashboard M12 surface missing: ${required}`);
}

console.log(`Lexia M12/M27 Parent Journey Insights contract: PASS (${JOURNEY_TOTAL_TARGETS} canonical targets)`);
