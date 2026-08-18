import { getJourneyState, JOURNEY_STAGES } from './journeyEngine.js';

export const PRACTICE_MODES = Object.freeze([
  Object.freeze({
    id: JOURNEY_STAGES.LETTERS,
    order: 0,
    label: 'Letras',
    title: 'Ateliê das Letras',
    description: 'Desenhe letras já disponíveis sem alterar sua missão atual.',
    emoji: '🔤',
    path: '/play?mode=practice',
  }),
  Object.freeze({
    id: JOURNEY_STAGES.SYLLABLES,
    order: 1,
    label: 'Sílabas simples',
    title: 'Pontes do Som',
    description: 'Treine combinações simples de letras no seu ritmo.',
    emoji: '🌉',
    path: '/play-syllables?practice=true',
  }),
  Object.freeze({
    id: JOURNEY_STAGES.COMPLEX_SYLLABLES,
    order: 2,
    label: 'Sílabas complexas',
    title: 'Labirinto dos Encontros',
    description: 'Reveja encontros como BRA, CRA e TRA sem pressão.',
    emoji: '🧩',
    path: '/play-syllables?mode=complex&practice=true',
  }),
  Object.freeze({
    id: JOURNEY_STAGES.WORDS,
    order: 3,
    label: 'Palavras',
    title: 'Biblioteca Desperta',
    description: 'Pratique palavras completas sem afetar sua expedição.',
    emoji: '📚',
    path: '/play-syllables?mode=words&practice=true',
  }),
  Object.freeze({
    id: JOURNEY_STAGES.SENTENCES,
    order: 4,
    label: 'Frases',
    title: 'Jardim das Histórias',
    description: 'Monte frases livremente usando as palavras já aprendidas.',
    emoji: '📖',
    path: '/play-sentences?practice=true',
  }),
]);

const STAGE_ORDER = Object.freeze({
  [JOURNEY_STAGES.LETTERS]: 0,
  [JOURNEY_STAGES.SYLLABLES]: 1,
  [JOURNEY_STAGES.COMPLEX_SYLLABLES]: 2,
  [JOURNEY_STAGES.WORDS]: 3,
  [JOURNEY_STAGES.SENTENCES]: 4,
  [JOURNEY_STAGES.MASTERY]: 4,
});

export function getJourneyPracticeState(allProgress = []) {
  const journey = getJourneyState(allProgress);
  const unlockedThrough = STAGE_ORDER[journey.stage] ?? 0;
  const options = PRACTICE_MODES.map((mode) => ({
    ...mode,
    unlocked: mode.order <= unlockedThrough,
    current: journey.stage === mode.id,
  }));
  const currentOption = options.find((option) => option.current)
    || options.filter((option) => option.unlocked).at(-1)
    || options[0];

  return {
    journeyStage: journey.stage,
    mastered: journey.stage === JOURNEY_STAGES.MASTERY,
    currentOption,
    unlockedCount: options.filter((option) => option.unlocked).length,
    totalCount: options.length,
    options,
  };
}
