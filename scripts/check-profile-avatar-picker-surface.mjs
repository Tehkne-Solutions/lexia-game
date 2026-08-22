import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const content = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const tabs = await readFile(new URL('../src/components/profile/ProfileTabContent.jsx', import.meta.url), 'utf8');
const viewModel = await readFile(new URL('../src/hooks/useProfileViewModel.js', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileAvatarPicker.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileContent from '@/components/profile/ProfileContent'",
  '<ProfileContent',
  'function selectAvatar(avatar)',
  'if (avatar.unlockStars > totalStars) return',
  'playClickSound()',
  'const updated = { ...profile, avatarId: avatar.id }',
  'setProfile(updated)',
  'saveProfile(updated)',
  "const PROFILE_KEY = 'lexia_profile'",
  'localStorage.setItem(PROFILE_KEY, JSON.stringify(data))',
]) {
  assert.ok(profile.includes(required) || viewModel.includes(required), `Profile must retain avatar orchestration through ${required}`);
}

for (const required of [
  '<ProfileTabContent',
  'profile={profile}',
  'totalStars={totalStars}',
  'onSelectAvatar={onSelectAvatar}',
]) {
  assert.ok(content.includes(required), `ProfileContent must delegate avatar surface through ${required}`);
}

for (const required of [
  "import ProfileAvatarPicker from '@/components/profile/ProfileAvatarPicker'",
  '<ProfileAvatarPicker profile={profile} totalStars={totalStars} onSelect={onSelectAvatar} />',
  "activeTab === 'avatar'",
]) {
  assert.ok(tabs.includes(required), `ProfileTabContent must preserve avatar handoff through ${required}`);
}

for (const forbidden of [
  "import { AVATARS,",
  'AVATARS.map',
  'whileTap={!locked ? { scale: 0.9 } : {}}',
  'ring-primary/25',
  'cursor-not-allowed',
  'Você tem {totalStars} ⭐',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own avatar-picker presentation token ${forbidden}`);
}

for (const required of [
  "import { AVATARS } from '@/lib/avatars'",
  'export default function ProfileAvatarPicker({ profile = {}, totalStars = 0, onSelect })',
  'Escolha seu Avatar',
  'grid grid-cols-4 gap-3',
  'AVATARS.map((avatar)',
  'const locked = avatar.unlockStars > totalStars',
  "const selected = profile.avatarId === avatar.id || (!profile.avatarId && avatar.id === 'owl')",
  'whileTap={!locked ? { scale: 0.9 } : {}}',
  'onClick={() => onSelect(avatar)}',
  "selected ? 'border-primary bg-primary/10 ring-1 ring-primary/25' : 'border-border bg-muted/30'",
  "locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'",
  '🔒 {avatar.unlockStars}⭐',
  '{selected && <span className="text-xs text-primary">✓</span>}',
  'Você tem {totalStars} ⭐ — ganhe mais para desbloquear avatares!',
]) {
  assert.ok(surface.includes(required), `ProfileAvatarPicker must preserve ${required}`);
}

for (const forbidden of [
  'playClickSound',
  'localStorage',
  'setProfile',
  'saveProfile',
  'bg-gradient',
  'backdrop-blur',
  'shadow-md',
  'shadow-lg',
]) {
  assert.ok(!surface.includes(forbidden), `ProfileAvatarPicker must not own behavior/legacy token ${forbidden}`);
}

console.log('Lexia M38-AF Profile Avatar Picker Surface: PASS (picker presentation extracted; unlock guard, sound and persistence remain parent-owned)');
