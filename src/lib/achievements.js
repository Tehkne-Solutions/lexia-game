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
    tone: 'secondary',
    intensity: 'standard',
    color: 'bg-secondary/10 border-secondary/35',
    textColor: 'text-secondary',
    check: (stats) => stats.masteredCount >= 1,
  },
  {
    id: 'five_letters',
    title: 'Aprendiz',
    description: 'Domine 5 letras',
    emoji: '📚',
    tone: 'primary',
    intensity: 'soft',
    color: 'bg-primary/10 border-primary/30',
    textColor: 'text-primary',
    check: (stats) => stats.masteredCount >= 5,
  },
  {
    id: 'ten_letters',
    title: 'Estudioso',
    description: 'Domine 10 letras',
    emoji: '🎓',
    tone: 'accent',
    intensity: 'standard',
    color: 'bg-accent/15 border-accent/40',
    textColor: 'text-accent-foreground',
    check: (stats) => stats.masteredCount >= 10,
  },
  {
    id: 'all_letters',
    title: 'Mestre do Alfabeto',
    description: 'Domine todas as 26 letras!',
    emoji: '🏆',
    tone: 'accent',
    intensity: 'strong',
    color: 'bg-accent/20 border-accent/55',
    textColor: 'text-accent-foreground',
    check: (stats) => stats.masteredCount >= 26,
  },
  {
    id: 'streak_3',
    title: 'Em Chamas!',
    description: 'Acerte 3 vezes seguidas',
    emoji: '🔥',
    tone: 'destructive',
    intensity: 'standard',
    color: 'bg-destructive/10 border-destructive/35',
    textColor: 'text-destructive',
    check: (stats) => stats.maxStreak >= 3,
  },
  {
    id: 'streak_10',
    title: 'Imbatível',
    description: 'Acerte 10 vezes seguidas',
    emoji: '⚡',
    tone: 'primary',
    intensity: 'standard',
    color: 'bg-primary/10 border-primary/35',
    textColor: 'text-primary',
    check: (stats) => stats.maxStreak >= 10,
  },
  {
    id: 'stars_10',
    title: 'Coletor de Estrelas',
    description: 'Ganhe 10 estrelas',
    emoji: '⭐',
    tone: 'accent',
    intensity: 'standard',
    color: 'bg-accent/15 border-accent/40',
    textColor: 'text-accent-foreground',
    check: (stats) => stats.totalStars >= 10,
  },
  {
    id: 'stars_50',
    title: 'Superestrela',
    description: 'Ganhe 50 estrelas',
    emoji: '🌟',
    tone: 'accent',
    intensity: 'strong',
    color: 'bg-accent/20 border-accent/55',
    textColor: 'text-accent-foreground',
    check: (stats) => stats.totalStars >= 50,
  },
  {
    id: 'stars_100',
    title: 'Lendário',
    description: 'Ganhe 100 estrelas',
    emoji: '💫',
    tone: 'primary',
    intensity: 'strong',
    color: 'bg-primary/15 border-primary/45',
    textColor: 'text-primary',
    check: (stats) => stats.totalStars >= 100,
  },
  {
    id: 'accuracy_80',
    title: 'Perfeccionista',
    description: 'Atinja 80% de precisão geral',
    emoji: '🎯',
    tone: 'secondary',
    intensity: 'standard',
    color: 'bg-secondary/10 border-secondary/35',
    textColor: 'text-secondary',
    check: (stats) => stats.accuracy >= 80,
  },
  {
    id: 'attempts_50',
    title: 'Persistente',
    description: 'Faça 50 tentativas no total',
    emoji: '💪',
    tone: 'primary',
    intensity: 'soft',
    color: 'bg-primary/10 border-primary/30',
    textColor: 'text-primary',
    check: (stats) => stats.totalAttempts >= 50,
  },
  {
    id: 'half_alphabet',
    title: 'Na Metade!',
    description: 'Domine 13 letras',
    emoji: '🌙',
    tone: 'secondary',
    intensity: 'standard',
    color: 'bg-secondary/10 border-secondary/35',
    textColor: 'text-secondary',
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
