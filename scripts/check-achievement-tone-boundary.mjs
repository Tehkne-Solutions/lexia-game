import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ACHIEVEMENTS } from '../src/lib/achievements.js';

const catalog = await readFile(new URL('../src/lib/achievements.js', import.meta.url), 'utf8');
const surface = await readFile(new URL('../src/components/profile/ProfileAchievements.jsx', import.meta.url), 'utf8');

const expectedBoundary = [
  ['first_letter', 'secondary', 'standard'],
  ['five_letters', 'primary', 'soft'],
  ['ten_letters', 'accent', 'standard'],
  ['all_letters', 'accent', 'strong'],
  ['streak_3', 'destructive', 'standard'],
  ['streak_10', 'primary', 'standard'],
  ['stars_10', 'accent', 'standard'],
  ['stars_50', 'accent', 'strong'],
  ['stars_100', 'primary', 'strong'],
  ['accuracy_80', 'secondary', 'standard'],
  ['attempts_50', 'primary', 'soft'],
  ['half_alphabet', 'secondary', 'standard'],
];

assert.deepEqual(
  ACHIEVEMENTS.map(({ id, tone, intensity }) => [id, tone, intensity]),
  expectedBoundary,
  'achievement tone/intensity semantics must remain stable',
);

for (const achievement of ACHIEVEMENTS) {
  assert.ok(achievement.color && achievement.textColor, `${achievement.id}: compatibility visual fields must remain during migration`);
  assert.equal(typeof achievement.check, 'function', `${achievement.id}: achievement rule must remain executable`);
}

for (const required of [
  'const achievementToneClasses = {',
  "soft: { tile: 'bg-primary/10 border-primary/30', text: 'text-primary' }",
  "standard: { tile: 'bg-primary/10 border-primary/35', text: 'text-primary' }",
  "strong: { tile: 'bg-primary/15 border-primary/45', text: 'text-primary' }",
  "standard: { tile: 'bg-secondary/10 border-secondary/35', text: 'text-secondary' }",
  "standard: { tile: 'bg-accent/15 border-accent/40', text: 'text-accent-foreground' }",
  "strong: { tile: 'bg-accent/20 border-accent/55', text: 'text-accent-foreground' }",
  "standard: { tile: 'bg-destructive/10 border-destructive/35', text: 'text-destructive' }",
  'achievementToneClasses[achievement.tone]?.[achievement.intensity]',
  'achievementToneClasses.primary.standard',
]) {
  assert.ok(surface.includes(required), `ProfileAchievements tone boundary missing ${required}`);
}

for (const forbidden of ['achievement.color', 'achievement.textColor']) {
  assert.ok(!surface.includes(forbidden), `ProfileAchievements must not consume compatibility field ${forbidden}`);
}

for (const required of ["tone: 'primary'", "tone: 'secondary'", "tone: 'accent'", "tone: 'destructive'", "intensity: 'soft'", "intensity: 'standard'", "intensity: 'strong'"]) {
  assert.ok(catalog.includes(required), `achievement catalog must expose semantic boundary ${required}`);
}

console.log('Lexia M38-AD Achievement Tone Boundary: PASS (Profile consumes tone/intensity; legacy class fields retained only for compatibility)');
