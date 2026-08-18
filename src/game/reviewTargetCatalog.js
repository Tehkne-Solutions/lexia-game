import { ALPHABET } from '../lib/alphabetData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../lib/syllablesData.js';
import { BASIC_SENTENCES } from '../lib/sentencesData.js';

export const REVIEW_CHAPTER_IDS = Object.freeze({
  LETTERS: 'letters',
  SIMPLE_SYLLABLES: 'syllables-basic',
  COMPLEX_SYLLABLES: 'syllables-complex',
  WORDS: 'words',
  SENTENCES: 'sentences',
});

function targetsFor(items, chapterId, buildKey) {
  return items.map((item) => Object.freeze({
    key: buildKey(item),
    chapterId,
  }));
}

export const CANONICAL_REVIEW_TARGETS = Object.freeze([
  ...targetsFor(ALPHABET, REVIEW_CHAPTER_IDS.LETTERS, (item) => item.letter),
  ...targetsFor(BASIC_SYLLABLES, REVIEW_CHAPTER_IDS.SIMPLE_SYLLABLES, (item) => `SYL_${item.syllable}`),
  ...targetsFor(COMPLEX_SYLLABLES, REVIEW_CHAPTER_IDS.COMPLEX_SYLLABLES, (item) => `SYLC_${item.syllable}`),
  ...targetsFor(BASIC_WORDS, REVIEW_CHAPTER_IDS.WORDS, (item) => `WORD_${item.word}`),
  ...targetsFor(BASIC_SENTENCES, REVIEW_CHAPTER_IDS.SENTENCES, (item) => `SENT_${item.id}`),
]);

const REVIEW_TARGET_BY_KEY = new Map(
  CANONICAL_REVIEW_TARGETS.map((target) => [target.key, target]),
);

export function getCanonicalReviewTarget(entityKey) {
  return REVIEW_TARGET_BY_KEY.get(String(entityKey || '')) || null;
}

export function getCanonicalReviewChapterId(entityKey) {
  return getCanonicalReviewTarget(entityKey)?.chapterId || null;
}

export function isCanonicalReviewTarget(entityKey) {
  return REVIEW_TARGET_BY_KEY.has(String(entityKey || ''));
}
