import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [profile, stats, tabs] = await Promise.all([
  readFile('src/pages/Profile.jsx', 'utf8'),
  readFile('src/components/profile/ProfileStats.jsx', 'utf8'),
  readFile('src/components/profile/ProfileTabs.jsx', 'utf8'),
]);

for (const token of [
  "import ProfileStats from '@/components/profile/ProfileStats'",
  "import ProfileTabs from '@/components/profile/ProfileTabs'",
  '<ProfileStats',
  'journeyMastered={journeyInsights.totalMastered}',
  'journeyTotal={journeyInsights.totalTargets}',
  'maxStreak={stats.maxStreak}',
  'accuracy={stats.accuracy}',
  '<ProfileTabs activeTab={tab} onChange={setTab} />',
]) {
  assert.ok(profile.includes(token), `Profile must include ${token}`);
}

for (const token of [
  "text-yellow-500",
  "text-purple-500",
  "text-red-500",
  "text-green-500",
]) {
  assert.ok(!profile.includes(token), `Profile must not keep legacy stat token ${token}`);
}

for (const token of [
  "label: 'Estrelas'",
  "label: 'Jornada'",
  "label: 'Sequência'",
  "label: 'Precisão'",
  "iconClass: 'text-accent fill-accent'",
  "iconClass: 'text-primary'",
  "iconClass: 'text-destructive'",
  "iconClass: 'text-secondary'",
  'lexia-profile-stats',
  'aria-label="Resumo do perfil"',
]) {
  assert.ok(stats.includes(token), `ProfileStats must include ${token}`);
}

for (const token of [
  "{ id: 'avatar', label: '🐾 Avatar' }",
  "{ id: 'mascot', label: '🎨 Corujinha' }",
  "{ id: 'letters', label: '🔤 Letras' }",
  "{ id: 'stickers', label: '🏆 Adesivos' }",
  "{ id: 'badges', label: '🏅 Insígnias' }",
  'playClickSound();',
  'onChange(id);',
  'role="tablist"',
  'role="tab"',
  'aria-selected={active}',
  'aria-pressed={active}',
  'variant="ghost"',
  "gameVariant={active ? 'primary' : 'neutral'}",
  'lexia-profile-tabs',
]) {
  assert.ok(tabs.includes(token), `ProfileTabs must include ${token}`);
}

for (const token of ['shadow-sm', 'shadow-md', 'shadow-lg', '<button']) {
  assert.ok(!tabs.includes(token), `ProfileTabs must not include legacy action token ${token}`);
}

console.log('Lexia M38-Z Premium Profile Navigation & Stats: PASS (semantic stats, canonical tabs, labels/sound/accessibility preserved)');
