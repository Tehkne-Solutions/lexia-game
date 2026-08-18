import { getCurriculumMetadata, sortByCurriculum } from '../learning/curriculum.js';

// Full alphabet catalog used by the game UI. Alphabetical order is kept here
// so selectors and reports remain familiar; LEARNING_SEQUENCE carries the
// pedagogical order used by the adaptive learning engine.
const BASE_ALPHABET = [
  { letter: 'A', word: 'Abelha', emoji: '🐝', color: '#FF6B6B' },
  { letter: 'B', word: 'Bola', emoji: '⚽', color: '#4ECDC4' },
  { letter: 'C', word: 'Casa', emoji: '🏠', color: '#45B7D1' },
  { letter: 'D', word: 'Dado', emoji: '🎲', color: '#96CEB4' },
  { letter: 'E', word: 'Estrela', emoji: '⭐', color: '#FFEAA7' },
  { letter: 'F', word: 'Flor', emoji: '🌸', color: '#DDA0DD' },
  { letter: 'G', word: 'Gato', emoji: '🐱', color: '#98D8C8' },
  { letter: 'H', word: 'Helicóptero', emoji: '🚁', color: '#F7DC6F' },
  { letter: 'I', word: 'Iglu', emoji: '🏔️', color: '#85C1E9' },
  { letter: 'J', word: 'Jacaré', emoji: '🐊', color: '#82E0AA' },
  { letter: 'K', word: 'Kiwi', emoji: '🥝', color: '#A3E4D7' },
  { letter: 'L', word: 'Lua', emoji: '🌙', color: '#F9E79F' },
  { letter: 'M', word: 'Macaco', emoji: '🐒', color: '#E59866' },
  { letter: 'N', word: 'Nuvem', emoji: '☁️', color: '#AED6F1' },
  { letter: 'O', word: 'Ovo', emoji: '🥚', color: '#FAD7A0' },
  { letter: 'P', word: 'Pássaro', emoji: '🐦', color: '#A9CCE3' },
  { letter: 'Q', word: 'Queijo', emoji: '🧀', color: '#F9E79F' },
  { letter: 'R', word: 'Rato', emoji: '🐭', color: '#D5D8DC' },
  { letter: 'S', word: 'Sol', emoji: '☀️', color: '#F7DC6F' },
  { letter: 'T', word: 'Tartaruga', emoji: '🐢', color: '#82E0AA' },
  { letter: 'U', word: 'Uva', emoji: '🍇', color: '#BB8FCE' },
  { letter: 'V', word: 'Vaca', emoji: '🐄', color: '#F5B7B1' },
  { letter: 'W', word: 'Waffle', emoji: '🧇', color: '#E59866' },
  { letter: 'X', word: 'Xícara', emoji: '☕', color: '#A9DFBF' },
  { letter: 'Y', word: 'Yoga', emoji: '🧘', color: '#AED6F1' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓', color: '#D5D8DC' },
];

export const ALPHABET = BASE_ALPHABET.map((item) => {
  const curriculum = getCurriculumMetadata(item.letter);
  return {
    ...item,
    ...curriculum,
    anchorWord: curriculum.anchorWord || item.word,
    anchorEmoji: curriculum.anchorEmoji || item.emoji,
  };
});

export const LEARNING_SEQUENCE = Object.freeze(sortByCurriculum(ALPHABET));

export function getLetterData(letter) {
  return ALPHABET.find((item) => item.letter === String(letter || '').toUpperCase());
}

export function getNextLetter(currentLetter) {
  const idx = ALPHABET.findIndex((item) => item.letter === currentLetter);
  if (idx === -1 || idx === ALPHABET.length - 1) return ALPHABET[0];
  return ALPHABET[idx + 1];
}
