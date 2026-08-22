import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const tabs = await readFile(new URL('../src/components/profile/ProfileTabContent.jsx', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileStickerAlbum.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileTabContent from '@/components/profile/ProfileTabContent'",
  '<ProfileTabContent',
]) {
  assert.ok(profile.includes(required), `Profile must delegate sticker album surface through ${required}`);
}

for (const required of [
  "import ProfileStickerAlbum from '@/components/profile/ProfileStickerAlbum'",
  '<ProfileStickerAlbum allProgress={allProgress} stats={stats} />',
  "activeTab === 'stickers'",
]) {
  assert.ok(tabs.includes(required), `ProfileTabContent must preserve sticker album handoff through ${required}`);
}

for (const forbidden of [
  "import StickerAlbum from '@/components/game/StickerAlbum'",
  'Álbum de Adesivos',
  '<StickerAlbum allProgress={allProgress} stats={stats} />',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own sticker album presentation token ${forbidden}`);
}

for (const required of [
  "import StickerAlbum from '@/components/game/StickerAlbum'",
  'export default function ProfileStickerAlbum({ allProgress = [], stats })',
  'Álbum de Adesivos',
  '<StickerAlbum allProgress={allProgress} stats={stats} />',
  '<Card>',
  '<CardContent>',
]) {
  assert.ok(surface.includes(required), `ProfileStickerAlbum must preserve ${required}`);
}

for (const forbidden of ['bg-gradient', 'backdrop-blur', 'shadow-md', 'shadow-lg']) {
  assert.ok(!surface.includes(forbidden), `ProfileStickerAlbum must not include legacy visual token ${forbidden}`);
}

console.log('Lexia M38-AH Profile Sticker Album Surface: PASS (album card extracted; allProgress/stats handoff and StickerAlbum preserved)');
