import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const progress = await readFile(new URL('../src/components/game/ProgressBar.jsx', import.meta.url), 'utf8');
const hud = await readFile(new URL('../src/components/game/GameplayHud.jsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles/premium-gameplay-indicators.css', import.meta.url), 'utf8');

for (const token of [
  "import '@/styles/premium-gameplay-indicators.css'",
  'const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0',
  'lexia-progress-track',
  'style={{ width: `${pct}%` }}',
  '<Star className="w-4 h-4 text-accent fill-accent" />',
  '{stars || 0}',
  '{streak > 0 && (',
  '<Flame className="w-4 h-4 text-destructive" />',
]) {
  assert.ok(progress.includes(token), `ProgressBar M38-W invariant missing: ${token}`);
}

for (const forbidden of ['shadow-inner', 'shadow-sm', 'shadow-md', 'shadow-lg', 'bg-gradient']) {
  assert.equal(progress.includes(forbidden), false, `ProgressBar must not include legacy track chrome: ${forbidden}`);
}

for (const token of [
  '<ProgressBar current={masteredCount} total={26} streak={totalStreak} stars={totalStars} />',
  "dailyChallenge?.type === 'letters'",
  '!dailyChallenge.completed',
  'onClick={onOpenDailyChallenge}',
  'aria-label="Abrir desafio diário"',
  '<Zap className="w-4 h-4 text-accent" />',
  'bg-accent rounded-full',
  'onClick={onOpenSelector}',
  'onClick={onHome}',
  "isCurrentMissionTarget ? 'Missão atual' : 'Missão recomendada'",
  'to="/world"',
]) {
  assert.ok(hud.includes(token), `GameplayHud M38-W invariant missing: ${token}`);
}

for (const forbidden of ['text-amber-', 'bg-amber-', 'border-amber-', 'text-yellow-', 'bg-gradient']) {
  assert.equal(hud.includes(forbidden), false, `GameplayHud must not include fixed indicator utility: ${forbidden}`);
}

assert.ok(css.includes('html:not(.high-contrast) .lexia-progress-track'), 'progress material must preserve high-contrast opt-out');
assert.ok(css.includes('var(--lexia-paper-deep)'), 'progress material must use authored paper depth');

console.log('Lexia M38-W Premium Gameplay Indicators: PASS (semantic daily indicator and authored progress track; progress/stars/streak/callbacks preserved)');
