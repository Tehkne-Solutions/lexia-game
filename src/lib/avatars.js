export const AVATARS = [
  { id: 'owl',      emoji: '🦉', name: 'Corujinha',   unlockStars: 0  },
  { id: 'fox',      emoji: '🦊', name: 'Raposa',      unlockStars: 5  },
  { id: 'cat',      emoji: '🐱', name: 'Gatinho',     unlockStars: 10 },
  { id: 'dragon',   emoji: '🐲', name: 'Dragãozinho', unlockStars: 20 },
  { id: 'unicorn',  emoji: '🦄', name: 'Unicórnio',   unlockStars: 35 },
  { id: 'robot',    emoji: '🤖', name: 'Robozinho',   unlockStars: 50 },
  { id: 'wizard',   emoji: '🧙', name: 'Mago',        unlockStars: 70 },
  { id: 'star',     emoji: '🌟', name: 'Estrela',     unlockStars: 100},
];

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}