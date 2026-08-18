import { getWorldRelics } from './worldExperienceEngine.js';

const RELIC_VISUALS = Object.freeze({
  'relic-alphabet-quill': Object.freeze({ emoji: '🪶', shortName: 'Pena das Vozes' }),
  'relic-syllable-shell': Object.freeze({ emoji: '🐚', shortName: 'Concha dos Sons' }),
  'relic-complex-compass': Object.freeze({ emoji: '🧭', shortName: 'Bússola' }),
  'relic-word-key': Object.freeze({ emoji: '🗝️', shortName: 'Chave' }),
  'relic-sentence-seed': Object.freeze({ emoji: '🌱', shortName: 'Semente' }),
  'relic-mastery-lantern': Object.freeze({ emoji: '🏮', shortName: 'Lanterna' }),
});

export function buildJourneyCollectibles(stats = {}) {
  return getWorldRelics(stats).map((relic) => {
    const visual = RELIC_VISUALS[relic.id];
    if (!visual) throw new Error(`Missing visual mapping for canonical relic: ${relic.id}`);

    return {
      id: relic.id,
      category: 'journey',
      worldId: relic.worldId,
      chapter: relic.chapter,
      worldTitle: relic.worldTitle,
      name: relic.name,
      shortName: visual.shortName,
      description: relic.description,
      emoji: visual.emoji,
      unlocked: relic.unlocked,
    };
  });
}

export function getJourneyCollectibleProgress(stats = {}) {
  const collectibles = buildJourneyCollectibles(stats);
  return {
    unlocked: collectibles.filter((item) => item.unlocked).length,
    total: collectibles.length,
    collectibles,
  };
}
