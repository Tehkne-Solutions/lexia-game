// Learning world map progression
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
    unlockRequirement: 100,   // 100 stars OR 70% mastery
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
    unlockMasteryPct: 1.0,
    unlockType: 'stars_or_mastery',
    totalLessons: 20,
    getLessonsCompleted: (stats) => Math.min(stats.syllablesComplexDone || 0, 20),
    playPath: null,
  },
  {
    id: 'words_basic',
    name: 'Primeiras Palavras',
    emoji: '📖',
    color: '#d97706',
    bgColor: 'from-amber-400 to-orange-600',
    description: 'BOLA, CASA, GATO… palavras do dia a dia',
    unlockRequirement: 150,
    unlockMasteryPct: 1.0,
    unlockType: 'stars_or_mastery',
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
    description: 'Monte frases completas!',
    unlockRequirement: 300,
    unlockMasteryPct: 1.0,
    unlockType: 'stars_or_mastery',
    totalLessons: 20,
    getLessonsCompleted: (stats) => Math.min(stats.sentencesDone || 0, 20),
    playPath: null,
  },
];

export function isWorldUnlocked(world, stats) {
  if (world.unlockType === 'always') return true;

  if (world.unlockType === 'stars_or_mastery') {
    // Stars condition
    if (stats.totalStars >= world.unlockRequirement) return true;
    // Letter mastery condition (letters mastered contribute to unlocking)
    const masteryPct = (stats.lettersMastered || 0) / 26;
    if (masteryPct >= world.unlockMasteryPct) return true;
    // Also unlock if the previous world is fully completed (syllable mastery counts!)
    const worldIndex = WORLDS.findIndex(w => w.id === world.id);
    if (worldIndex > 0) {
      const prevWorld = WORLDS[worldIndex - 1];
      const prevCompleted = prevWorld.getLessonsCompleted(stats);
      if (prevCompleted >= prevWorld.totalLessons) return true;
    }
  }
  return false;
}