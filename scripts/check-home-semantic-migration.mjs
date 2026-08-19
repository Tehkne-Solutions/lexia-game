import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
const actionSource = await readFile(new URL('../src/components/game/GameActionButton.jsx', import.meta.url), 'utf8');

assert.ok(source.includes("import GamePanel from '@/components/game/GamePanel'"), 'Home must use GamePanel');
assert.ok(source.includes("import GameActionButton from '@/components/game/GameActionButton'"), 'Home must use GameActionButton');
assert.ok(source.includes('<GamePanel\n            tone="paper"'), 'Adventure plan must use paper GamePanel');
assert.ok(source.includes('tone="success"'), 'Post-review status must use success GamePanel');
assert.ok(source.includes('tone="review"'), 'Due review surface must use review GamePanel');
assert.ok(source.includes('lexia-game-panel-reward'), 'Daily challenge launcher must use reward semantic surface');
assert.ok(source.includes('gameVariant="primary"'), 'Primary learner CTA must use GameActionButton primary');
assert.ok(source.includes('gameVariant="secondary"'), 'Free practice CTA must use GameActionButton secondary');
assert.ok(actionSource.includes('bg-gradient-to-r'), 'temporary legacy browser-test marker must remain in GameActionButton');
assert.ok(!source.includes('from-primary to-primary/80'), 'Home must no longer author gradient classes directly');
assert.ok(!source.includes('shadow-primary/30'), 'Home must no longer author template glow shadow directly');

console.log('Lexia M36-B Home Semantic Migration contract: PASS');
