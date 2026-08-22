import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
const content = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const viewModel = await readFile(new URL('../src/hooks/useProfileViewModel.js', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileJourneyCard.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileJourneyCard from '@/components/profile/ProfileJourneyCard'",
  'const journeyInsights = buildParentJourneyInsights(allProgress)',
  'const activeExperience = getJourneyWorldExperience(journey, stats)',
  'const relicProgress = getWorldRelicProgress(stats)',
  'const missionPct = journey.total > 0 ? Math.round((journey.current / journey.total) * 100) : 0',
  '<ProfileJourneyCard',
  'activeExperience={activeExperience}',
  'journey={journey}',
  'missionPct={missionPct}',
  'journeyInsights={journeyInsights}',
  'relicProgress={relicProgress}',
]) {
  assert.ok(profile.includes(required) || content.includes(required) || viewModel.includes(required), `Profile must retain journey orchestration through ${required}`);
}

for (const forbidden of [
  "import { ArrowLeft, Compass } from 'lucide-react'",
  "import { Card, CardContent } from '@/components/ui/card'",
  '{activeExperience.chapter} · {activeExperience.title}',
  '{journey.current}/{journey.total}',
  '{relicProgress.unlocked}/{relicProgress.total}',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own journey presentation token ${forbidden}`);
}

for (const required of [
  "import { Compass } from 'lucide-react'",
  "import { Card, CardContent } from '@/components/ui/card'",
  'export default function ProfileJourneyCard({ activeExperience, journey, missionPct, journeyInsights, relicProgress })',
  'border-primary/30',
  '{activeExperience.chapter} · {activeExperience.title}',
  '{journey.title}',
  '{journey.description}',
  'style={{ width: `${missionPct}%` }}',
  '{journey.current}/{journey.total}',
  '{journeyInsights.totalMastered}/{journeyInsights.totalTargets}',
  '{journeyInsights.chaptersCompleted}/{journeyInsights.totalChapters}',
  '{relicProgress.unlocked}/{relicProgress.total}',
  'na jornada',
  'capítulos',
  'relíquias',
]) {
  assert.ok(surface.includes(required), `ProfileJourneyCard must preserve ${required}`);
}

for (const forbidden of [
  'parentInsightsEngine',
  'worldExperienceEngine',
  'buildParentJourneyInsights',
  'getJourneyWorldExperience',
  'getWorldRelicProgress',
  'bg-gradient',
  'backdrop-blur',
  'shadow-md',
  'shadow-lg',
]) {
  assert.ok(!surface.includes(forbidden), `ProfileJourneyCard must not own domain/legacy token ${forbidden}`);
}

console.log('Lexia M38-AI Profile Journey Surface: PASS (journey presentation extracted; engines and calculations remain parent-owned)');
