import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ai = await readFile('src/components/game/AiResultBadge.jsx', 'utf8');
const achievement = await readFile('src/components/game/AchievementToast.jsx', 'utf8');

for (const [name, source] of [['AiResultBadge', ai], ['AchievementToast', achievement]]) {
  assert.ok(source.includes('GamePanel'), `${name} must use GamePanel`);
  assert.ok(!source.includes('bg-gradient'), `${name} must not use gradient utilities`);
  assert.ok(!source.includes('blur-2xl'), `${name} must not use glow blur`);
}

for (const token of ['tone={cfg.tone}', "tone: 'review'", "tone: 'success'", "tone: 'reward'"]) {
  assert.ok(ai.includes(token), `AiResultBadge must preserve semantic feedback material ${token}`);
}
for (const token of ['bg-purple-', 'border-purple-', 'text-purple-']) {
  assert.ok(!ai.includes(token), `AiResultBadge must not use legacy purple token ${token}`);
}
assert.ok(ai.includes('recognizedAs') && ai.includes('targetLetter'), 'AI feedback must preserve recognition context');
assert.ok(ai.includes('animate={{ width: `${pct}%` }}'), 'AI feedback must preserve animated precision bar');

assert.ok(achievement.includes('tone="reward"'), 'AchievementToast must use reward material');
assert.ok(achievement.includes('setTimeout(onDismiss, 4000)'), 'AchievementToast must preserve auto-dismiss timing');
assert.ok(achievement.includes('onClick={onDismiss}'), 'AchievementToast must preserve click dismiss');
assert.ok(!achievement.includes('achievement.color'), 'AchievementToast must not depend on legacy dynamic color payload');
assert.ok(!achievement.includes('achievement.textColor'), 'AchievementToast must not depend on legacy dynamic text color payload');
assert.ok(achievement.includes('aria-live="polite"'), 'AchievementToast must remain assistive-tech friendly');

console.log('Lexia M38-I Premium Feedback Surfaces: PASS (semantic GamePanel materials, no legacy purple/dynamic chrome, feedback behavior preserved)');
