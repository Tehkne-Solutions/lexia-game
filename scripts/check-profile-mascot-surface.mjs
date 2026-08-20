import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileMascotCustomizer.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileMascotCustomizer from '@/components/profile/ProfileMascotCustomizer'",
  '<ProfileMascotCustomizer totalStars={totalStars} />',
  "tab === 'mascot'",
]) {
  assert.ok(profile.includes(required), `Profile must delegate mascot surface through ${required}`);
}

for (const forbidden of [
  "import MascotCustomizer from '@/components/game/MascotCustomizer'",
  'Personalize sua Corujinha',
  '<MascotCustomizer totalStars={totalStars} />',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own mascot presentation token ${forbidden}`);
}

for (const required of [
  "import MascotCustomizer from '@/components/game/MascotCustomizer'",
  'export default function ProfileMascotCustomizer({ totalStars = 0 })',
  'Personalize sua Corujinha',
  '<MascotCustomizer totalStars={totalStars} />',
  '<Card>',
  '<CardContent>',
]) {
  assert.ok(surface.includes(required), `ProfileMascotCustomizer must preserve ${required}`);
}

for (const forbidden of ['bg-gradient', 'backdrop-blur', 'shadow-md', 'shadow-lg']) {
  assert.ok(!surface.includes(forbidden), `ProfileMascotCustomizer must not include legacy visual token ${forbidden}`);
}

console.log('Lexia M38-AG Profile Mascot Surface: PASS (mascot card extracted; totalStars handoff and customizer preserved)');
