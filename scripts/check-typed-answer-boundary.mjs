import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeTypedAnswer } from '../src/lib/typingFeedback.js';

const feedback = await readFile(new URL('../src/lib/typingFeedback.js', import.meta.url), 'utf8');
const syllables = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');

assert.equal(normalizeTypedAnswer('b-á1', 4), 'BA', 'typed answers must normalize diacritics to canonical letters');
assert.equal(normalizeTypedAnswer(' casa! ', 4), 'CASA', 'typed answers must trim through filtering and respect max length');
assert.equal(normalizeTypedAnswer('123', 4), '', 'typed answers must reject numeric-only input');
assert.equal(normalizeTypedAnswer('ABCDXYZ', 4), 'ABCD', 'typed answers must enforce the target length');

for (const required of [
  'export function normalizeTypedAnswer(value, maxLength)',
  ".normalize('NFD')",
  '.replace(/[^A-Z]/g, \'\')',
]) {
  assert.ok(feedback.includes(required), `typing feedback must own ${required}`);
}

for (const required of [
  'normalizeTypedAnswer(e.target.value, target.length)',
  'normalizeTypedAnswer(p + k, target.length)',
]) {
  assert.ok(syllables.includes(required), `PlaySyllables must sanitize physical and on-screen input through ${required}`);
}

console.log('Lexia typed answer boundary contract: PASS (diacritics normalize; symbols/numbers reject; physical and on-screen input share the boundary)');
