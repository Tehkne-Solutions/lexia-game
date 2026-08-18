import { calculateMastery } from './mastery.js';
import { createNewCard, reviewCard } from '../lib/fsrs.js';

function toCard(record) {
  if (!record) return createNewCard();
  return {
    stability: Number(record.stability || 0),
    difficulty: Number(record.difficulty || 0),
    interval: Number(record.interval || 0),
    repetitions: Number(record.repetitions || 0),
    nextReview: record.next_review || new Date().toISOString(),
    lastGrade: Number(record.last_grade || 0),
  };
}

export function reviewJourneyProgress(existing, isCorrect) {
  const grade = isCorrect ? 3 : 1;
  const reviewed = reviewCard(toCard(existing), grade);
  return {
    stability: reviewed.stability,
    difficulty: reviewed.difficulty,
    interval: reviewed.interval,
    repetitions: reviewed.repetitions,
    next_review: reviewed.nextReview,
    last_grade: reviewed.lastGrade,
  };
}

function itemEntityKey(item, entityPrefix, targetKey) {
  return `${entityPrefix}${item?.[targetKey] ?? ''}`;
}

function safeTime(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function accuracy(record) {
  const attempts = Number(record?.total_attempts || 0);
  if (attempts <= 0) return 0;
  return Number(record?.correct_attempts || 0) / attempts;
}

export function rankJourneyReviewItems({
  items = [],
  allProgress = [],
  entityPrefix = '',
  targetKey,
  currentIndex = -1,
  now = Date.now(),
}) {
  const progressMap = new Map(
    (allProgress || []).map((record) => [String(record?.letter || ''), record]),
  );

  return items
    .map((item, index) => {
      const key = itemEntityKey(item, entityPrefix, targetKey);
      const record = progressMap.get(key);
      const attempts = Number(record?.total_attempts || 0);
      const nextReviewAt = safeTime(record?.next_review);
      const due = attempts > 0 && nextReviewAt <= now;
      const started = attempts > 0;
      const mastery = calculateMastery(record);
      const weak = started && (accuracy(record) < 0.6 || mastery < 50);

      let bucket = 3;
      if (due) bucket = 0;
      else if (weak) bucket = 1;
      else if (!started) bucket = 2;

      return {
        index,
        key,
        item,
        record,
        started,
        due,
        weak,
        mastery,
        nextReviewAt,
        bucket,
      };
    })
    .filter((candidate) => candidate.index !== currentIndex || items.length === 1)
    .sort((a, b) => {
      if (a.bucket !== b.bucket) return a.bucket - b.bucket;
      if (a.bucket === 0 && a.nextReviewAt !== b.nextReviewAt) return a.nextReviewAt - b.nextReviewAt;
      if (a.bucket === 1 && a.mastery !== b.mastery) return a.mastery - b.mastery;
      if (a.bucket === 2) return a.index - b.index;
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      return a.index - b.index;
    });
}

export function pickNextJourneyItemIndex(options) {
  const ranked = rankJourneyReviewItems(options);
  return ranked[0]?.index ?? 0;
}
