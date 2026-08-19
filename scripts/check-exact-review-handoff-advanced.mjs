import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildExactReviewPath } from '../src/game/learnerReviewQuestEngine.js';

assert.equal(
  buildExactReviewPath('/play-syllables?review=1', 'SYL_VO'),
  '/play-syllables?review=1&reviewTarget=SYL_VO',
);
assert.equal(
  buildExactReviewPath('/play-syllables?mode=complex&review=1', 'SYLC_TRI'),
  '/play-syllables?mode=complex&review=1&reviewTarget=SYLC_TRI',
);
assert.equal(
  buildExactReviewPath('/play-syllables?mode=words&review=1', 'WORD_VACA'),
  '/play-syllables?mode=words&review=1&reviewTarget=WORD_VACA',
);
assert.equal(
  buildExactReviewPath('/play-sentences?review=1', 'SENT_20'),
  '/play-sentences?review=1&reviewTarget=SENT_20',
);

const syllableSource = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
for (const required of [
  "const isReviewMode = urlParams.get('review') === '1'",
  "const requestedReviewTargetKey = isReviewMode ? urlParams.get('reviewTarget') : null",
  'function findReviewItemIndex(targetKey)',
  'const requestedDailyItemIndex = isDailyMode ? findDailyItemIndex(requestedDailyTargetKey) : -1',
  'const requestedReviewItemIndex = isReviewMode ? findReviewItemIndex(requestedReviewTargetKey) : -1',
  'if (requestedDailyItemIndex >= 0) return requestedDailyItemIndex',
  'if (requestedReviewItemIndex >= 0) return requestedReviewItemIndex',
  'useRef(isDailyMode || requestedReviewItemIndex >= 0)',
  '<CurriculumGameplayHud',
]) {
  assert.ok(syllableSource.includes(required), `PlaySyllables M22 invariant missing: ${required}`);
}
assert.ok(
  syllableSource.indexOf('if (requestedDailyItemIndex >= 0)') < syllableSource.indexOf('if (requestedReviewItemIndex >= 0)'),
  'Daily target must retain first precedence over Review target in syllables/words',
);

const curriculumHudSource = await readFile(new URL('../src/components/game/CurriculumGameplayHud.jsx', import.meta.url), 'utf8');
assert.ok(
  curriculumHudSource.includes('!isPracticeMode && !isReviewMode && !isDailyMode'),
  'delegated curriculum HUD must hide campaign context during Practice, Review and Daily modes',
);
assert.ok(
  curriculumHudSource.includes("const resolvedHomePath = homePath || (isReviewMode ? '/' : '/world')"),
  'delegated curriculum HUD must keep Review fallback isolated from the world map',
);
assert.ok(
  curriculumHudSource.includes('<Link to={resolvedHomePath}'),
  'delegated curriculum HUD must navigate through the resolved safe home path',
);

const sentenceSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
for (const required of [
  "const isReviewMode = urlParams.get('review') === '1'",
  "const requestedReviewTargetKey = isReviewMode ? urlParams.get('reviewTarget') : null",
  "const homePath = isPracticeMode ? '/practice' : isReviewMode ? '/' : '/world'",
  'function findReviewSentenceIndex(targetKey)',
  'const requestedDailySentenceIndex = isDailyMode ? findDailySentenceIndex(requestedDailyTargetKey) : -1',
  'const requestedReviewSentenceIndex = isReviewMode ? findReviewSentenceIndex(requestedReviewTargetKey) : -1',
  'if (requestedDailySentenceIndex >= 0) return requestedDailySentenceIndex',
  'if (requestedReviewSentenceIndex >= 0) return requestedReviewSentenceIndex',
  'useRef(isDailyMode || requestedReviewSentenceIndex >= 0)',
  'homePath={homePath}',
]) {
  assert.ok(sentenceSource.includes(required), `PlaySentences M22/M37-C invariant missing: ${required}`);
}
assert.ok(
  sentenceSource.indexOf('if (requestedDailySentenceIndex >= 0)') < sentenceSource.indexOf('if (requestedReviewSentenceIndex >= 0)'),
  'Daily target must retain first precedence over Review target in sentences',
);

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Advanced exact review handoff contract'));
assert.ok(ciSource.includes('node scripts/check-exact-review-handoff-advanced.mjs'));
assert.ok(ciSource.includes('Advanced exact review browser QA'));

console.log('Lexia M22/M37-B/M37-C Advanced Exact Review Handoff contract: PASS (simple + complex + words + sentences exact targets, Daily precedence + resolved HUD isolation preserved)');
