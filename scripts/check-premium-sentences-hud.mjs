import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sentenceSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
const hudSource = await readFile(new URL('../src/components/game/CurriculumGameplayHud.jsx', import.meta.url), 'utf8');

assert.ok(sentenceSource.includes("import CurriculumGameplayHud from '@/components/game/CurriculumGameplayHud'"));
assert.ok(sentenceSource.includes("import GameActionButton from '@/components/game/GameActionButton'"));
assert.ok(sentenceSource.includes("import GamePanel from '@/components/game/GamePanel'"));
assert.equal(sentenceSource.includes("from '@/components/ui/button'"), false, 'PlaySentences must not own raw CTA Button presentation');
assert.equal(sentenceSource.includes("from 'react-router-dom'"), false, 'PlaySentences navigation must be delegated to the HUD');

for (const expected of [
  "const homePath = isPracticeMode ? '/practice' : isReviewMode ? '/' : '/world'",
  '<CurriculumGameplayHud',
  'title="Frases Mágicas"',
  'missionLabel="O Jardim das Histórias"',
  'dailyBonusLabel="alvo novo vale ⭐×2"',
  '<GamePanel',
  '<GameActionButton',
  'Ouvir pista',
  'Verificar frase',
  "{isReviewMode ? 'Próxima revisão' : 'Próxima história'}",
  'Tentar outra ordem',
  'loadLearnerReviewContinuation(lexiaPlatform.progress)',
  'navigateLearnerReviewContinuation(continuation)',
  'if (isReviewMode && !isDailyMode)',
]) {
  assert.ok(sentenceSource.includes(expected), `M37-C invariant missing: ${expected}`);
}

assert.ok(sentenceSource.includes('<button'), 'word-order tokens must remain native semantic buttons');
assert.ok(sentenceSource.includes('addToken(token.id)'), 'available token interaction must remain intact');
assert.ok(sentenceSource.includes('removeToken(token.id)'), 'selected token interaction must remain intact');
assert.ok(hudSource.includes('const resolvedHomePath = homePath || (isReviewMode ? \'/\' : \'/world\')'));
assert.ok(hudSource.includes("resolvedHomePath === '/practice'"), 'shared HUD must support returning sentence practice to Practice Hub');

console.log('Lexia M37-C Premium Sentences HUD contract: PASS (sentence builder mechanics intact; premium HUD/actions + practice/daily/review routing preserved)');
