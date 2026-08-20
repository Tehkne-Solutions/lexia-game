import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const hero = await readFile(new URL('../src/components/profile/ProfileHero.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileHero from '@/components/profile/ProfileHero'",
  "const currentAvatar = getAvatarById(profile.avatarId || 'owl')",
  'const level = Math.floor(totalStars / 5) + 1',
  'const starsToNextLevel = 5 - (totalStars % 5)',
  'const dailyDone = isChallengeCompleted()',
  '<ProfileHero',
  'currentAvatar={currentAvatar}',
  'dailyDone={dailyDone}',
  'level={level}',
  'starsToNextLevel={starsToNextLevel}',
]) {
  assert.ok(profile.includes(required), `Profile must retain hero orchestration through ${required}`);
}

for (const forbidden of [
  '🏆 Desafio Diário!',
  'lexia-game-panel-reward',
  '{currentAvatar.emoji}',
  '{currentAvatar.name}',
  'Nível {level} · Corujinha Guardiã',
  '{starsToNextLevel} ⭐ p/ nível {level + 1}',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own hero presentation token ${forbidden}`);
}

for (const required of [
  'export default function ProfileHero({ currentAvatar, dailyDone, level, starsToNextLevel })',
  'lexia-game-panel-reward',
  '{currentAvatar.emoji}',
  '{currentAvatar.name}',
  '🏆 Desafio Diário!',
  'border-accent/45',
  'bg-accent/15',
  'text-accent-foreground',
  'Nível {level} · Corujinha Guardiã',
  'style={{ width: `${((5 - starsToNextLevel) / 5) * 100}%` }}',
  '{starsToNextLevel} ⭐ p/ nível {level + 1}',
]) {
  assert.ok(hero.includes(required), `ProfileHero must preserve ${required}`);
}

for (const forbidden of [
  'isChallengeCompleted',
  'getAvatarById',
  'localStorage',
  'lexiaPlatform',
  'buildStats',
  'setProfile',
  'saveProfile',
  'bg-gradient',
  'backdrop-blur',
  'shadow-md',
  'shadow-lg',
]) {
  assert.ok(!hero.includes(forbidden), `ProfileHero must not own state/domain/legacy token ${forbidden}`);
}

console.log('Lexia M38-AJ Profile Hero Surface: PASS (hero presentation extracted; avatar, level and daily calculations remain parent-owned)');
