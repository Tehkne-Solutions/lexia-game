import { ALPHABET } from '../lib/alphabetData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../lib/syllablesData.js';
import { STORY_CHAPTERS } from '../lib/stories.js';
import { getWorldRelics } from './worldExperienceEngine.js';

function relicState(stats = {}) {
  return new Map(getWorldRelics(stats).map((relic) => [relic.id, relic]));
}

export function getStoryChapterState(chapter, stats = {}) {
  if (!chapter?.unlockAfterRelicId) {
    return {
      unlocked: true,
      requiredRelicId: null,
      requiredRelicName: null,
    };
  }

  const relics = relicState(stats);
  const required = relics.get(chapter.unlockAfterRelicId);
  if (!required) throw new Error(`Unknown story prerequisite relic: ${chapter.unlockAfterRelicId}`);

  return {
    unlocked: Boolean(required.unlocked),
    requiredRelicId: required.id,
    requiredRelicName: required.name,
  };
}

export function getStoryLibrary(stats = {}) {
  return STORY_CHAPTERS.map((chapter) => ({
    ...chapter,
    ...getStoryChapterState(chapter, stats),
  }));
}

export function getUnlockedStoryChapters(stats = {}) {
  return getStoryLibrary(stats).filter((chapter) => chapter.unlocked);
}

function toSpeedItem({ display, emoji, kind, source }) {
  return Object.freeze({ display, emoji, kind, source });
}

const SPEED_TIERS = Object.freeze([
  Object.freeze({
    id: 'letters',
    label: 'Letras',
    description: 'Reconheça e digite letras com rapidez.',
    unlockAfterRelicId: null,
    items: Object.freeze(ALPHABET.map((item) => toSpeedItem({
      display: item.letter,
      emoji: item.emoji,
      kind: 'letter',
      source: item.word,
    }))),
  }),
  Object.freeze({
    id: 'simple-syllables',
    label: 'Sílabas simples',
    description: 'Combine duas letras sem perder precisão.',
    unlockAfterRelicId: 'relic-alphabet-quill',
    items: Object.freeze(BASIC_SYLLABLES.map((item) => toSpeedItem({
      display: item.syllable,
      emoji: item.emoji,
      kind: 'simple-syllable',
      source: item.word,
    }))),
  }),
  Object.freeze({
    id: 'complex-syllables',
    label: 'Sílabas complexas',
    description: 'Treine encontros mais longos e raros.',
    unlockAfterRelicId: 'relic-syllable-shell',
    items: Object.freeze(COMPLEX_SYLLABLES.map((item) => toSpeedItem({
      display: item.syllable,
      emoji: item.emoji,
      kind: 'complex-syllable',
      source: item.word,
    }))),
  }),
  Object.freeze({
    id: 'words',
    label: 'Primeiras palavras',
    description: 'Digite palavras inteiras mantendo o ritmo.',
    unlockAfterRelicId: 'relic-complex-compass',
    items: Object.freeze(BASIC_WORDS.map((item) => toSpeedItem({
      display: item.word,
      emoji: item.emoji,
      kind: 'word',
      source: item.hint,
    }))),
  }),
]);

export function getSpeedChallengeProfile(stats = {}) {
  const relics = relicState(stats);
  const tiers = SPEED_TIERS.map((tier) => {
    if (!tier.unlockAfterRelicId) return { ...tier, unlocked: true };
    const required = relics.get(tier.unlockAfterRelicId);
    if (!required) throw new Error(`Unknown speed prerequisite relic: ${tier.unlockAfterRelicId}`);
    return { ...tier, unlocked: Boolean(required.unlocked) };
  });
  const unlockedTiers = tiers.filter((tier) => tier.unlocked);
  const pool = unlockedTiers.flatMap((tier) => tier.items);
  const currentTier = unlockedTiers.at(-1) || tiers[0];

  return {
    id: unlockedTiers.map((tier) => tier.id).join('+'),
    label: currentTier.label,
    description: currentTier.description,
    tiers,
    unlockedTiers,
    unlockedTierCount: unlockedTiers.length,
    totalTierCount: tiers.length,
    pool,
    sentenceTrainingPath: '/play-sentences',
    sentenceTrainingReason: 'Frases usam composição por palavras e permanecem no modo próprio, sem reduzir o treino a digitação sem espaços.',
  };
}
