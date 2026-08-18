// Lexia Learning Engine 2.0 — pedagogical curriculum layer.
// The first four legacy groups preserve the strongest curriculum decisions from
// the original Tehkné implementation, while the active phases extend coverage
// to all 26 letters used by the Base44 game.

export const LEGACY_CURRICULUM = Object.freeze({
  I: { legacyLevel: 1, anchorWord: 'Igreja', anchorEmoji: '⛪' },
  U: { legacyLevel: 1, anchorWord: 'Uva', anchorEmoji: '🍇' },
  E: { legacyLevel: 1, anchorWord: 'Escada', anchorEmoji: '🪜' },
  A: { legacyLevel: 1, anchorWord: 'Abelha', anchorEmoji: '🐝' },
  O: { legacyLevel: 1, anchorWord: 'Ovo', anchorEmoji: '🥚' },
  C: { legacyLevel: 2, anchorWord: 'Casa', anchorEmoji: '🏠' },
  P: { legacyLevel: 2, anchorWord: 'Pato', anchorEmoji: '🦆' },
  B: { legacyLevel: 2, anchorWord: 'Bola', anchorEmoji: '⚽' },
  D: { legacyLevel: 2, anchorWord: 'Dado', anchorEmoji: '🎲' },
  L: { legacyLevel: 3, anchorWord: 'Leão', anchorEmoji: '🦁' },
  T: { legacyLevel: 3, anchorWord: 'Tatu', anchorEmoji: '🐢' },
  S: { legacyLevel: 3, anchorWord: 'Sapo', anchorEmoji: '🐸' },
  R: { legacyLevel: 3, anchorWord: 'Rato', anchorEmoji: '🐭' },
  M: { legacyLevel: 4, anchorWord: 'Macaco', anchorEmoji: '🐒' },
  N: { legacyLevel: 4, anchorWord: 'Navio', anchorEmoji: '🚢' },
  X: { legacyLevel: 4, anchorWord: 'Xícara', anchorEmoji: '☕' },
  Z: { legacyLevel: 4, anchorWord: 'Zebra', anchorEmoji: '🦓' },
});

export const CURRICULUM_PHASES = Object.freeze([
  {
    id: 'foundation-vowels',
    level: 1,
    name: 'Vogais e Traços Essenciais',
    description: 'Primeiro contato, vogais e formas de alta previsibilidade motora.',
    letters: ['I', 'U', 'E', 'A', 'O'],
  },
  {
    id: 'basic-curves',
    level: 2,
    name: 'Curvas e Formas Básicas',
    description: 'Consoantes com construção visual simples e repetível.',
    letters: ['C', 'P', 'B', 'D'],
  },
  {
    id: 'frequent-consonants',
    level: 3,
    name: 'Consoantes Frequentes',
    description: 'Amplia o repertório para leitura e formação de sílabas comuns.',
    letters: ['L', 'T', 'S', 'R'],
  },
  {
    id: 'combined-forms',
    level: 4,
    name: 'Formas Combinadas',
    description: 'Mistura retas, curvas e diagonais com maior controle motor.',
    letters: ['M', 'N', 'F', 'V'],
  },
  {
    id: 'advanced-core',
    level: 5,
    name: 'Sons e Formas Avançadas',
    description: 'Completa o núcleo do português com formas e relações sonoras mais complexas.',
    letters: ['G', 'J', 'H', 'Q', 'X', 'Z'],
  },
  {
    id: 'extended-alphabet',
    level: 6,
    name: 'Alfabeto Estendido',
    description: 'Letras de uso internacional e palavras incorporadas ao português.',
    letters: ['K', 'W', 'Y'],
  },
]);

export const CURRICULUM_SEQUENCE = Object.freeze(
  CURRICULUM_PHASES.flatMap((phase) => phase.letters)
);

const PHASE_BY_LETTER = new Map();
const ORDER_BY_LETTER = new Map();
CURRICULUM_PHASES.forEach((phase, phaseIndex) => {
  phase.letters.forEach((letter) => {
    PHASE_BY_LETTER.set(letter, { ...phase, phaseIndex });
    ORDER_BY_LETTER.set(letter, CURRICULUM_SEQUENCE.indexOf(letter));
  });
});

