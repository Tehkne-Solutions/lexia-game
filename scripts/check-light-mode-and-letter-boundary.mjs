import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const learning = await readFile(new URL('../src/learning/engine.js', import.meta.url), 'utf8');
const playGame = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');

assert.ok(app.includes('defaultTheme="light"'), 'App must start in light mode');
assert.ok(!app.includes('enableSystem'), 'App must not let OS preference override the initial light mode');
assert.ok(learning.includes("unlockedAlphabet.find((item) => item.letter !== currentLetter)"), 'next letter fallback must avoid repeating the current letter when alternatives exist');
assert.ok(playGame.includes('The child was asked to write the UPPERCASE letter "${currentLetter}"'), 'AI evaluation must use one explicit current uppercase letter target');
assert.ok(playGame.includes('requestedDailyLetter = ALPHABET.some'), 'daily targets must be limited to canonical alphabet letters');
assert.ok(playGame.includes('requestedReviewLetter = ALPHABET.some'), 'review targets must be limited to canonical alphabet letters');

console.log('Lexia light mode and letter boundary contract: PASS (light first mode; canonical single-letter targets; no unnecessary next-letter repeat)');
