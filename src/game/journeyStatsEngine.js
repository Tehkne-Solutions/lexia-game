import { calculateMastery } from '../learning/mastery.js';

export function isJourneyProgressMastered(progress) {
  const attempts = Number(progress?.total_attempts || 0);
  if (!progress || attempts === 0) return false;

  const key = String(progress?.letter || '');
  if (
    key.startsWith('SYL_') ||
    key.startsWith('SYLC_') ||
    key.startsWith('WORD_') ||
    key.startsWith('SENT_')
  ) {
    const correct = Number(progress?.correct_attempts || 0);
    return correct >= 3 && correct / attempts >= 0.6;
  }

  return calculateMastery(progress) >= 80;
}

export function buildJourneyStats(allProgress = []) {
  const records = Array.isArray(allProgress) ? allProgress : [];
  const letterProgress = records.filter((progress) => {
    const key = String(progress?.letter || '');
    return key.length === 1;
  });

  const totalStars = records.reduce(
    (sum, progress) => sum + Number(progress?.stars_earned || 0),
    0,
  );
  const totalAttempts = records.reduce(
    (sum, progress) => sum + Number(progress?.total_attempts || 0),
    0,
  );
  const totalCorrect = records.reduce(
    (sum, progress) => sum + Number(progress?.correct_attempts || 0),
    0,
  );
  const accuracy = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0;
  const maxStreak = records.reduce(
    (max, progress) => Math.max(max, Number(progress?.streak || 0)),
    0,
  );

  const letterAttempts = letterProgress.reduce(
    (sum, progress) => sum + Number(progress?.total_attempts || 0),
    0,
  );
  const letterCorrect = letterProgress.reduce(
    (sum, progress) => sum + Number(progress?.correct_attempts || 0),
    0,
  );
  const letterAccuracy = letterAttempts > 0
    ? Math.round((letterCorrect / letterAttempts) * 100)
    : 0;
  const letterMaxStreak = letterProgress.reduce(
    (max, progress) => Math.max(max, Number(progress?.streak || 0)),
    0,
  );

  const lettersMastered = letterProgress.filter(isJourneyProgressMastered).length;
  const masteredCount = lettersMastered;
  const lettersStarted = new Set(
    letterProgress
      .filter((progress) => Number(progress?.total_attempts || 0) > 0)
      .map((progress) => String(progress.letter)),
  ).size;

  const basicSyllables = records.filter((progress) =>
    String(progress?.letter || '').startsWith('SYL_'));
  const complexSyllables = records.filter((progress) =>
    String(progress?.letter || '').startsWith('SYLC_'));
  const words = records.filter((progress) =>
    String(progress?.letter || '').startsWith('WORD_'));
  const sentences = records.filter((progress) =>
    String(progress?.letter || '').startsWith('SENT_'));

  const syllablesBasicDone = basicSyllables.filter(
    (progress) => Number(progress?.correct_attempts || 0) > 0,
  ).length;
  const syllablesBasicMastered = basicSyllables.filter(isJourneyProgressMastered).length;
  const syllablesComplexDone = complexSyllables.filter(
    (progress) => Number(progress?.correct_attempts || 0) > 0,
  ).length;
  const syllablesComplexMastered = complexSyllables.filter(isJourneyProgressMastered).length;
  const wordsDone = words.filter(
    (progress) => Number(progress?.correct_attempts || 0) > 0,
  ).length;
  const wordsMastered = words.filter(isJourneyProgressMastered).length;
  const sentencesDone = sentences.filter(
    (progress) => Number(progress?.correct_attempts || 0) > 0,
  ).length;
  const sentencesMastered = sentences.filter(isJourneyProgressMastered).length;

  return {
    totalStars,
    totalAttempts,
    totalCorrect,
    accuracy,
    maxStreak,
    letterAttempts,
    letterCorrect,
    letterAccuracy,
    letterMaxStreak,
    masteredCount,
    lettersMastered,
    lettersStarted,
    syllablesBasicDone,
    syllablesBasicMastered,
    syllablesComplexDone,
    syllablesComplexMastered,
    wordsDone,
    wordsMastered,
    sentencesDone,
    sentencesMastered,
  };
}
