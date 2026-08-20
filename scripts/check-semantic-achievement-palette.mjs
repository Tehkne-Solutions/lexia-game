import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ACHIEVEMENTS } from '../src/lib/achievements.js';

const source = await readFile(new URL('../src/lib/achievements.js', import.meta.url), 'utf8');

assert.equal(ACHIEVEMENTS.length, 12, 'achievement catalog size must remain stable');
assert.deepEqual(
  ACHIEVEMENTS.map((achievement) => achievement.id),
  [
    'first_letter',
    'five_letters',
    'ten_letters',
    'all_letters',
    'streak_3',
    'streak_10',
    'stars_10',
    'stars_50',
    'stars_100',
    'accuracy_80',
    'attempts_50',
    'half_alphabet',
  ],
  'achievement ids/order must remain stable',
);

const allowedVisualTokens = ['primary', 'secondary', 'accent', 'destructive'];
for (const achievement of ACHIEVEMENTS) {
  assert.equal(typeof achievement.check, 'function', `${achievement.id}: check must remain executable`);
  assert.ok(achievement.color, `${achievement.id}: semantic tile color is required`);
  assert.ok(achievement.textColor, `${achievement.id}: semantic text color is required`);
  assert.ok(
    allowedVisualTokens.some((token) => achievement.color.includes(token)),
    `${achievement.id}: tile must use an authored semantic token`,
  );
  assert.ok(
    allowedVisualTokens.some((token) => achievement.textColor.includes(token)),
    `${achievement.id}: text must use an authored semantic token`,
  );
}

const forbiddenFamilies = [
  'green-',
  'blue-',
  'purple-',
  'yellow-',
  'red-',
  'orange-',
  'amber-',
  'violet-',
  'teal-',
  'pink-',
  'indigo-',
  'cyan-',
  'emerald-',
  'lime-',
  'rose-',
  'fuchsia-',
  'sky-',
];
for (const token of forbiddenFamilies) {
  assert.ok(!source.includes(token), `achievement palette must not include arbitrary color family ${token}`);
}

for (const required of [
  'stats.masteredCount >= 1',
  'stats.masteredCount >= 5',
  'stats.masteredCount >= 10',
  'stats.masteredCount >= 26',
  'stats.maxStreak >= 3',
  'stats.maxStreak >= 10',
  'stats.totalStars >= 10',
  'stats.totalStars >= 50',
  'stats.totalStars >= 100',
  'stats.accuracy >= 80',
  'stats.totalAttempts >= 50',
  'stats.masteredCount >= 13',
]) {
  assert.ok(source.includes(required), `achievement threshold must remain ${required}`);
}

console.log('Lexia M38-AB Semantic Achievement Palette: PASS (12 rules preserved; arbitrary color families removed)');
