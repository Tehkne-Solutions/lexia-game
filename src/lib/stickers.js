import { ALPHABET } from '@/lib/alphabetData';
import { isProgressMastered } from '@/lib/achievements';

// One sticker per letter — earned when the letter is mastered
export const LETTER_STICKERS = ALPHABET.map(item => ({
  id: `letter_${item.letter}`,
  letter: item.letter,
  emoji: item.emoji,
  word: item.word,
  name: `${item.letter} de ${item.word}`,
  category: 'letters',
}));

// Special milestone stickers
export const MILESTONE_STICKERS = [
  { id: 'ms_first', emoji: '🌱', name: 'Primeira Letra!', category: 'milestones', requirement: 1 },
  { id: 'ms_5', emoji: '📚', name: 'Aprendiz (5)', category: 'milestones', requirement: 5 },
  { id: 'ms_10', emoji: '🎓', name: 'Estudioso (10)', category: 'milestones', requirement: 10 },
  { id: 'ms_13', emoji: '🌙', name: 'Na Metade! (13)', category: 'milestones', requirement: 13 },
  { id: 'ms_26', emoji: '🏆', name: 'Mestre do Alfabeto!', category: 'milestones', requirement: 26 },
  { id: 'ms_streak10', emoji: '⚡', name: 'Imbatível (10x)', category: 'milestones', type: 'streak', streakReq: 10 },
  { id: 'ms_stars50', emoji: '🌟', name: 'Superestrela (50⭐)', category: 'milestones', type: 'stars', starsReq: 50 },
  { id: 'ms_stars100', emoji: '💫', name: 'Lendário (100⭐)', category: 'milestones', type: 'stars', starsReq: 100 },
];

export function getEarnedStickers(allProgress, stats) {
  const earned = new Set();

  // Letter stickers — earned when letter is mastered
  const letterProgress = allProgress.filter(p => p.letter && p.letter.length === 1);
  letterProgress.forEach(p => {
    if (isProgressMastered(p)) earned.add(`letter_${p.letter}`);
  });

  // Milestone stickers
  MILESTONE_STICKERS.forEach(s => {
    if (s.type === 'streak' && stats.maxStreak >= s.streakReq) earned.add(s.id);
    else if (s.type === 'stars' && stats.totalStars >= s.starsReq) earned.add(s.id);
    else if (!s.type && (stats.lettersMastered || 0) >= s.requirement) earned.add(s.id);
  });

  return earned;
}