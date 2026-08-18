import { getJourneyState, JOURNEY_STAGES } from './journeyEngine.js';

export const REVIEW_COMPLETE_PATH = '/?reviewComplete=1';

export const LEARNER_REVIEW_CHAPTERS = Object.freeze([
  Object.freeze({
    id: 'letters',
    stage: JOURNEY_STAGES.LETTERS,
    title: 'Letras',
    label: 'Mundo das Letras',
    path: '/play?review=1',
  }),
  Object.freeze({
    id: 'syllables-basic',
    stage: JOURNEY_STAGES.SYLLABLES,
    title: 'Sílabas simples',
    label: 'Pontes do Som',
    path: '/play-syllables?review=1',
  }),
  Object.freeze({
    id: 'syllables-complex',
    stage: JOURNEY_STAGES.COMPLEX_SYLLABLES,
    title: 'Sílabas complexas',
    label: 'Labirinto dos Encontros',
    path: '/play-syllables?mode=complex&review=1',
  }),
  Object.freeze({
    id: 'words',
    stage: JOURNEY_STAGES.WORDS,
    title: 'Palavras',
    label: 'Biblioteca Desperta',
    path: '/play-syllables?mode=words&review=1',
  }),
  Object.freeze({
    id: 'sentences',
    stage: JOURNEY_STAGES.SENTENCES,
    title: 'Frases',
    label: 'Jardim das Histórias',
    path: '/play-sentences?review=1',
  }),
]);

const STAGE_ORDER = Object.freeze([
  JOURNEY_STAGES.LETTERS,
  JOURNEY_STAGES.SYLLABLES,
  JOURNEY_STAGES.COMPLEX_SYLLABLES,
  JOURNEY_STAGES.WORDS,
  JOURNEY_STAGES.SENTENCES,
]);

function recordChapterId(record) {
  const key = String(record?.letter || '');
  if (/^[A-Z]$/.test(key)) return 'letters';
  if (key.startsWith('SYLC_')) return 'syllables-complex';
  if (key.startsWith('SYL_')) return 'syllables-basic';
  if (key.startsWith('WORD_')) return 'words';
  if (key.startsWith('SENT_')) return 'sentences';
  return null;
}

function safeReviewTime(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function unlockedStageIndex(journeyStage) {
  if (journeyStage === JOURNEY_STAGES.MASTERY) return STAGE_ORDER.length - 1;
  return Math.max(0, STAGE_ORDER.indexOf(journeyStage));
}

function normalizeNow(now) {
  return Number.isFinite(now) ? now : Date.now();
}

export function buildExactReviewPath(path, entityKey) {
  if (!path || !entityKey) return path || null;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}reviewTarget=${encodeURIComponent(entityKey)}`;
}

export function getRequestedReviewTarget(search = globalThis?.location?.search || '') {
  try {
    const params = new URLSearchParams(search);
    if (params.get('review') !== '1') return null;
    const target = String(params.get('reviewTarget') || '').trim();
    return target || null;
  } catch {
    return null;
  }
}

export function buildLearnerReviewQuest(allProgress = [], options = {}) {
  const records = Array.isArray(allProgress) ? allProgress : [];
  const now = normalizeNow(options?.now);
  const journey = getJourneyState(records);
  const maxUnlockedIndex = unlockedStageIndex(journey.stage);

  const dueRecords = records
    .map((record) => {
      const chapterId = recordChapterId(record);
      const nextReviewAt = safeReviewTime(record?.next_review);
      const attempts = Number(record?.total_attempts || 0);
      const chapterIndex = LEARNER_REVIEW_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
      const due = attempts > 0
        && chapterIndex >= 0
        && chapterIndex <= maxUnlockedIndex
        && nextReviewAt !== null
        && nextReviewAt <= now;
      return { record, chapterId, chapterIndex, nextReviewAt, due };
    })
    .filter((entry) => entry.due)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt || a.chapterIndex - b.chapterIndex);

  const chapters = LEARNER_REVIEW_CHAPTERS
    .map((chapter, index) => {
      const chapterDue = dueRecords.filter((entry) => entry.chapterId === chapter.id);
      const oldestEntityKey = chapterDue[0]?.record?.letter || null;
      return {
        ...chapter,
        unlocked: index <= maxUnlockedIndex,
        dueCount: chapterDue.length,
        oldestDueAt: chapterDue[0]?.nextReviewAt ?? null,
        oldestEntityKey,
        reviewPath: oldestEntityKey ? buildExactReviewPath(chapter.path, oldestEntityKey) : chapter.path,
      };
    })
    .filter((chapter) => chapter.unlocked);

  const nextDue = dueRecords[0] || null;
  const nextChapter = nextDue
    ? chapters.find((chapter) => chapter.id === nextDue.chapterId) || null
    : null;

  return {
    totalDue: dueRecords.length,
    hasDueReviews: dueRecords.length > 0,
    nextChapter,
    nextPath: nextChapter?.reviewPath || null,
    nextEntityKey: nextDue?.record?.letter || null,
    oldestDueAt: nextDue?.nextReviewAt ?? null,
    chapters,
    journeyStage: journey.stage,
  };
}

export function getLearnerReviewContinuation(allProgress = [], options = {}) {
  const reviewQuest = buildLearnerReviewQuest(allProgress, options);
  if (!reviewQuest.hasDueReviews || !reviewQuest.nextPath) {
    return {
      complete: true,
      path: REVIEW_COMPLETE_PATH,
      remainingDue: 0,
      nextEntityKey: null,
      nextChapter: null,
    };
  }
  return {
    complete: false,
    path: reviewQuest.nextPath,
    remainingDue: reviewQuest.totalDue,
    nextEntityKey: reviewQuest.nextEntityKey,
    nextChapter: reviewQuest.nextChapter,
  };
}

export function getLearnerReviewQuestLabel(reviewQuest) {
  const count = Number(reviewQuest?.totalDue || 0);
  if (count <= 0) return 'Revisões em dia';
  if (count === 1) return '1 revisão pronta';
  return `${count} revisões prontas`;
}
