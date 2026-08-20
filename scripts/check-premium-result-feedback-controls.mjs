import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const resultActions = await readFile(new URL('../src/components/game/GameplayResultActions.jsx', import.meta.url), 'utf8');

for (const token of [
  "import GameActionButton from '@/components/game/GameActionButton'",
  'lexia-result-feedback-panel',
  'lexia-result-correction',
  'lexia-result-correction-negative',
  'lexia-result-correction-positive',
  'onClick={() => onManualOverride(false)}',
  'onClick={() => onManualOverride(true)}',
  'Estava errado',
  'Estava certo!',
  'text-destructive',
  'border-destructive/40',
  'hover:bg-destructive/10',
  'text-secondary',
  'border-secondary/40',
  'hover:bg-secondary/10',
]) {
  assert.ok(resultActions.includes(token), `M38-S result feedback invariant missing: ${token}`);
}

for (const legacy of [
  'text-red-',
  'border-red-',
  'bg-red-',
  'text-green-',
  'border-green-',
  'bg-green-',
  'shadow-sm',
  'bg-gradient',
]) {
  assert.equal(
    resultActions.includes(legacy),
    false,
    `M38-S result feedback must not regress to fixed utility chrome: ${legacy}`,
  );
}

assert.equal(
  (resultActions.match(/onManualOverride\((?:false|true)\)/g) || []).length,
  2,
  'Manual correction must keep exactly the negative and positive override actions',
);
assert.ok(resultActions.includes('onClick={onRetry}'), 'Retry behavior must remain intact');
assert.ok(resultActions.includes('onClick={onContinue}'), 'Continue behavior must remain intact');
assert.ok(resultActions.includes('disabled={isWorking}'), 'Result controls must remain disabled while work is pending');
assert.ok(resultActions.includes('to="/world"'), 'Journey map handoff must remain intact');

console.log('Lexia M38-S Premium Result Feedback Controls: PASS (manual AI corrections use semantic destructive/secondary tokens; callbacks and navigation preserved)');
