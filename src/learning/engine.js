import { calculateMastery } from './mastery.js';
import {
  getCurriculumOrder,
  getCurriculumState,
  sortByCurriculum,
} from './curriculum.js';

function normalizeAlphabetProgress(allProgress, alphabet) {
  const alphabetLetters = new Set(alphabet.map((item) => item.letter));
  return (allProgress || []).filter(
    (progress) =>
      typeof progress?.letter === 'string' &&
      progress.letter.length === 1 &&
      alphabetLetters.has(progress.letter)
  );
}

function pickFromTop(items, poolSize = 3) {
  if (!items.length) return null;
  const pool = items.slice(0, Math.min(poolSize, items.length));
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function getInitialLearningLetter(alphabet) {
  const ordered = sortByCurriculum(alphabet);
  return ordered[0]?.letter || alphabet[0]?.letter || 'A';
}

export function getLearningState(allProgress, alphabet) {
  const alphabetProgress = normalizeAlphabetProgress(allProgress, alphabet);
  const curriculum = getCurriculumState(alphabetProgress, calculateMastery);
  const unlockedSet = new Set(curriculum.unlockedLetters);
  const unlockedAlphabet = sortByCurriculum(
    alphabet.filter((item) => unlockedSet.has(item.letter))
  );

  return {
    curriculum,
    alphabetProgress,
    unlockedAlphabet,
  };
}

export function pickNextLearningLetter(allProgress, currentLetter, alphabet) {
  const { alphabetProgress, unlockedAlphabet } = getLearningState(allProgress, alphabet);
  const unlockedSet = new Set(unlockedAlphabet.map((item) => item.letter));
  const progressMap = new Map(alphabetProgress.map((item) => [item.letter, item]));
  const now = Date.now();

  const overdue = alphabetProgress
    .filter((progress) => {
      if (!unlockedSet.has(progress.letter) || progress.letter === currentLetter) return false;
      if ((progress.total_attempts || 0) <= 0) return false;
      const dueAt = Date.parse(progress.next_review || '');
      return Number.isFinite(dueAt) && dueAt <= now;
    })
    .sort((a, b) => Date.parse(a.next_review) - Date.parse(b.next_review));

  const duePick = pickFromTop(overdue);
  if (duePick) return duePick.letter;

  const struggling = alphabetProgress
    .filter((progress) =>
      unlockedSet.has(progress.letter) &&
      progress.letter !== currentLetter &&
      (progress.total_attempts || 0) > 0 &&
      calculateMastery(progress) < 50
    )
    .sort((a, b) => {
      const masteryDelta = calculateMastery(a) - calculateMastery(b);
      return masteryDelta || getCurriculumOrder(a.letter) - getCurriculumOrder(b.letter);
    });

  const strugglingPick = pickFromTop(struggling);
  if (strugglingPick) return strugglingPick.letter;

  const notStarted = unlockedAlphabet.filter((item) => {
    if (item.letter === currentLetter) return false;
    const progress = progressMap.get(item.letter);
    return !progress || (progress.total_attempts || 0) === 0;
  });

  if (notStarted.length) return notStarted[0].letter;

  const reviewPool = unlockedAlphabet
    .filter((item) => item.letter !== currentLetter)
    .map((item) => ({
      letter: item.letter,
      mastery: calculateMastery(progressMap.get(item.letter)),
      order: getCurriculumOrder(item.letter),
    }))
    .sort((a, b) => a.mastery - b.mastery || a.order - b.order);

  const reviewPick = pickFromTop(reviewPool);
  const fallback = reviewPick?.letter || unlockedAlphabet.find((item) => item.letter !== currentLetter)?.letter;
  return fallback || currentLetter || alphabet[0]?.letter || 'A';
}

export function getDailyChallengeCandidates(allProgress, alphabet, limit = 8) {
  const { alphabetProgress, unlockedAlphabet } = getLearningState(allProgress, alphabet);
  const progressMap = new Map(alphabetProgress.map((item) => [item.letter, item]));

  return unlockedAlphabet
    .map((item) => {
      const progress = progressMap.get(item.letter);
      return {
        letter: item.letter,
        score: progress && (progress.total_attempts || 0) > 0 ? calculateMastery(progress) : 0,
        curriculumOrder: getCurriculumOrder(item.letter),
      };
    })
    .sort((a, b) => a.score - b.score || a.curriculumOrder - b.curriculumOrder)
    .slice(0, Math.max(3, limit));
}
