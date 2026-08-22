import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const content = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const tabs = await readFile(new URL('../src/components/profile/ProfileTabContent.jsx', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileAchievements.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileContent from '@/components/profile/ProfileContent'",
  'const earnedBadges = getEarnedAchievements(stats)',
  '<ProfileContent',
]) {
  assert.ok(profile.includes(required), `Profile must delegate achievements surface via ${required}`);
}

for (const required of ['<ProfileTabContent', 'earnedBadges={earnedBadges}']) {
  assert.ok(content.includes(required), `ProfileContent must delegate achievements surface through ${required}`);
}

for (const required of [
  "import ProfileAchievements from '@/components/profile/ProfileAchievements'",
  '<ProfileAchievements earnedBadges={earnedBadges} />',
  "activeTab === 'badges'",
]) {
  assert.ok(tabs.includes(required), `ProfileTabContent must preserve achievements handoff through ${required}`);
}

for (const forbidden of [
  'ACHIEVEMENTS.map',
  'a.color',
  'a.textColor',
  "import { ACHIEVEMENTS,",
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own achievement presentation token ${forbidden}`);
}

for (const required of [
  "import { ACHIEVEMENTS } from '@/lib/achievements'",
  'Insígnias · {earnedBadges.length}/{ACHIEVEMENTS.length} conquistadas',
  'ACHIEVEMENTS.map((achievement, index)',
  'earnedBadges.some((item) => item.id === achievement.id)',
  'const visual = getAchievementVisual(achievement)',
  "transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 15 }}",
  'whileHover={earned ? { scale: 1.04 } : {}}',
  "earned ? visual.tile : 'bg-muted/50 border-border opacity-50 grayscale'",
  "earned ? visual.text : 'text-muted-foreground'",
  "animate={earned ? { rotate: [0, -10, 10, 0] } : {}}",
  'transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}',
  '{achievement.emoji}',
  '{achievement.title}',
  '{achievement.description}',
]) {
  assert.ok(surface.includes(required), `ProfileAchievements must preserve ${required}`);
}

for (const forbidden of [
  'achievement.color',
  'achievement.textColor',
  'bg-gradient',
  'backdrop-blur',
  'shadow-md',
  'shadow-lg',
]) {
  assert.ok(!surface.includes(forbidden), `ProfileAchievements must not include legacy presentation token ${forbidden}`);
}

console.log('Lexia M38-AC Profile Achievements Surface: PASS (presentation extracted; earned state, motion and semantic boundary preserved)');
