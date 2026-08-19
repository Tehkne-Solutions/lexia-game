import { calculateMastery } from '../learning/mastery.js';
import { getJourneyState, JOURNEY_STAGES, JOURNEY_TARGET_TOTALS } from './journeyEngine.js';

const LETTER_KEY = /^[A-Z]$/;

function keyOf(record) {
  return String(record?.letter || '').toUpperCase();
}

function isRepeatedSuccessMastered(record) {
  const attempts = Number(record?.total_attempts || 0);
  const correct = Number(record?.correct_attempts || 0);
  return attempts > 0 && correct >= 3 && correct / attempts >= 0.6;
}

function reviewTime(record) {
  const parsed = Date.parse(record?.next_review || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeReviewReadiness(records, now) {
  const attempted = records.filter((record) => Number(record?.total_attempts || 0) > 0);
  const scheduled = attempted
    .map((record) => ({ record, dueAt: reviewTime(record) }))
    .filter((item) => item.dueAt !== null);
  const due = scheduled.filter((item) => item.dueAt <= now);
  const upcoming = scheduled
    .filter((item) => item.dueAt > now)
    .sort((a, b) => a.dueAt - b.dueAt);
  const stabilityValues = attempted
    .map((record) => Number(record?.stability || 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageStability = stabilityValues.length > 0
    ? Math.round((stabilityValues.reduce((sum, value) => sum + value, 0) / stabilityValues.length) * 10) / 10
    : 0;

  return {
    dueReviews: due.length,
    scheduledReviews: scheduled.length,
    upcomingReviews: upcoming.length,
    nextReviewAt: upcoming[0]?.dueAt ? new Date(upcoming[0].dueAt).toISOString() : null,
    averageStability,
  };
}

export const PARENT_JOURNEY_CHAPTERS = Object.freeze([
  Object.freeze({
    id: 'letters',
    stage: JOURNEY_STAGES.LETTERS,
    label: 'Mundo das Letras',
    shortLabel: 'Letras',
    total: JOURNEY_TARGET_TOTALS.LETTERS,
    emoji: '🔤',
    matches: (record) => LETTER_KEY.test(keyOf(record)),
    isMastered: (record) => calculateMastery(record) >= 80,
  }),
  Object.freeze({
    id: 'syllables-basic',
    stage: JOURNEY_STAGES.SYLLABLES,
    label: 'Sílabas Simples',
    shortLabel: 'Sílabas simples',
    total: JOURNEY_TARGET_TOTALS.SYLLABLES,
    emoji: '🌉',
    matches: (record) => keyOf(record).startsWith('SYL_'),
    isMastered: isRepeatedSuccessMastered,
  }),
  Object.freeze({
    id: 'syllables-complex',
    stage: JOURNEY_STAGES.COMPLEX_SYLLABLES,
    label: 'Sílabas Complexas',
    shortLabel: 'Sílabas complexas',
    total: JOURNEY_TARGET_TOTALS.COMPLEX_SYLLABLES,
    emoji: '🧭',
    matches: (record) => keyOf(record).startsWith('SYLC_'),
    isMastered: isRepeatedSuccessMastered,
  }),
  Object.freeze({
    id: 'words',
    stage: JOURNEY_STAGES.WORDS,
    label: 'Primeiras Palavras',
    shortLabel: 'Palavras',
    total: JOURNEY_TARGET_TOTALS.WORDS,
    emoji: '📚',
    matches: (record) => keyOf(record).startsWith('WORD_'),
    isMastered: isRepeatedSuccessMastered,
  }),
  Object.freeze({
    id: 'sentences',
    stage: JOURNEY_STAGES.SENTENCES,
    label: 'Frases Mágicas',
    shortLabel: 'Frases',
    total: JOURNEY_TARGET_TOTALS.SENTENCES,
    emoji: '🌱',
    matches: (record) => keyOf(record).startsWith('SENT_'),
    isMastered: isRepeatedSuccessMastered,
  }),
]);

export const PARENT_JOURNEY_TOTAL_TARGETS = PARENT_JOURNEY_CHAPTERS.reduce(
  (sum, chapter) => sum + chapter.total,
  0,
);

function summarizeChapter(chapter, records, now) {
  const chapterRecords = records.filter(chapter.matches);
  const started = chapterRecords.filter((record) => Number(record?.total_attempts || 0) > 0).length;
  const mastered = chapterRecords.filter(chapter.isMastered).length;
  const attempts = chapterRecords.reduce((sum, record) => sum + Number(record?.total_attempts || 0), 0);
  const correct = chapterRecords.reduce((sum, record) => sum + Number(record?.correct_attempts || 0), 0);
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const completionPct = Math.min(100, Math.round((mastered / chapter.total) * 100));
  const review = summarizeReviewReadiness(chapterRecords, now);

  return {
    id: chapter.id,
    stage: chapter.stage,
    label: chapter.label,
    shortLabel: chapter.shortLabel,
    emoji: chapter.emoji,
    total: chapter.total,
    started,
    mastered,
    attempts,
    correct,
    accuracy,
    completionPct,
    completed: mastered >= chapter.total,
    ...review,
  };
}

function buildRecommendations({ chapters, journey, overallAccuracy, totalAttempts, maxStreak, dueReviews }) {
  const current = chapters.find((chapter) => chapter.stage === journey.stage) || chapters.at(-1);
  const remaining = current ? Math.max(current.total - current.mastered, 0) : 0;
  const recommendations = [];

  if (journey.completed) {
    recommendations.push('A jornada principal foi dominada. Mantenha revisões curtas na Torre da Maestria para consolidar o aprendizado.');
  } else if (current) {
    recommendations.push(`Foco atual: ${current.label}. Faltam ${remaining} objetivos para dominar este capítulo.`);
  }

  if (dueReviews > 0) {
    recommendations.push(`${dueReviews} ${dueReviews === 1 ? 'revisão está pronta' : 'revisões estão prontas'} agora. Uma sessão curta de revisão ajuda a consolidar o que já foi aprendido.`);
  }

  if (totalAttempts === 0) {
    recommendations.push('Comece com uma sessão curta e acompanhe a evolução depois das primeiras tentativas.');
  } else if (overallAccuracy < 70) {
    recommendations.push('Priorize precisão em vez de velocidade: sessões menores e calmas ajudam a consolidar os pontos difíceis.');
  } else if (overallAccuracy >= 85) {
    recommendations.push('A precisão geral está forte. Continue avançando sem abandonar revisões dos capítulos anteriores.');
  } else {
    recommendations.push('A precisão está estável. Mantenha a frequência de prática e revise erros logo após cada sessão.');
  }

  if (recommendations.length < 3 && maxStreak < 5 && totalAttempts > 0) {
    recommendations.push('Uma meta simples para a próxima sessão: construir uma sequência de 5 acertos com atenção e sem pressa.');
  } else if (recommendations.length < 3 && maxStreak >= 5) {
    recommendations.push(`Maior sequência atual: ${maxStreak}. Use esse ritmo como motivação, sem transformar sequência em pressão.`);
  }

  return recommendations.slice(0, 3);
}

export function buildParentJourneyInsights(allProgress = [], options = {}) {
  const records = Array.isArray(allProgress) ? allProgress : [];
  const now = Number.isFinite(options?.now) ? Number(options.now) : Date.now();
  const chapters = PARENT_JOURNEY_CHAPTERS.map((chapter) => summarizeChapter(chapter, records, now));
  const journey = getJourneyState(records);
  const review = summarizeReviewReadiness(records, now);

  const totalStars = records.reduce((sum, record) => sum + Number(record?.stars_earned || 0), 0);
  const totalAttempts = records.reduce((sum, record) => sum + Number(record?.total_attempts || 0), 0);
  const totalCorrect = records.reduce((sum, record) => sum + Number(record?.correct_attempts || 0), 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const maxStreak = records.reduce((max, record) => Math.max(max, Number(record?.streak || 0)), 0);
  const totalMastered = chapters.reduce((sum, chapter) => sum + chapter.mastered, 0);
  const chaptersCompleted = chapters.filter((chapter) => chapter.completed).length;
  const overallCompletionPct = Math.min(100, Math.round((totalMastered / PARENT_JOURNEY_TOTAL_TARGETS) * 100));
  const recommendations = buildRecommendations({
    chapters,
    journey,
    overallAccuracy,
    totalAttempts,
    maxStreak,
    dueReviews: review.dueReviews,
  });

  return {
    chapters,
    journey,
    totalStars,
    totalAttempts,
    totalCorrect,
    overallAccuracy,
    maxStreak,
    totalMastered,
    totalTargets: PARENT_JOURNEY_TOTAL_TARGETS,
    chaptersCompleted,
    totalChapters: PARENT_JOURNEY_CHAPTERS.length,
    overallCompletionPct,
    recommendations,
    ...review,
  };
}

export function buildParentWeeklyReport(insights) {
  const safe = insights || buildParentJourneyInsights([]);
  const chapterLines = (safe.chapters || [])
    .map((chapter) => `• ${chapter.shortLabel}: ${chapter.mastered}/${chapter.total} dominados (${chapter.completionPct}%) · Precisão ${chapter.accuracy}% · Revisões agora ${chapter.dueReviews}`)
    .join('\n');
  const recommendationLines = (safe.recommendations || []).map((item) => `• ${item}`).join('\n');

  return [
    'Relatório de Jornada — Lexia Game',
    '',
    `Progresso geral: ${safe.totalMastered}/${safe.totalTargets} objetivos dominados (${safe.overallCompletionPct}%)`,
    `Capítulos completos: ${safe.chaptersCompleted}/${safe.totalChapters}`,
    `Estrelas: ${safe.totalStars}`,
    `Precisão geral: ${safe.overallAccuracy}%`,
    `Maior sequência: ${safe.maxStreak}`,
    `Tentativas totais: ${safe.totalAttempts}`,
    `Revisões prontas agora: ${safe.dueReviews || 0}`,
    `Revisões com agenda FSRS: ${safe.scheduledReviews || 0}`,
    `Próxima revisão futura: ${safe.nextReviewAt || 'nenhuma agendada'}`,
    '',
    'Capítulos:',
    chapterLines,
    '',
    `Missão atual: ${safe.journey?.title || 'Primeira descoberta'}`,
    '',
    'Recomendações:',
    recommendationLines,
    '',
    'Continue aprendendo com a Corujinha!',
  ].join('\n');
}
