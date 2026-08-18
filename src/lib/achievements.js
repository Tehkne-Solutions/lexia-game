import { calculateMastery } from '@/lib/fsrs';

// Check if a progress entry is mastered across letters and non-FSRS curriculum entities.
export function isProgressMastered(progress) {
  if (!progress || progress.total_attempts === 0) return false;
  const key = progress.letter || '';
  // Syllables, words and sentences use a simple repeated-success mastery rule.
  if (key.startsWith('SYL_') || key.startsWith('SYLC_') || key.startsWith('WORD_') || key.startsWith('SENT_')) {
    return progress.correct_attempts >= 3 &&
           (progress.correct_attempts / progress.total_attempts) >= 0.6;
  }
  // Letters remain FSRS-based.
  return calculateMastery(progress) >= 80;
}

export const ACHIEVEMENTS = [
  {
    id: 'first_letter',
    title: 'Primeira Letra!',
    description: 'Aprenda sua primeira letra',
    emoji: '🌱',
    color: 'bg-green-100 border-green-400',
    textColor: 'text-green-700',
    check: (stats) => stats.masteredCount >= 1,
  },
  {
    id: 'five_letters',
    title: 'Aprendiz',
    description: 'Domine 5 letras',
    emoji: '📚',
    color: 'bg-blue-100 border-blue-400',
    textColor: 'text-blue-700',
    check: (stats) => stats.masteredCount >= 5,
  },
  {
    id: 'ten_letters',
    title: 'Estudioso',
    description: 'Domine 10 letras',
    emoji: '🎓',
    color: 'bg-purple-100 border-purple-400',
    textColor: 'text-purple-700',
    check: (stats) => stats.masteredCount >= 10,
  },
  {
    id: 'all_letters',
    title: 'Mestre do Alfabeto',
    description: 'Domine todas as 26 letras!',
    emoji: '🏆',
    color: 'bg-yellow-100 border-yellow-400',
    textColor: 'text-yellow-700',
    check: (stats) => stats.masteredCount >= 26,
  },
  {
    id: 'streak_3',
    title: 'Em Chamas!',
    description: 'Acerte 3 vezes seguidas',
    emoji: '🔥',
    color: 'bg-red-100 border-red-400',
    textColor: 'text-red-700',
    check: (stats) => stats.maxStreak >= 3,
  },
  {
    id: 'streak_10',
    title: 'Imbatível',
    description: 'Acerte 10 vezes seguidas',
    emoji: '⚡',
    color: 'bg-orange-100 border-orange-400',
    textColor: 'text-orange-700',
    check: (stats) => stats.maxStreak >= 10,
  },
  {
    id: 'stars_10',
    title: 'Coletor de Estrelas',
    description: 'Ganhe 10 estrelas',
    emoji: '⭐',
    color: 'bg-amber-100 border-amber-400',
    textColor: 'text-amber-700',
    check: (stats) => stats.totalStars >= 10,
  },
  {
    id: 'stars_50',
    title: 'Superestrela',
    description: 'Ganhe 50 estrelas',
    emoji: '🌟',
    color: 'bg-yellow-100 border-yellow-500',
    textColor: 'text-yellow-800',
    check: (stats) => stats.totalStars >= 50,
  },
  {
    id: 'stars_100',
    title: 'Lendário',
    description: 'Ganhe 100 estrelas',
    emoji: '💫',
    color: 'bg-violet-100 border-violet-400',
    textColor: 'text-violet-700',
    check: (stats) => stats.totalStars >= 100,
  },
  {
    id: 'accuracy_80',
    title: 'Perfeccionista',
    description: 'Atinja 80% de precisão geral',
    emoji: '🎯',
    color: 'bg-teal-100 border-teal-400',
    textColor: 'text-teal-700',
    check: (stats) => stats.accuracy >= 80,
  },
  {
    id: 'attempts_50',
    title: 'Persistente',
    description: 'Faça 50 tentativas no total',
    emoji: '💪',
    color: 'bg-pink-100 border-pink-400',
    textColor: 'text-pink-700',
    check: (stats) => stats.totalAttempts >= 50,
  },
  {
    id: 'half_alphabet',
    title: 'Na Metade!',
    description: 'Domine 13 letras',
    emoji: '🌙',
    color: 'bg-indigo-100 border-indigo-400',
    textColor: 'text-indigo-700',
    check: (stats) => stats.masteredCount >= 13,
  },
];

export function getEarnedAchievements(stats) {
  return ACHIEVEMENTS.filter(a => a.check(stats));
}

export function getNewlyEarned(previousStats, currentStats) {
  const previous = getEarnedAchievements(previousStats);
  const current = getEarnedAchievements(currentStats);
  const prevIds = new Set(previous.map(a => a.id));
  return current.filter(a => !prevIds.has(a.id));
}

export function buildStats(allProgress) {
  const records = Array.isArray(allProgress) ? allProgress : [];
  const letterProgress = records.filter(p => p.letter && p.letter.length === 1);

  const totalStars = records.reduce((s, p) => s + (p.stars_earned || 0), 0);
  const totalAttempts = records.reduce((s, p) => s + (p.total_attempts || 0), 0);
  const totalCorrect = records.reduce((s, p) => s + (p.correct_attempts || 0), 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const maxStreak = records.reduce((max, p) => Math.max(max, p.streak || 0), 0);

  // Keep letter-specific diagnostics available for screens that intentionally focus on the alphabet chapter.
  const letterAttempts = letterProgress.reduce((s, p) => s + (p.total_attempts || 0), 0);
  const letterCorrect = letterProgress.reduce((s, p) => s + (p.correct_attempts || 0), 0);
  const letterAccuracy = letterAttempts > 0 ? Math.round((letterCorrect / letterAttempts) * 100) : 0;
  const letterMaxStreak = letterProgress.reduce((max, p) => Math.max(max, p.streak || 0), 0);

  const lettersMastered = letterProgress.filter(p => isProgressMastered(p)).length;
  const masteredCount = lettersMastered;
  const lettersStarted = new Set(letterProgress.filter(p => p.total_attempts > 0).map(p => p.letter)).size;

  const basicSyllables = records.filter(p => p.letter?.startsWith('SYL_'));
  const complexSyllables = records.filter(p => p.letter?.startsWith('SYLC_'));
  const words = records.filter(p => p.letter?.startsWith('WORD_'));
  const sentences = records.filter(p => p.letter?.startsWith('SENT_'));

  const syllablesBasicDone = basicSyllables.filter(p => p.correct_attempts > 0).length;
  const syllablesBasicMastered = basicSyllables.filter(isProgressMastered).length;
  const syllablesComplexDone = complexSyllables.filter(p => p.correct_attempts > 0).length;
  const syllablesComplexMastered = complexSyllables.filter(isProgressMastered).length;
  const wordsDone = words.filter(p => p.correct_attempts > 0).length;
  const wordsMastered = words.filter(isProgressMastered).length;
  const sentencesDone = sentences.filter(p => p.correct_attempts > 0).length;
  const sentencesMastered = sentences.filter(isProgressMastered).length;

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
