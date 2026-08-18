// Owl mascot accessories — unlocked by star count

export const ACCESSORIES = [
  // Hats
  { id: 'hat_party', emoji: '🥳', name: 'Festa', category: 'hat', unlockStars: 5 },
  { id: 'hat_top', emoji: '🎩', name: 'Mágico', category: 'hat', unlockStars: 10 },
  { id: 'hat_cap', emoji: '🧢', name: 'Boné', category: 'hat', unlockStars: 15 },
  { id: 'hat_crown', emoji: '👑', name: 'Coroa', category: 'hat', unlockStars: 30 },
  { id: 'hat_grad', emoji: '🎓', name: 'Formatura', category: 'hat', unlockStars: 50 },

  // Glasses
  { id: 'glasses_normal', emoji: '👓', name: 'Inteligente', category: 'glasses', unlockStars: 8 },
  { id: 'glasses_sun', emoji: '🕶️', name: 'Estiloso', category: 'glasses', unlockStars: 20 },

  // Bow / Tie
  { id: 'bow_tie', emoji: '🎀', name: 'Laço', category: 'bow', unlockStars: 12 },
  { id: 'tie', emoji: '👔', name: 'Gravata', category: 'bow', unlockStars: 25 },

  // Extra
  { id: 'wings', emoji: '🦋', name: 'Asas Mágicas', category: 'extra', unlockStars: 40 },
  { id: 'sparkle', emoji: '✨', name: 'Brilho', category: 'extra', unlockStars: 60 },
];

const MASCOT_KEY = 'lexia_mascot_accessories';

export function loadMascotAccessories() {
  try { return JSON.parse(localStorage.getItem(MASCOT_KEY)) || {}; } catch { return {}; }
}

export function saveMascotAccessories(accessories) {
  localStorage.setItem(MASCOT_KEY, JSON.stringify(accessories));
}

export function isAccessoryUnlocked(accessory, totalStars) {
  return totalStars >= accessory.unlockStars;
}

export function getEquippedAccessories(accessories) {
  const result = {};
  for (const cat of ['hat', 'glasses', 'bow', 'extra']) {
    const id = accessories[cat];
    if (id) {
      const acc = ACCESSORIES.find(a => a.id === id);
      if (acc) result[cat] = acc;
    }
  }
  return result;
}