export const DEFAULT_PHASE_POLICY = Object.freeze({
  masteredThreshold: 80,
  masteredRatioToAdvance: 0.6,
  attemptedRatioToAdvance: 0.8,
  averageMasteryToAdvance: 65,
});

export function getCurriculumOrder(letter) {
  return ORDER_BY_LETTER.get(String(letter || '').toUpperCase()) ?? Number.MAX_SAFE_INTEGER;
}

export function getCurriculumMetadata(letter) {
  const normalized = String(letter || '').toUpperCase();
  const phase = PHASE_BY_LETTER.get(normalized);
  const legacy = LEGACY_CURRICULUM[normalized] || {};

  if (!phase) {
    return {
      curriculumOrder: Number.MAX_SAFE_INTEGER,
      curriculumPhase: null,
      curriculumPhaseId: null,
      curriculumPhaseName: null,
      ...legacy,
    };
  }

  return {
    curriculumOrder: getCurriculumOrder(normalized),
    curriculumPhase: phase.level,
    curriculumPhaseId: phase.id,
    curriculumPhaseName: phase.name,
    ...legacy,
  };
}

export function sortByCurriculum(items, getLetter = (item) => item?.letter ?? item) {
  return [...items].sort((a, b) => {
    const orderA = getCurriculumOrder(getLetter(a));
    const orderB = getCurriculumOrder(getLetter(b));
    return orderA - orderB;
  });
}

function buildProgressMap(allProgress) {
  const map = new Map();
  (allProgress || []).forEach((progress) => {
    if (typeof progress?.letter === 'string' && progress.letter.length === 1) {
      map.set(progress.letter.toUpperCase(), progress);
    }
  });
  return map;
}

export function getPhaseProgress(allProgress, phase, calculateMastery, policy = DEFAULT_PHASE_POLICY) {
  const progressMap = buildProgressMap(allProgress);
  const scores = phase.letters.map((letter) => {
    const progress = progressMap.get(letter);
    return {
      letter,
      attempted: Boolean(progress && (progress.total_attempts || 0) > 0),
      mastery: progress ? calculateMastery(progress) : 0,
    };
  });

  const attemptedCount = scores.filter((item) => item.attempted).length;
  const masteredCount = scores.filter((item) => item.mastery >= policy.masteredThreshold).length;
  const averageMastery = scores.length
    ? scores.reduce((sum, item) => sum + item.mastery, 0) / scores.length
    : 0;
  const attemptedRatio = scores.length ? attemptedCount / scores.length : 0;
  const masteredRatio = scores.length ? masteredCount / scores.length : 0;

  const readyToAdvance =
    masteredRatio >= policy.masteredRatioToAdvance ||
    (attemptedRatio >= policy.attemptedRatioToAdvance &&
      averageMastery >= policy.averageMasteryToAdvance);

  return {
    phaseId: phase.id,
    level: phase.level,
    scores,
    attemptedCount,
    masteredCount,
    averageMastery: Math.round(averageMastery),
    attemptedRatio,
    masteredRatio,
    readyToAdvance,
  };
}

export function getCurriculumState(allProgress, calculateMastery, policy = DEFAULT_PHASE_POLICY) {
  const phaseProgress = CURRICULUM_PHASES.map((phase) =>
    getPhaseProgress(allProgress, phase, calculateMastery, policy)
  );

  let activePhaseIndex = 0;
  for (let index = 0; index < CURRICULUM_PHASES.length - 1; index += 1) {
    if (!phaseProgress[index].readyToAdvance) break;
    activePhaseIndex = index + 1;
  }

  const activePhase = CURRICULUM_PHASES[activePhaseIndex];
  const unlockedLetters = CURRICULUM_PHASES
    .slice(0, activePhaseIndex + 1)
    .flatMap((phase) => phase.letters);

  return {
    activePhaseIndex,
    activePhase,
    unlockedLetters,
    phaseProgress,
    isComplete: activePhaseIndex === CURRICULUM_PHASES.length - 1 && phaseProgress.at(-1).readyToAdvance,
  };
}
