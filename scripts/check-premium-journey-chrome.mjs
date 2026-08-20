import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const narrative = await readFile('src/components/game/WorldNarrativePanel.jsx', 'utf8');
const questBar = await readFile('src/components/game/SessionQuestBar.jsx', 'utf8');
const relicBadge = await readFile('src/components/game/WorldRelicBadge.jsx', 'utf8');
const questComplete = await readFile('src/components/game/SessionQuestComplete.jsx', 'utf8');
const premiumCss = await readFile('src/styles/premium-game.css', 'utf8');

for (const token of [
  "import GamePanel from '@/components/game/GamePanel'",
  'tone="paper"',
  'rounded-3xl',
  'experience.chapter',
  'experience.title',
  'experience.briefing',
  'journey.title',
  'experience.relic.name',
  'text-accent',
]) {
  assert.ok(narrative.includes(token), `WorldNarrativePanel must include ${token}`);
}
for (const token of ['bg-card', 'shadow-sm', 'text-amber-600', 'bg-gradient']) {
  assert.ok(!narrative.includes(token), `WorldNarrativePanel must not include legacy visual token ${token}`);
}

assert.ok(
  questBar.split('lexia-gameplay-context').length - 1 >= 2,
  'SessionQuestBar must use semantic gameplay context material for review and expedition states',
);
for (const token of [
  'isLearnerReviewRuntime()',
  'buildLearnerReviewQuest(reviewProgress)',
  'getLearnerReviewRemaining()',
  'getSessionQuestPercent(quest)',
  'reviewRemaining',
  'quest.progress',
  'quest.goal',
  'quest.stars',
  'style={{ width: `${percent}%` }}',
  'text-accent',
]) {
  assert.ok(questBar.includes(token), `SessionQuestBar must preserve ${token}`);
}
for (const token of [
  'border-sky-',
  'bg-sky-',
  'text-sky-',
  'text-amber-600',
  'bg-card/80',
  'bg-gradient',
]) {
  assert.ok(!questBar.includes(token), `SessionQuestBar must not include legacy visual token ${token}`);
}

assert.ok(relicBadge.includes('text-accent'), 'WorldRelicBadge unlocked relic must use authored accent token');
assert.ok(!relicBadge.includes('text-amber-'), 'WorldRelicBadge must not use generic amber utility');
assert.ok(relicBadge.includes('experience.relicUnlocked'), 'WorldRelicBadge must preserve unlock state');
assert.ok(relicBadge.includes('experience.relic.name'), 'WorldRelicBadge must preserve relic name');

assert.ok(questComplete.includes('tone="reward"'), 'SessionQuestComplete must retain reward material');
assert.ok(questComplete.includes('rounded-3xl'), 'SessionQuestComplete must preserve rounded completion geometry');
assert.ok(questComplete.includes('onClick={onContinue}'), 'SessionQuestComplete must preserve continue callback');

assert.ok(
  premiumCss.includes('.lexia-gameplay-context'),
  'Premium stylesheet must define semantic gameplay context material',
);

console.log('Lexia M38-O Premium Journey Chrome: PASS (semantic journey materials, authored accent, review/quest behavior and completion geometry preserved)');
