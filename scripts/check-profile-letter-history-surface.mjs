import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const tabs = await readFile(new URL('../src/components/profile/ProfileTabContent.jsx', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileLetterHistory.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileTabContent from '@/components/profile/ProfileTabContent'",
  '<ProfileTabContent',
]) {
  assert.ok(profile.includes(required), `Profile must delegate letter history through ${required}`);
}

for (const required of [
  "import ProfileLetterHistory from '@/components/profile/ProfileLetterHistory'",
  '<ProfileLetterHistory progressMap={progressMap} stats={stats} />',
  "activeTab === 'letters'",
]) {
  assert.ok(tabs.includes(required), `ProfileTabContent must preserve letter history handoff through ${required}`);
}

for (const forbidden of [
  "import { ALPHABET } from '@/lib/alphabetData'",
  "import { calculateMastery } from '@/lib/fsrs'",
  'ALPHABET.map',
  'mastery >= 80',
  'mastery >= 40',
  "status = 'started'",
  'Precisão deste capítulo:',
]) {
  assert.ok(!profile.includes(forbidden), `Profile must not own letter-history token ${forbidden}`);
}

for (const required of [
  "import { ALPHABET } from '@/lib/alphabetData'",
  "import { calculateMastery } from '@/lib/fsrs'",
  'export default function ProfileLetterHistory({ progressMap = {}, stats })',
  'Histórico de Letras · {stats.masteredCount}/26 dominadas',
  'Precisão deste capítulo: {stats.letterAccuracy}% · {stats.letterAttempts} tentativas',
  'grid grid-cols-4 sm:grid-cols-6 gap-2',
  'ALPHABET.map((item)',
  'const mastery = progress ? calculateMastery(progress) : 0',
  'const attempts = progress?.total_attempts || 0',
  "if (mastery >= 80) status = 'mastered'",
  "else if (mastery >= 40) status = 'learning'",
  "else if (attempts > 0) status = 'started'",
  "mastered: 'bg-secondary text-white border-secondary'",
  "learning: 'bg-accent/80 text-accent-foreground border-accent'",
  "started: 'bg-primary/20 text-primary border-primary/30'",
  "new: 'bg-muted text-muted-foreground border-border'",
  'whileHover={{ scale: 1.05 }}',
  "status === 'mastered'",
  "status !== 'mastered'",
  "{ color: 'bg-secondary', label: 'Dominada' }",
  "{ color: 'bg-accent/80', label: 'Aprendendo' }",
  "{ color: 'bg-primary/20', label: 'Iniciada' }",
  "{ color: 'bg-muted', label: 'Nova' }",
]) {
  assert.ok(surface.includes(required), `ProfileLetterHistory must preserve ${required}`);
}

for (const forbidden of ['bg-gradient', 'backdrop-blur', 'shadow-md', 'shadow-lg']) {
  assert.ok(!surface.includes(forbidden), `ProfileLetterHistory must not include legacy visual token ${forbidden}`);
}

console.log('Lexia M38-AE Profile Letter History Surface: PASS (mastery thresholds, statuses, grid and legend preserved outside Profile monolith)');
