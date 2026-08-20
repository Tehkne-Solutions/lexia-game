import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const hero = await readFile(new URL('../src/components/profile/ProfileHero.jsx', import.meta.url), 'utf8');
const picker = await readFile(new URL('../src/components/profile/ProfileAvatarPicker.jsx', import.meta.url), 'utf8');

for (const token of [
  "const dailyDone = isChallengeCompleted()",
  "const currentAvatar = getAvatarById(profile.avatarId || 'owl')",
  'const level = Math.floor(totalStars / 5) + 1',
  'const starsToNextLevel = 5 - (totalStars % 5)',
  'if (avatar.unlockStars > totalStars) return',
  'playClickSound()',
  "localStorage.setItem(PROFILE_KEY, JSON.stringify(data))",
  '<ProfileHero',
  'currentAvatar={currentAvatar}',
  'dailyDone={dailyDone}',
  'level={level}',
  'starsToNextLevel={starsToNextLevel}',
  '<ProfileAvatarPicker profile={profile} totalStars={totalStars} onSelect={selectAvatar} />',
]) {
  assert.ok(profile.includes(token), `Profile hero/avatar behavior must include ${token}`);
}

for (const token of [
  '🏆 Desafio Diário!',
  'border-accent/45',
  'bg-accent/15',
  'text-accent-foreground',
  'lexia-game-panel-reward',
  '{currentAvatar.emoji}',
  '{currentAvatar.name}',
  'Nível {level} · Corujinha Guardiã',
  '{starsToNextLevel} ⭐ p/ nível {level + 1}',
]) {
  assert.ok(hero.includes(token), `Profile hero must include ${token}`);
}

for (const token of [
  "const selected = profile.avatarId === avatar.id || (!profile.avatarId && avatar.id === 'owl')",
  "selected ? 'border-primary bg-primary/10 ring-1 ring-primary/25'",
  "locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'",
  'whileTap={!locked ? { scale: 0.9 } : {}}',
  'onClick={() => onSelect(avatar)}',
  'Escolha seu Avatar',
  '🔒 {avatar.unlockStars}⭐',
  '{selected && <span className="text-xs text-primary">✓</span>}',
]) {
  assert.ok(picker.includes(token), `Profile avatar picker must include ${token}`);
}

for (const [label, source] of [['Profile', profile], ['ProfileHero', hero], ['ProfileAvatarPicker', picker]]) {
  for (const token of [
    'bg-amber-',
    'border-amber-',
    'text-amber-',
    'shadow-md',
    'bg-gradient',
    'backdrop-blur',
  ]) {
    assert.ok(!source.includes(token), `${label} must not include legacy visual token ${token}`);
  }
}

for (const token of ['🏆 Desafio Diário!', 'lexia-game-panel-reward', '{currentAvatar.emoji}', '{currentAvatar.name}']) {
  assert.ok(!profile.includes(token), `Profile must delegate hero presentation token ${token}`);
}

console.log('Lexia M38-AA Premium Profile Hero & Avatar: PASS (extracted semantic hero, flat avatar picker, unlock and persistence preserved)');
