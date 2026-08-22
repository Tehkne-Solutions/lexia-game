import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const viewModel = await readFile(new URL('../src/hooks/useProfileViewModel.js', import.meta.url), 'utf8');

for (const required of [
  "import useProfileViewModel from '@/hooks/useProfileViewModel'",
  'const {',
  '} = useProfileViewModel(profile)',
  'function selectAvatar(avatar) {',
  'setProfile(updated)',
  'saveProfile(updated)',
]) {
  assert.ok(profile.includes(required), `Profile must retain orchestration through ${required}`);
}

for (const forbidden of [
  'useQuery(',
  'buildStats(',
  'buildParentJourneyInsights(',
  'getJourneyWorldExperience(',
  'getWorldRelicProgress(',
  'getEarnedAchievements(',
  'isChallengeCompleted()',
  'getAvatarById(',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own view model calculation ${forbidden}`);
}

for (const required of [
  'export default function useProfileViewModel(profile) {',
  'useQuery({',
  'buildStats(allProgress)',
  'buildParentJourneyInsights(allProgress)',
  'getJourneyWorldExperience(journey, stats)',
  'getWorldRelicProgress(stats)',
  'getEarnedAchievements(stats)',
  'isChallengeCompleted()',
  "getAvatarById(profile.avatarId || 'owl')",
  'return {',
]) {
  assert.ok(viewModel.includes(required), `useProfileViewModel must own ${required}`);
}

console.log('Lexia M38-AS Profile View Model Surface: PASS (progress query and derived data extracted; identity state remains page-owned)');
