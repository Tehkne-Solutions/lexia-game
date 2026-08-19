import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  REVIEW_COMPLETE_PATH,
  getLearnerReviewContinuation,
} from '../src/game/learnerReviewQuestEngine.js';
import {
  loadLearnerReviewContinuation,
  navigateLearnerReviewContinuation,
} from '../src/game/learnerReviewRuntime.js';
import { ALPHABET } from '../src/lib/alphabetData.js';
import { BASIC_SENTENCES } from '../src/lib/sentencesData.js';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '../src/lib/syllablesData.js';

const now = Date.parse('2026-08-18T18:00:00.000Z');
const hour = 60 * 60 * 1000;
const future = new Date(now + 24 * hour).toISOString();

function masteredLetter(letter, nextReview = future) {
  return {
    letter,
    total_attempts: 5,
    correct_attempts: 5,
    stability: 10,
    difficulty: 3,
    interval: 30,
    repetitions: 5,
    next_review: nextReview,
    streak: 5,
    last_grade: 4,
    stars_earned: 2,
  };
}

function masteredAdvanced(key, nextReview = future) {
  return {
    letter: key,
    total_attempts: 3,
    correct_attempts: 3,
    stability: 6,
    difficulty: 3,
    interval: 14,
    repetitions: 3,
    next_review: nextReview,
    streak: 3,
    last_grade: 4,
    stars_earned: 1,
  };
}

const letters = ALPHABET.map(({ letter }) => masteredLetter(letter));
const simple = BASIC_SYLLABLES.map((item) => masteredAdvanced(`SYL_${item.syllable}`));
const complex = COMPLEX_SYLLABLES.map((item) => masteredAdvanced(`SYLC_${item.syllable}`));
const words = BASIC_WORDS.map((item) => masteredAdvanced(`WORD_${item.word}`));
const sentences = BASIC_SENTENCES.map((item) => masteredAdvanced(`SENT_${item.id}`));

const zIndex = letters.findIndex((record) => record.letter === 'Z');
const vacaIndex = words.findIndex((record) => record.letter === 'WORD_VACA');
assert.ok(zIndex >= 0, 'canonical alphabet must include Z');
assert.ok(vacaIndex >= 0, 'canonical word catalog must include VACA');
letters[zIndex] = masteredLetter('Z', new Date(now - 3 * hour).toISOString());
words[vacaIndex] = masteredAdvanced('WORD_VACA', new Date(now - hour).toISOString());
const dueProgress = [...letters, ...simple, ...complex, ...words, ...sentences];

const first = getLearnerReviewContinuation(dueProgress, { now });
assert.equal(first.complete, false);
assert.equal(first.remainingDue, 2);
assert.equal(first.nextEntityKey, 'Z', 'oldest due target must be the next review even across chapters');
assert.equal(first.path, '/play?review=1&reviewTarget=Z');
assert.equal(first.nextChapter?.id, 'letters');

const afterLetter = dueProgress.map((record) => record.letter === 'Z'
  ? { ...record, next_review: future }
  : record);
const second = getLearnerReviewContinuation(afterLetter, { now });
assert.equal(second.complete, false);
assert.equal(second.remainingDue, 1);
assert.equal(second.nextEntityKey, 'WORD_VACA');
assert.equal(second.path, '/play-syllables?mode=words&review=1&reviewTarget=WORD_VACA');
assert.equal(second.nextChapter?.id, 'words', 'due-only session must hand off across chapter boundaries');

const allFuture = afterLetter.map((record) => record.letter === 'WORD_VACA'
  ? { ...record, next_review: future }
  : record);
const complete = getLearnerReviewContinuation(allFuture, { now });
assert.equal(complete.complete, true);
assert.equal(complete.remainingDue, 0);
assert.equal(complete.nextEntityKey, null);
assert.equal(complete.path, REVIEW_COMPLETE_PATH);
assert.equal(complete.path, '/?reviewComplete=1');

const onlyFuture = getLearnerReviewContinuation([
  masteredLetter('A', future),
], { now });
assert.equal(onlyFuture.complete, true, 'future scheduled items must not keep a due-only session alive');

const lockedWord = getLearnerReviewContinuation([
  masteredLetter('A', future),
  masteredAdvanced('WORD_LOCKED', new Date(now - 10 * hour).toISOString()),
], { now });
assert.equal(lockedWord.complete, true, 'due items in locked chapters remain excluded from learner review');

let listCalls = 0;
const provider = {
  list: async () => {
    listCalls += 1;
    return afterLetter;
  },
};
const loaded = await loadLearnerReviewContinuation(provider, { now });
assert.equal(listCalls, 1, 'continuation must reread persisted progress exactly once');
assert.equal(loaded.allProgress.length, afterLetter.length);
assert.equal(loaded.continuation.nextEntityKey, 'WORD_VACA');

let assignedPath = null;
navigateLearnerReviewContinuation(
  loaded.continuation,
  { assign: (path) => { assignedPath = path; } },
);
assert.equal(assignedPath, loaded.continuation.path, 'runtime navigation must use the fresh persisted continuation path');

const playGameSource = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(playGameSource.includes('loadLearnerReviewContinuation(lexiaPlatform.progress)'));
assert.ok(playGameSource.includes('navigateLearnerReviewContinuation(continuation)'));
assert.ok(playGameSource.includes('if (isReviewMode && !isDailyMode)'));
assert.ok(playGameSource.includes('await continueReviewSession()'));
assert.ok(playGameSource.includes("!isReviewMode && dailyChallenge?.type === 'letters'"), 'letter review must not expose Daily launcher');
assert.ok(playGameSource.includes('{!isReviewMode && ('), 'letter review must not expose arbitrary letter selector');

const syllableSource = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
assert.ok(syllableSource.includes('loadLearnerReviewContinuation(lexiaPlatform.progress)'));
assert.ok(syllableSource.includes('const nextItem = useCallback(async () =>'));
assert.ok(syllableSource.includes('if (isReviewMode && !isDailyMode)'));
assert.ok(syllableSource.includes("{isReviewMode ? 'Próxima revisão' : 'Próximo'}"));

const sentenceSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
assert.ok(sentenceSource.includes('loadLearnerReviewContinuation(lexiaPlatform.progress)'));
assert.ok(sentenceSource.includes('const nextItem = useCallback(async () =>'));
assert.ok(sentenceSource.includes('if (isReviewMode && !isDailyMode)'));
assert.ok(sentenceSource.includes("isReviewMode ? '/' : '/world'"));
assert.ok(sentenceSource.includes("{isReviewMode ? 'Próxima revisão' : 'Próxima história'}"));

for (const source of [playGameSource, syllableSource, sentenceSource]) {
  const reviewBranch = source.indexOf('if (isReviewMode && !isDailyMode)');
  assert.ok(reviewBranch >= 0, 'every mechanic must have an explicit due-only review continuation branch');
}

const welcomeSource = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcomeSource.includes("get('reviewComplete') === '1'"));
assert.ok(welcomeSource.includes('Revisões em dia'));
assert.ok(welcomeSource.includes('Você terminou tudo que estava pronto para hoje.'));
assert.ok(welcomeSource.includes('reviewCompleted && !reviewQuest.hasDueReviews'));

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Due-only review session contract'));
assert.ok(ciSource.includes('Due-only review browser QA'));

console.log('Lexia M23/M27 Due-Only Review Session contract: PASS (canonical whole-curriculum queue, fresh persisted handoff, explicit completion)');
