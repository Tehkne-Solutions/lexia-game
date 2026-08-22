import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const content = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const viewModel = await readFile(new URL('../src/hooks/useProfileViewModel.js', import.meta.url), 'utf8');

for (const required of [
  "import ProfileContent from '@/components/profile/ProfileContent'",
  '<ProfileContent',
  'onTabChange={setTab}',
  'onSelectAvatar={selectAvatar}',
  "import { lexiaPlatform } from '@/platform'",
  "const { data: allProgress = [] } = useQuery({",
  'const stats = buildStats(allProgress)',
  'function selectAvatar(avatar) {',
]) {
  assert.ok(profile.includes(required) || viewModel.includes(required), `Profile must retain orchestration through ${required}`);
}

for (const forbidden of [
  'max-w-lg mx-auto p-4 space-y-4',
  '<ProfileHero',
  '<ProfileJourneyCard',
  '<ProfileStats',
  '<ProfileTabs',
  '<ProfileTabContent',
  '<ProfileAccountActions',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own content composition ${forbidden}`);
}

for (const required of [
  'export default function ProfileContent({',
  'max-w-lg mx-auto p-4 space-y-4',
  '<ProfileHero',
  '<ProfileJourneyCard',
  '<ProfileStats',
  '<ProfileTabs',
  '<ProfileTabContent',
  '<ProfileAccountActions',
  'onTabChange}',
  'onSelectAvatar}',
]) {
  assert.ok(content.includes(required), `ProfileContent must own ${required}`);
}

for (const forbidden of [
  "from '@/platform'",
  'useQuery(',
  'localStorage',
  'buildStats(',
  'buildParentJourneyInsights(',
  'getJourneyWorldExperience(',
  'getWorldRelicProgress(',
  'getEarnedAchievements(',
]) {
  assert.ok(!content.includes(forbidden), `ProfileContent must not own domain orchestration ${forbidden}`);
}

console.log('Lexia M38-AN Profile Content Surface: PASS (body composition extracted; data and callbacks remain parent-owned)');
