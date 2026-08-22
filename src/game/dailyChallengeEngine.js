import { ALPHABET } from '../lib/alphabetData.js';
import { BASIC_SENTENCES } from '../lib/sentencesData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../lib/syllablesData.js';
import { getDailyChallengeCandidates } from '../learning/engine.js';
import { getJourneyState, JOURNEY_STAGES } from './journeyEngine.js';

export const DAILY_CHALLENGE_TYPES = Object.freeze({
  LETTERS: 'letters',
  SIMPLE_SYLLABLES: 'simple-syllables',
  COMPLEX_SYLLABLES: 'complex-syllables',
  WORDS: 'words',
  SENTENCES: 'sentences',
});

const TYPE_ORDER = Object.freeze([
  DAILY_CHALLENGE_TYPES.LETTERS,
  DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES,
  DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES,
  DAILY_CHALLENGE_TYPES.WORDS,
  DAILY_CHALLENGE_TYPES.SENTENCES,
]);

const TYPE_META = Object.freeze({
  [DAILY_CHALLENGE_TYPES.LETTERS]: Object.freeze({
    label: 'Letras',
    title: 'Sinais do dia',
    description: 'Revise três letras da sua trilha atual.',
    playPath: '/play?daily=1',
  }),
  [DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES]: Object.freeze({
    label: 'Sílabas simples',
    title: 'Pontes do dia',
    description: 'Reforce três combinações sonoras simples.',
    playPath: '/play-syllables?daily=1',
  }),
  [DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES]: Object.freeze({
    label: 'Sílabas complexas',
    title: 'Encontros do dia',
    description: 'Reveja três encontros sonoros mais desafiadores.',
    playPath: '/play-syllables?mode=complex&daily=1',
  }),
  [DAILY_CHALLENGE_TYPES.WORDS]: Object.freeze({
    label: 'Primeiras palavras',
    title: 'Palavras do dia',
    description: 'Pratique três palavras inteiras mantendo a precisão.',
    playPath: '/play-syllables?mode=words&daily=1',
  }),
  [DAILY_CHALLENGE_TYPES.SENTENCES]: Object.freeze({
    label: 'Frases mágicas',
    title: 'Histórias do dia',
    description: 'Monte três frases usando a ordem correta das palavras.',
    playPath: '/play-sentences?daily=1',
  }),
});

