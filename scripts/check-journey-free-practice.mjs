import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JOURNEY_STAGES } from '../src/game/journeyEngine.js';
import { getJourneyPracticeState, PRACTICE_MODES } from '../src/game/practiceEngine.js';

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const masteredLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
  letter,
  stability: 10,
  difficulty: 3,
  interval: 30,
  repetitions: 5,
  next_review: futureDate,
  total_attempts: 5,
  correct_attempts: 5,
  streak: 5,
  last_grade: 4,
  stars_earned: 2,
}));
const simple = Array.from({ length: 20 }, (_, index) => ({
  letter: `SYL_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
}));
const complex = Array.from({ length: 20 }, (_, index) => ({
  letter: `SYLC_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
}));
const words = Array.from({ length: 20 }, (_, index) => ({
  letter: `WORD_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
}));
const sentences = Array.from({ length: 20 }, (_, index) => ({
  letter: `SENT_${String(index + 1).padStart(2, '0')}`,
  total_attempts: 3,
  correct_attempts: 3,
}));

const stages = [
  { progress: [], stage: JOURNEY_STAGES.LETTERS, unlocked: 1, current: JOURNEY_STAGES.LETTERS },
  { progress: masteredLetters, stage: JOURNEY_STAGES.SYLLABLES, unlocked: 2, current: JOURNEY_STAGES.SYLLABLES },
  { progress: [...masteredLetters, ...simple], stage: JOURNEY_STAGES.COMPLEX_SYLLABLES, unlocked: 3, current: JOURNEY_STAGES.COMPLEX_SYLLABLES },
  { progress: [...masteredLetters, ...simple, ...complex], stage: JOURNEY_STAGES.WORDS, unlocked: 4, current: JOURNEY_STAGES.WORDS },
  { progress: [...masteredLetters, ...simple, ...complex, ...words], stage: JOURNEY_STAGES.SENTENCES, unlocked: 5, current: JOURNEY_STAGES.SENTENCES },
  { progress: [...masteredLetters, ...simple, ...complex, ...words, ...sentences], stage: JOURNEY_STAGES.MASTERY, unlocked: 5, current: JOURNEY_STAGES.SENTENCES },
];

for (const testCase of stages) {
  const state = getJourneyPracticeState(testCase.progress);
  assert.equal(state.journeyStage, testCase.stage, `${testCase.stage}: practice must use Journey Engine stage`);
  assert.equal(state.unlockedCount, testCase.unlocked, `${testCase.stage}: unlocked practice count`);
  assert.equal(state.totalCount, 5, `${testCase.stage}: catalog remains five curriculum practices`);
  assert.equal(state.currentOption.id, testCase.current, `${testCase.stage}: current recommended practice`);
  assert.equal(state.options.filter((option) => option.unlocked).length, testCase.unlocked);
  assert.ok(state.options.slice(0, testCase.unlocked).every((option) => option.unlocked), `${testCase.stage}: unlocks must stay sequential`);
  assert.ok(state.options.slice(testCase.unlocked).every((option) => !option.unlocked), `${testCase.stage}: future practices must stay locked`);
}

assert.deepEqual(
  PRACTICE_MODES.map(({ id, path }) => [id, path]),
  [
    [JOURNEY_STAGES.LETTERS, '/play?mode=practice'],
    [JOURNEY_STAGES.SYLLABLES, '/play-syllables?practice=true'],
    [JOURNEY_STAGES.COMPLEX_SYLLABLES, '/play-syllables?mode=complex&practice=true'],
    [JOURNEY_STAGES.WORDS, '/play-syllables?mode=words&practice=true'],
    [JOURNEY_STAGES.SENTENCES, '/play-sentences?practice=true'],
  ],
  'all five practices must reuse their canonical mechanics with explicit practice mode',
);

const engineSource = await readFile(new URL('../src/game/practiceEngine.js', import.meta.url), 'utf8');
for (const forbidden of [
  'lettersMastered >=',
  'syllablesMastered >=',
  'complexSyllablesMastered >=',
  'wordsMastered >=',
  'sentencesMastered >=',
]) {
  assert.ok(!engineSource.includes(forbidden), `practice unlocks must not duplicate mastery thresholds: ${forbidden}`);
}
assert.ok(engineSource.includes('getJourneyState(allProgress)'), 'practice unlocks must derive from Journey Engine');

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.ok(appSource.includes('<Route path="/practice" element={<PracticeHub />} />'), 'Practice Hub must be a routed product surface');

const welcomeSource = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcomeSource.includes('<Link to="/practice"'), 'Welcome free practice CTA must open the whole-journey hub');
assert.ok(!welcomeSource.includes('<Link to="/play?mode=practice"'), 'Welcome must not route free practice directly to letters anymore');
assert.ok(welcomeSource.includes('Aprenda a ler com magia! ✨'), 'Welcome identity must describe the full literacy journey');

const hubSource = await readFile(new URL('../src/pages/PracticeHub.jsx', import.meta.url), 'utf8');
assert.ok(hubSource.includes('getJourneyPracticeState(allProgress)'));
assert.ok(hubSource.includes('Continue a jornada para liberar'));
assert.ok(hubSource.includes('A Prática Livre não substitui sua missão atual'));
assert.ok(hubSource.includes('to={option.path}'), 'unlocked practice cards must route through the engine catalog');

const lettersSource = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(lettersSource.includes("const isPracticeMode = urlParams.get('mode') === 'practice'"));
assert.ok(lettersSource.includes('if (!isPracticeMode) saveMutation.mutate'), 'letter practice must remain persistence-free');

const syllablesSource = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
assert.ok(syllablesSource.includes("urlParams.get('practice') === 'true'"));
assert.ok(syllablesSource.includes('if (!isPracticeMode) saveMutation.mutate'), 'syllable/word practice must remain persistence-free');

const sentencesSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
assert.ok(sentencesSource.includes("const isPracticeMode = urlParams.get('practice') === 'true'"));
assert.ok(sentencesSource.includes('{ enabled: !isPracticeMode }'), 'sentence practice must disable Session Quest at creation');
assert.equal(
  (sentencesSource.match(/if \(!isPracticeMode\) saveMutation\.mutate/g) || []).length,
  2,
  'sentence practice must gate both correct and incorrect persistence paths',
);
assert.ok(sentencesSource.includes("to={isPracticeMode ? '/practice' : '/world'}"), 'sentence practice must return to Practice Hub');
assert.ok(sentencesSource.includes("isPracticeMode ? 'Frase completa! Treino livre.'"), 'practice success must not advertise persistent star rewards');

const ciSource = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
assert.ok(ciSource.includes('Journey free practice contract'));
assert.ok(ciSource.includes('node scripts/check-journey-free-practice.mjs'));
assert.ok(ciSource.includes('Practice hub browser QA'));

console.log('Lexia M17 Journey Free Practice contract: PASS (5-stage sequential unlocks, Journey Engine truth, sentence practice persistence-free)');
