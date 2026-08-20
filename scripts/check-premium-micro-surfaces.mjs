import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

const letterDisplay = await readFile(`${root}src/components/game/LetterDisplay.jsx`, 'utf8');
const dailyChallenge = await readFile(`${root}src/components/game/DailyChallengeCard.jsx`, 'utf8');

assert.ok(letterDisplay.includes("import GamePanel from '@/components/game/GamePanel'"), 'LetterDisplay must use GamePanel');
assert.ok(letterDisplay.includes('tone="paper"'), 'LetterDisplay anchor must use paper material');
assert.ok(!letterDisplay.includes('backdrop-blur'), 'LetterDisplay must not use glass blur');
assert.ok(!letterDisplay.includes('drop-shadow'), 'LetterDisplay must not use drop shadow chrome');

assert.ok(dailyChallenge.includes('tone="reward"'), 'DailyChallengeCard must keep reward material');
assert.ok(dailyChallenge.includes('bg-primary'), 'Daily challenge progress must use semantic primary token');
assert.ok(dailyChallenge.includes('bg-secondary/15'), 'Completed daily targets must use semantic secondary material');
assert.ok(!dailyChallenge.includes('bg-green-'), 'Daily challenge must not use generic green backgrounds');
assert.ok(!dailyChallenge.includes('text-green-'), 'Daily challenge must not use generic green text');
assert.ok(!dailyChallenge.includes('bg-amber-'), 'Daily challenge must not use generic amber progress chrome');
assert.ok(!dailyChallenge.includes('text-amber-'), 'Daily challenge must not use generic amber text chrome');
assert.ok(!dailyChallenge.includes('backdrop-blur'), 'Daily challenge overlay must not depend on glass blur');

console.log('Lexia M38-K Premium Micro-Surfaces: PASS (semantic materials, zero legacy glass/generic state chrome)');
