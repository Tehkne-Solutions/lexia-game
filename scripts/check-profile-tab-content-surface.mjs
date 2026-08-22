import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const tabs = await readFile(new URL('../src/components/profile/ProfileTabContent.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileTabContent from '@/components/profile/ProfileTabContent'",
  '<ProfileTabContent',
  'activeTab={activeTab}',
  'onSelectAvatar={onSelectAvatar}',
]) {
  assert.ok(profile.includes(required), `ProfileContent must delegate tab content through ${required}`);
}

for (const forbidden of [
  "import { motion, AnimatePresence } from 'framer-motion'",
  '<AnimatePresence mode="wait">',
  "import ProfileAvatarPicker from '@/components/profile/ProfileAvatarPicker'",
  "import ProfileAchievements from '@/components/profile/ProfileAchievements'",
  'tab === \'avatar\'',
  'tab === \'mascot\'',
  'tab === \'letters\'',
  'tab === \'stickers\'',
  'tab === \'badges\'',
]) {
  assert.ok(!profile.includes(forbidden), `ProfileContent must not own tab content presentation ${forbidden}`);
}

for (const required of [
  "import { motion, AnimatePresence } from 'framer-motion'",
  "import ProfileAvatarPicker from '@/components/profile/ProfileAvatarPicker'",
  "import ProfileAchievements from '@/components/profile/ProfileAchievements'",
  'export default function ProfileTabContent({',
  'activeTab === \'avatar\'',
  'activeTab === \'mascot\'',
  'activeTab === \'letters\'',
  'activeTab === \'stickers\'',
  'activeTab === \'badges\'',
  'onSelectAvatar}',
  '<AnimatePresence mode="wait">',
]) {
  assert.ok(tabs.includes(required), `ProfileTabContent must own ${required}`);
}

console.log('Lexia M38-AL Profile Tab Content Surface: PASS (animated tab content extracted; parent retains state and orchestration)');
