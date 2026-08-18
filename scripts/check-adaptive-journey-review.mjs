import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  pickNextJourneyItemIndex,
  rankJourneyReviewItems,
  reviewJourneyProgress,
} from '../src/learning/journeyReviewEngine.js';

const before = Date.now();
const freshSuccess = reviewJourneyProgress(null, true);
assert.equal(freshSuccess.last_grade, 3, 'successful journey review maps to FSRS Good');
assert.equal(freshSuccess.repetitions, 1);
assert.ok(freshSuccess.stability > 0, 'successful review must create positive stability');
assert.ok(freshSuccess.difficulty > 0, 'successful review must create difficulty');
assert.ok(freshSuccess.interval >= 1, 'successful first review must schedule a future interval');
assert.ok(Date.parse(freshSuccess.next_review) > before, 'successful review must schedule a future review');

const freshFailure = reviewJourneyProgress(null, false);
assert.equal(freshFailure.last_grade, 1, 'failed journey review maps to FSRS Again');
assert.equal(freshFailure.repetitions, 1);
assert.ok(freshFailure.stability > 0, 'failed review still initializes scheduler state');
assert.equal(freshFailure.interval, 0, 'failed first review stays immediately due');
assert.ok(Date.parse(freshFailure.next_review) <= Date.now() + 1000, 'failed review must remain due now');

const secondSuccess = reviewJourneyProgress({
  stability: freshSuccess.stability,
  difficulty: freshSuccess.difficulty,
  interval: freshSuccess.interval,
  repetitions: freshSuccess.repetitions,
  next_review: freshSuccess.next_review,
  last_grade: freshSuccess.last_grade,
}, true);
assert.equal(secondSuccess.repetitions, 2, 'FSRS repetitions must advance across journey reviews');
assert.ok(secondSuccess.interval >= 1);

const now = Date.now();
const items = [
  { value: 'A' },
  { value: 'B' },
  { value: 'C' },
  { value: 'D' },
];
const progress = [
  {
    letter: 'X_A',
    total_attempts: 4,
    correct_attempts: 4,
    streak: 4,
    stability: 5,
    next_review: new Date(now - 60_000).toISOString(),
  },
  {
    letter: 'X_B',
    total_attempts: 4,
    correct_attempts: 1,
    streak: 0,
    stability: 1,
    next_review: new Date(now + 86_400_000).toISOString(),
  },
  {
    letter: 'X_D',
    total_attempts: 5,
    correct_attempts: 5,
    streak: 5,
    stability: 10,
    next_review: new Date(now + 172_800_000).toISOString(),
  },
];

const ranked = rankJourneyReviewItems({
  items,
  allProgress: progress,
  entityPrefix: 'X_',
  targetKey: 'value',
  currentIndex: -1,
  now,
});
assert.deepEqual(
  ranked.map((candidate) => candidate.key),
  ['X_A', 'X_B', 'X_C', 'X_D'],
  'priority must be overdue → struggling → not started → healthy review',
);
assert.equal(ranked[0].due, true);
assert.equal(ranked[1].weak, true);
assert.equal(ranked[2].started, false);

assert.equal(
  pickNextJourneyItemIndex({
    items,
    allProgress: progress,
    entityPrefix: 'X_',
    targetKey: 'value',
    currentIndex: -1,
    now,
  }),
  0,
  'first adaptive target must be the oldest due item',
);
assert.equal(
  pickNextJourneyItemIndex({
    items,
    allProgress: progress,
    entityPrefix: 'X_',
    targetKey: 'value',
    currentIndex: 0,
    now,
  }),
  1,
  'current item must be excluded so a next action does not loop on itself',
);

const twoDue = rankJourneyReviewItems({
  items: [{ value: 'A' }, { value: 'E' }],
  allProgress: [
    { letter: 'X_A', total_attempts: 2, correct_attempts: 2, next_review: new Date(now - 10_000).toISOString() },
    { letter: 'X_E', total_attempts: 2, correct_attempts: 2, next_review: new Date(now - 20_000).toISOString() },
  ],
  entityPrefix: 'X_',
  targetKey: 'value',
  currentIndex: -1,
  now,
});
assert.equal(twoDue[0].key, 'X_E', 'among due items, the oldest review must come first');

const syllableSource = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
assert.ok(syllableSource.includes("from '@/learning/journeyReviewEngine'"));
assert.ok(syllableSource.includes('const reviewed = reviewJourneyProgress(existing, isCorrect);'));
assert.ok(syllableSource.includes('pickNextJourneyItemIndex({'));
assert.ok(syllableSource.includes('const { data: allProgress = [], isFetched } = useQuery'));
assert.ok(syllableSource.includes('reviewSelectionInitializedRef'));
assert.ok(!syllableSource.includes('Math.random() * ITEMS.length'), 'syllable/word target choice must no longer be random');
assert.ok(
  syllableSource.indexOf('if (isDailyMode)') < syllableSource.lastIndexOf('const next = pickNextJourneyItemIndex({'),
  'Daily Challenge must preserve precedence over adaptive next-item selection',
);
assert.equal(
  (syllableSource.match(/if \(!isPracticeMode\) saveMutation\.mutate/g) || []).length,
  2,
  'adaptive review must not make free practice persistent',
);

const sentenceSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
assert.ok(sentenceSource.includes("from '@/learning/journeyReviewEngine'"));
assert.ok(sentenceSource.includes('const reviewed = reviewJourneyProgress(existing, isCorrect);'));
assert.ok(sentenceSource.includes("entityPrefix: 'SENT_'"));
assert.ok(sentenceSource.includes("targetKey: 'id'"));
assert.ok(sentenceSource.includes('reviewSelectionInitializedRef'));
assert.ok(!sentenceSource.includes('Math.random() * BASIC_SENTENCES.length'), 'sentence target choice must no longer be random');
assert.ok(
  sentenceSource.indexOf('if (isDailyMode)') < sentenceSource.lastIndexOf('const next = pickNextJourneyItemIndex({'),
  'Sentence Daily Challenge must preserve precedence over adaptive selection',
);
assert.equal(
  (sentenceSource.match(/if \(!isPracticeMode\) saveMutation\.mutate/g) || []).length,
  2,
  'sentence adaptive review must preserve M17 practice isolation',
);

const engineSource = await readFile(new URL('../src/learning/journeyReviewEngine.js', import.meta.url), 'utf8');
assert.ok(engineSource.includes("import { createNewCard, reviewCard } from '../lib/fsrs.js'"), 'M18 must reuse the canonical FSRS scheduler');
assert.ok(engineSource.includes("import { calculateMastery } from './mastery.js'"), 'M18 must reuse the canonical mastery score');
assert.ok(!engineSource.includes('Math.random'), 'adaptive ranking must be deterministic');

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Adaptive journey review contract'));
assert.ok(ciSource.includes('node scripts/check-adaptive-journey-review.mjs'));

console.log('Lexia M18 Adaptive Journey Review contract: PASS (shared FSRS writes, due/weak/new/mastery ranking, Daily and Practice precedence preserved)');
