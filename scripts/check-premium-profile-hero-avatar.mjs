import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');

const requiredTokens = [
  "const dailyDone = isChallengeCompleted()",
  '🏆 Desafio Diário!',
  'border-accent/45',
  'bg-accent/15',
  'text-accent-foreground',
  "const selected = profile.avatarId === av.id || (!profile.avatarId && av.id === 'owl')",
  "selected ? 'border-primary bg-primary/10 ring-1 ring-primary/25'",
  "locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'",
  'whileTap={!locked ? { scale: 0.9 } : {}}',
  'onClick={() => selectAvatar(av)}',
  'if (avatar.unlockStars > totalStars) return',
  'playClickSound()',
  "localStorage.setItem(PROFILE_KEY, JSON.stringify(data))",
];

for (const token of requiredTokens) {
  assert.ok(source.includes(token), `Profile hero/avatar must include ${token}`);
}

const forbiddenTokens = [
  'bg-amber-',
  'border-amber-',
  'text-amber-',
  'shadow-md',
  'bg-gradient',
  'backdrop-blur',
];

for (const token of forbiddenTokens) {
  assert.ok(!source.includes(token), `Profile hero/avatar must not include legacy visual token ${token}`);
}

assert.ok(source.includes('lexia-game-panel-reward'), 'Profile hero must preserve authored reward panel');
assert.ok(source.includes('Escolha seu Avatar'), 'Avatar selector must remain learner-facing');
assert.ok(source.includes('🔒 {av.unlockStars}⭐'), 'Avatar unlock requirement must remain visible');
assert.ok(source.includes("{selected && <span className=\"text-xs text-primary\">✓</span>}"), 'Selected avatar marker must remain visible');

console.log('Lexia M38-AA Premium Profile Hero & Avatar: PASS (semantic daily badge, flat selected avatar, unlock and persistence preserved)');
