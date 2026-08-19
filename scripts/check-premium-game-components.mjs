import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const panel = await readFile(new URL('../src/components/game/GamePanel.jsx', import.meta.url), 'utf8');
const action = await readFile(new URL('../src/components/game/GameActionButton.jsx', import.meta.url), 'utf8');
const daily = await readFile(new URL('../src/components/game/DailyChallengeCard.jsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles/premium-game.css', import.meta.url), 'utf8');

assert.ok(panel.includes('lexia-game-panel'), 'GamePanel must expose the semantic premium panel class');
assert.ok(panel.includes("review: 'lexia-game-panel lexia-game-panel-review'"), 'GamePanel must expose review tone');
assert.ok(panel.includes("reward: 'lexia-game-panel lexia-game-panel-reward'"), 'GamePanel must expose reward tone');
assert.ok(panel.includes("success: 'lexia-game-panel lexia-game-panel-success'"), 'GamePanel must expose success tone');

assert.ok(action.includes('lexia-primary-action'), 'GameActionButton must expose semantic primary action');
assert.ok(action.includes('lexia-secondary-action'), 'GameActionButton must expose semantic secondary action');
assert.ok(action.includes('lexia-neutral-action'), 'GameActionButton must expose semantic neutral action');

assert.ok(daily.includes("import GamePanel from '@/components/game/GamePanel'"), 'DailyChallengeCard must consume GamePanel');
assert.ok(daily.includes("import GameActionButton from '@/components/game/GameActionButton'"), 'DailyChallengeCard must consume GameActionButton');
assert.ok(daily.includes('tone="reward"'), 'Daily challenge modal must use reward material tone');
assert.ok(!daily.includes("import { Button } from '@/components/ui/button'"), 'Daily challenge modal must no longer depend directly on generic Button');

for (const selector of ['.lexia-game-panel', '.lexia-primary-action', '.lexia-secondary-action', '.lexia-neutral-action']) {
  assert.ok(css.includes(selector), `premium stylesheet must define ${selector}`);
}
assert.ok(css.includes('background-image: none !important'), 'primary semantic action must remain gradient-free');
assert.ok(css.includes(':root:not(.high-contrast)'), 'semantic premium components must remain opt-out under high contrast');

console.log('Lexia M36-A Premium Game Components contract: PASS');
