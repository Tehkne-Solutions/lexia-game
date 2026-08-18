import {
  buildJourneyStats,
  isJourneyProgressMastered,
} from '../game/journeyStatsEngine.js';

// Backward-compatible name consumed by sticker/achievement callers.
export function isProgressMastered(progress) {
  return isJourneyProgressMastered(progress);
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
  return buildJourneyStats(allProgress);
}
