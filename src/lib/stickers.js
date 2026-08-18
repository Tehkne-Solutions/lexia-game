import { ALPHABET } from '@/lib/alphabetData';
import { isProgressMastered } from '@/lib/achievements';
import { buildJourneyCollectibles } from '../game/journeyCollectiblesEngine.js';

// One sticker per letter — earned when the letter is mastered.
export const LETTER_STICKERS = ALPHABET.map(item => ({
  id: `letter_${item.letter}`,
  letter: item.letter,
  emoji: item.emoji,
  word: item.word,
  name: `${item.letter} de ${item.word}`,
  category: 'letters',
}));

// Special milestone stickers. Alphabet-specific milestones remain alphabet-specific;
// global streak/star milestones consume the whole-journey stats introduced in M13.
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

export function getJourneyStickers(stats = {}) {
  return buildJourneyCollectibles(stats);
}

export function getStickerCatalog(stats = {}) {
  return [
    ...getJourneyStickers(stats),
    ...LETTER_STICKERS,
    ...MILESTONE_STICKERS,
  ];
}

export function getEarnedStickers(allProgress = [], stats = {}) {
  const earned = new Set();

  // Canonical world relics — derived from the shared World Experience rules.
  getJourneyStickers(stats).forEach((sticker) => {
    if (sticker.unlocked) earned.add(sticker.id);
  });

  // Letter stickers — earned when a specific letter is mastered.
  const records = Array.isArray(allProgress) ? allProgress : [];
  const letterProgress = records.filter(p => p.letter && p.letter.length === 1);
  letterProgress.forEach(p => {
    if (isProgressMastered(p)) earned.add(`letter_${p.letter}`);
  });

  // Milestone stickers.
  MILESTONE_STICKERS.forEach(s => {
    if (s.type === 'streak' && Number(stats.maxStreak || 0) >= s.streakReq) earned.add(s.id);
    else if (s.type === 'stars' && Number(stats.totalStars || 0) >= s.starsReq) earned.add(s.id);
    else if (!s.type && Number(stats.lettersMastered || 0) >= s.requirement) earned.add(s.id);
  });

  return earned;
}
