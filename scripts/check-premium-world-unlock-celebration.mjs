import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = 'src/components/game/WorldUnlockCelebration.jsx';
const source = await readFile(file, 'utf8');

const requiredTokens = [
  "import GamePanel from './GamePanel'",
  "import GameActionButton from './GameActionButton'",
  'tone="reward"',
  'tone="paper"',
  'gameVariant="primary"',
  "'#24445c'",
  "'#2f7d67'",
  "'#c6933f'",
  'playCelebrationSound()',
  'particleCount: 120',
  'Date.now() + 2000',
  "shapes: ['star']",
  '}, 600)',
  '}, 1200)',
  'onClick={onDone}',
  'onDone?.()',
];

for (const token of requiredTokens) {
  assert.ok(source.includes(token), `WorldUnlockCelebration must include ${token}`);
}

const forbiddenTokens = [
  'backdrop-blur',
  'blur-3xl',
  'shadow-lg',
  '<motion.button',
  '#7c3aed',
  '#06b6d4',
  '#ec4899',
  '#10b981',
  'Glow ring',
  'bg-gradient',
];

for (const token of forbiddenTokens) {
  assert.ok(!source.includes(token), `WorldUnlockCelebration must not include legacy visual token ${token}`);
}

assert.ok(
  source.includes('confetti({'),
  'WorldUnlockCelebration must preserve authored confetti feedback',
);
assert.ok(
  source.includes('clearTimeout(t1); clearTimeout(t2);'),
  'WorldUnlockCelebration must preserve timer cleanup',
);

console.log('Lexia M38-M Premium World Unlock Celebration: PASS (premium materials, authored palette, canonical action, timing and behavior preserved)');
