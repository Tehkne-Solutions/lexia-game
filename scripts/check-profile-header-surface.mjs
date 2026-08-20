import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const header = await readFile(new URL('../src/components/profile/ProfileHeader.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileHeader from '@/components/profile/ProfileHeader'",
  "import { playClickSound } from '@/lib/sounds'",
  '<ProfileHeader onBackClick={playClickSound} />',
]) {
  assert.ok(profile.includes(required), `Profile must retain header orchestration through ${required}`);
}

for (const forbidden of [
  "import { Link } from 'react-router-dom'",
  "import { ArrowLeft } from 'lucide-react'",
  "import GameActionButton from '@/components/game/GameActionButton'",
  'lexia-gameplay-hud',
  'Voltar ao início',
  'Meu Perfil',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own header presentation token ${forbidden}`);
}

for (const required of [
  "import { Link } from 'react-router-dom'",
  "import { ArrowLeft } from 'lucide-react'",
  "import GameActionButton from '@/components/game/GameActionButton'",
  'export default function ProfileHeader({ onBackClick })',
  'lexia-gameplay-hud border-b border-border p-4 pt-[env(safe-area-inset-top)] sticky top-0 z-10',
  '<Link to="/">',
  'gameVariant="neutral"',
  'variant="ghost"',
  'size="icon"',
  'className="lexia-hud-icon rounded-xl"',
  'onClick={onBackClick}',
  'aria-label="Voltar ao início"',
  '<ArrowLeft className="w-5 h-5" />',
  'Meu Perfil',
]) {
  assert.ok(header.includes(required), `ProfileHeader must preserve ${required}`);
}

for (const forbidden of [
  'playClickSound',
  'localStorage',
  'lexiaPlatform',
  'setProfile',
  'saveProfile',
  'bg-gradient',
  'backdrop-blur',
  'shadow-md',
  'shadow-lg',
]) {
  assert.ok(!header.includes(forbidden), `ProfileHeader must not own state/domain/legacy token ${forbidden}`);
}

console.log('Lexia M38-AK Profile Header Surface: PASS (sticky HUD extracted; navigation presentation preserved and click sound remains parent-owned)');
