import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const playSource = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
const hudSource = await readFile(new URL('../src/components/game/CurriculumGameplayHud.jsx', import.meta.url), 'utf8');

assert.ok(playSource.includes("import CurriculumGameplayHud from '@/components/game/CurriculumGameplayHud'"));
assert.ok(playSource.includes("import GameActionButton from '@/components/game/GameActionButton'"));
assert.ok(playSource.includes("import GamePanel from '@/components/game/GamePanel'"));
assert.equal(playSource.includes("from '@/components/ui/button'"), false, 'PlaySyllables must not own raw Button presentation');
assert.equal(playSource.includes("from 'react-router-dom'"), false, 'PlaySyllables navigation must be delegated to the HUD');

for (const expected of [
  "title: 'Sílabas Simples'",
  "title: 'Sílabas Complexas'",
  "title: 'Primeiras Palavras'",
  "entityPrefix: 'SYL_'",
  "entityPrefix: 'SYLC_'",
  "entityPrefix: 'WORD_'",
  '<CurriculumGameplayHud',
  '<GamePanel',
  '<GameActionButton',
  "gameVariant=\"primary\"",
  "gameVariant=\"secondary\"",
  'loadLearnerReviewContinuation(lexiaPlatform.progress)',
  'navigateLearnerReviewContinuation(continuation)',
  'if (isReviewMode && !isDailyMode)',
  "{isReviewMode ? 'Próxima revisão' : 'Próximo'}",
]) {
  assert.ok(playSource.includes(expected), `M37-B invariant missing: ${expected}`);
}

assert.ok(hudSource.includes("to={isReviewMode ? '/' : '/world'}"));
assert.ok(hudSource.includes('lexia-gameplay-hud'));
assert.ok(hudSource.includes('lexia-gameplay-context-reward'));
assert.ok(hudSource.includes('isPracticeMode'));
assert.ok(hudSource.includes('isDailyMode'));
assert.ok(hudSource.includes('isReviewMode'));

console.log('Lexia M37-B Premium Syllables/Words HUD contract: PASS (simple + complex + words share premium HUD/actions; review/daily routing preserved)');