function hashText(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function masteryPressure(record) {
  const attempts = Number(record?.total_attempts || 0);
  const correct = Number(record?.correct_attempts || 0);
  if (attempts <= 0) return 0;
  return Math.round((correct / attempts) * 100);
}

function deterministicThree(items, seed) {
  const uniqueItems = [...new Map(items.map((item) => [item.key, item])).values()];
  if (uniqueItems.length <= 3) return uniqueItems.slice(0, 3);
  const pool = uniqueItems.slice(0, Math.min(8, uniqueItems.length));
  const offset = hashText(seed) % pool.length;
  return [0, 1, 2].map((step) => pool[(offset + step) % pool.length]);
}

function rankCatalog(allProgress, catalog) {
  const progressByKey = new Map((allProgress || []).map((record) => [record?.letter, record]));
  return catalog
    .map((target, order) => ({
      ...target,
      pressure: masteryPressure(progressByKey.get(target.key)),
      order,
    }))
    .sort((a, b) => a.pressure - b.pressure || a.order - b.order)
    .map(({ pressure: _pressure, order: _order, ...target }) => target);
}

function letterCatalog(allProgress) {
  const byLetter = new Map(ALPHABET.map((item) => [item.letter, item]));
  const candidates = getDailyChallengeCandidates(allProgress, ALPHABET, 8);
  return candidates.map((candidate) => {
    const item = byLetter.get(candidate.letter);
    return {
      key: candidate.letter,
      display: candidate.letter,
      emoji: item?.emoji || '🔤',
      hint: item?.word || candidate.letter,
    };
  });
}

const SIMPLE_CATALOG = Object.freeze(BASIC_SYLLABLES.map((item) => Object.freeze({
  key: `SYL_${item.syllable}`,
  display: item.syllable,
  emoji: item.emoji,
  hint: item.word,
})));

const COMPLEX_CATALOG = Object.freeze(COMPLEX_SYLLABLES.map((item) => Object.freeze({
  key: `SYLC_${item.syllable}`,
  display: item.syllable,
  emoji: item.emoji,
  hint: item.word,
})));

const WORD_CATALOG = Object.freeze(BASIC_WORDS.map((item) => Object.freeze({
  key: `WORD_${item.word}`,
  display: item.word,
  emoji: item.emoji,
  hint: item.hint,
})));

const SENTENCE_CATALOG = Object.freeze(BASIC_SENTENCES.map((item) => Object.freeze({
  key: `SENT_${item.id}`,
  display: item.sentence,
  emoji: item.emoji,
  hint: item.hint,
})));

export function getDailyChallengeType(allProgress = [], dateKey = new Date().toISOString().slice(0, 10)) {
  const journey = getJourneyState(allProgress);
  if (journey.stage === JOURNEY_STAGES.LETTERS) return DAILY_CHALLENGE_TYPES.LETTERS;
  if (journey.stage === JOURNEY_STAGES.SYLLABLES) return DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES;
  if (journey.stage === JOURNEY_STAGES.COMPLEX_SYLLABLES) return DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES;
  if (journey.stage === JOURNEY_STAGES.WORDS) return DAILY_CHALLENGE_TYPES.WORDS;
  if (journey.stage === JOURNEY_STAGES.SENTENCES) return DAILY_CHALLENGE_TYPES.SENTENCES;

  // After the main journey is mastered, the daily challenge rotates across all
  // five curriculum families instead of freezing on one late-stage mechanic.
  return TYPE_ORDER[hashText(dateKey) % TYPE_ORDER.length];
}

export function buildDailyChallengeDefinition(allProgress = [], dateKey = new Date().toISOString().slice(0, 10)) {
  const type = getDailyChallengeType(allProgress, dateKey);
  const meta = TYPE_META[type];
  let ranked;

  if (type === DAILY_CHALLENGE_TYPES.LETTERS) ranked = letterCatalog(allProgress);
  else if (type === DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES) ranked = rankCatalog(allProgress, SIMPLE_CATALOG);
  else if (type === DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES) ranked = rankCatalog(allProgress, COMPLEX_CATALOG);
  else if (type === DAILY_CHALLENGE_TYPES.WORDS) ranked = rankCatalog(allProgress, WORD_CATALOG);
  else ranked = rankCatalog(allProgress, SENTENCE_CATALOG);

  const targets = deterministicThree(ranked, `${dateKey}:${type}`);
  if (targets.length < 3) {
    throw new Error(`Daily challenge ${type} requires at least three available targets`);
  }

  return {
    schema: 'lexia.daily-challenge.v2',
    date: dateKey,
    type,
    typeLabel: meta.label,
    title: meta.title,
    description: meta.description,
    playPath: meta.playPath,
    targetKeys: targets.map((target) => target.key),
    targets,
    starsMultiplier: 2,
  };
}

export function getDailyChallengeCompletedCount(challenge) {
  return (challenge?.targetKeys || []).filter((key) => Boolean(challenge?.progress?.[key])).length;
}

export function getNextDailyChallengeTarget(challenge) {
  if (!challenge) return null;
  return (challenge.targets || []).find((target) => !challenge.progress?.[target.key]) || null;
}

export function isDailyChallengeTarget(challenge, entityKey) {
  return Boolean(challenge?.targetKeys?.includes(entityKey));
}

export function getDailyChallengeStarMultiplier(challenge, entityKey) {
  if (!challenge || challenge.completed) return 1;
  if (!isDailyChallengeTarget(challenge, entityKey)) return 1;
  if (challenge.progress?.[entityKey]) return 1;
  return Number(challenge.starsMultiplier || 1);
}
