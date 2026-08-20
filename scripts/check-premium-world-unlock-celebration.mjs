import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const componentFile = 'src/components/game/WorldUnlockCelebration.jsx';
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
  'initial={{ opacity: 0, y: 15 }}',
  'transition={{ delay: 1 }}',
  'whileHover={{ scale: 1.05 }}',
  'whileTap={{ scale: 0.95 }}',
  'onClick={onDone}',
  'onDone?.()',
];

for (const token of requiredTokens) {
  assert.ok(source.includes(token), `WorldUnlockCelebration must include ${token}`);
}

const forbiddenTokens = [
  'bg-background/80',
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

assert.ok(styles.includes('.lexia-celebration-backdrop'), 'Shared celebration backdrop material must be defined');
assert.ok(styles.includes('.high-contrast .lexia-celebration-backdrop'), 'Shared celebration backdrop must preserve high contrast override');
assert.ok(!styles.includes('backdrop-filter'), 'Shared celebration backdrop must stay free of glass blur');
assert.ok(!styles.includes('linear-gradient'), 'Shared celebration backdrop must stay free of gradients');

assert.ok(
  source.includes('confetti({'),
  'WorldUnlockCelebration must preserve authored confetti feedback',
);
assert.ok(
  source.includes('clearTimeout(t1); clearTimeout(t2);'),
  'WorldUnlockCelebration must preserve timer cleanup',
);
assert.ok(
  source.includes('event.stopPropagation();'),
  'WorldUnlockCelebration primary action must preserve click isolation',
);

console.log('Lexia M38-Y Unified Celebration Backdrop: PASS (shared semantic material, no glass/gradient, world unlock timing and motion preserved)');
