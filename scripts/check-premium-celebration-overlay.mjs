import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = 'src/components/game/CelebrationOverlay.jsx';
const source = await readFile(file, 'utf8');

const requiredTokens = [
  "import GamePanel from './GamePanel'",
  "import GameActionButton from './GameActionButton'",
  'tone="reward"',
  'gameVariant="primary"',
  "'#24445c'",
  "'#2f7d67'",
  "'#c6933f'",
  'onDone?.()',
];

for (const token of requiredTokens) {
  assert.ok(source.includes(token), `CelebrationOverlay must include ${token}`);
}

const forbiddenTokens = [
  'blur-2xl',
  '<motion.button',
  '#7c3aed',
  '#ec4899',
  'Glow ring',
  'bg-gradient',
];

for (const token of forbiddenTokens) {
  assert.ok(!source.includes(token), `CelebrationOverlay must not include legacy visual token ${token}`);
}

assert.ok(
  source.includes('playCelebrationSound()'),
  'CelebrationOverlay must preserve celebration audio trigger',
);
assert.ok(
  source.includes('confetti({'),
  'CelebrationOverlay must preserve authored confetti feedback',
);
assert.ok(
  source.includes('onClick={onDone}'),
  'CelebrationOverlay backdrop must preserve tap-to-dismiss behavior',
);

console.log('Lexia M38-G Premium Celebration Overlay: PASS (premium material, authored palette, no glow, canonical action, behavior preserved)');
