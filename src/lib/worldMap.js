// Learning world map progression.
export const WORLDS = [
  {
    id: 'alphabet',
    name: 'Mundo das Letras',
    emoji: '🔤',
    color: '#7c3aed',
    bgColor: 'from-violet-400 to-purple-600',
    description: 'Aprenda todas as 26 letras do alfabeto',
    unlockRequirement: 0,
    unlockType: 'always',
    totalLessons: 26,
    getLessonsCompleted: (stats) => stats.lettersMastered || 0,
    playPath: '/play',
  },
  {
    id: 'syllables_basic',
    name: 'Sílabas Simples',
    emoji: '🗣️',
    color: '#0891b2',
    bgColor: 'from-cyan-400 to-blue-600',
    description: 'BA, CA, DA… as sílabas básicas',
    unlockRequirement: 100,
    unlockMasteryPct: 0.70,
    unlockType: 'stars_or_mastery',
    totalLessons: 20,
    getLessonsCompleted: (stats) => Math.min(stats.syllablesBasicMastered || 0, 20),
    playPath: '/play-syllables',
  },
  {
    id: 'syllables_complex',
    name: 'Sílabas Complexas',
    emoji: '🧩',
    color: '#059669',
    bgColor: 'from-emerald-400 to-green-600',
    description: 'BRA, CRA, TRA… combinações avançadas',
    unlockRequirement: 200,
    unlockType: 'previous_or_stars',
    totalLessons: 20,
    getLessonsCompleted: (stats) => Math.min(stats.syllablesComplexMastered || 0, 20),
    playPath: '/play-syllables?mode=complex',
  },
  {
    id: 'words_basic',
    name: 'Primeiras Palavras',
    emoji: '📖',
    color: '#d97706',
    bgColor: 'from-amber-400 to-orange-600',
    description: 'BOLA, CASA, GATO… palavras do dia a dia',
    unlockRequirement: 150,
    unlockType: 'previous_or_stars',
    totalLessons: 20,
    getLessonsCompleted: (stats) => Math.min(stats.wordsMastered || 0, 20),
    playPath: '/play-syllables?mode=words',
  },
  {
    id: 'sentences',
    name: 'Frases Mágicas',
    emoji: '✨',
    color: '#db2777',
    bgColor: 'from-pink-400 to-rose-600',
    description: 'Organize palavras e monte frases completas!',
    unlockRequirement: 300,
    unlockType: 'previous_or_stars',
    totalLessons: 20,
    getLessonsCompleted: (stats) => Math.min(stats.sentencesMastered || 0, 20),
    playPath: '/play-sentences',
  },
];

function isPreviousWorldComplete(world, stats) {
  const worldIndex = WORLDS.findIndex((candidate) => candidate.id === world.id);
  if (worldIndex <= 0) return false;
  const previousWorld = WORLDS[worldIndex - 1];
  return previousWorld.getLessonsCompleted(stats) >= previousWorld.totalLessons;
}

export function isWorldUnlocked(world, stats) {
  if (world.unlockType === 'always') return true;

  if (world.unlockType === 'stars_or_mastery') {
    if (stats.totalStars >= world.unlockRequirement) return true;
    const masteryPct = (stats.lettersMastered || 0) / 26;
    if (masteryPct >= world.unlockMasteryPct) return true;
    return isPreviousWorldComplete(world, stats);
  }

  if (world.unlockType === 'previous_or_stars') {
    if (stats.totalStars >= world.unlockRequirement) return true;
    return isPreviousWorldComplete(world, stats);
  }

  return false;
}
