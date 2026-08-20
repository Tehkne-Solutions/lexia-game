import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = 'src/components/game/SessionQuestComplete.jsx';
const source = await readFile(file, 'utf8');

const requiredTokens = [
  "import GamePanel from '@/components/game/GamePanel'",
  "import GameActionButton from '@/components/game/GameActionButton'",
  'tone="reward"',
  'gameVariant="primary"',
  'gameVariant="secondary"',
  'initial={{ opacity: 0, y: 24, scale: 0.96 }}',
  "transition={{ type: 'spring', stiffness: 180, damping: 18 }}",
  'quest.progress',
  'quest.goal',
  'quest.stars',
  'to="/world"',
  'onClick={onContinue}',
];

for (const token of requiredTokens) {
  assert.ok(source.includes(token), `SessionQuestComplete must include ${token}`);
}

const forbiddenTokens = [
  'backdrop-blur',
  'shadow-2xl',
  'bg-card',
  'text-amber-600',
  'bg-gradient',
];

for (const token of forbiddenTokens) {
  assert.ok(!source.includes(token), `SessionQuestComplete must not include legacy visual token ${token}`);
}

assert.ok(
  source.includes('if (!quest?.enabled || !quest.completed) return null;'),
  'SessionQuestComplete must preserve completion visibility guard',
);
assert.ok(
  source.includes('Voltar ao mapa') && source.includes('Continuar treinando'),
  'SessionQuestComplete must preserve both completion actions',
);

console.log('Lexia M38-N Premium Session Quest Complete: PASS (premium reward material, canonical actions, no blur/shadow, behavior preserved)');
