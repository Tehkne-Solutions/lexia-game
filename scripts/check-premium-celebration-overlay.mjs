import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const componentFile = 'src/components/game/CelebrationOverlay.jsx';
const styleFile = 'src/styles/premium-celebration.css';
const [source, styles] = await Promise.all([
  readFile(componentFile, 'utf8'),
  readFile(styleFile, 'utf8'),
]);

const requiredTokens = [
  "import '@/styles/premium-celebration.css'",
  "import GamePanel from './GamePanel'",
  "import GameActionButton from './GameActionButton'",
  'lexia-celebration-backdrop',
  'tone="reward"',
  'gameVariant="primary"',
  "'#24445c'",
  "'#2f7d67'",
  "'#c6933f'",
  'onDone?.()',
  'const end = Date.now() + 1500',
  '}, 500)',
];

for (const token of requiredTokens) {
  assert.ok(source.includes(token), `CelebrationOverlay must include ${token}`);
}

const forbiddenTokens = [
  'backdrop-blur',
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

assert.ok(styles.includes('.lexia-celebration-backdrop'), 'Celebration backdrop material must be defined');
assert.ok(styles.includes('hsl(var(--background) / 0.94)'), 'Celebration backdrop must use the semantic background token');
assert.ok(styles.includes('.high-contrast .lexia-celebration-backdrop'), 'Celebration backdrop must preserve high contrast override');
assert.ok(!styles.includes('backdrop-filter'), 'Celebration backdrop material must not reintroduce glass blur');
assert.ok(!styles.includes('linear-gradient'), 'Celebration backdrop material must not use gradients');

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
assert.ok(
  source.includes('event.stopPropagation();'),
  'CelebrationOverlay primary action must preserve click isolation',
);

console.log('Lexia M38-X Premium Celebration Backdrop: PASS (semantic opaque material, no blur/gradient, authored palette and celebration behavior preserved)');
