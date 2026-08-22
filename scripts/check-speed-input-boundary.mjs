import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeTypedAnswer } from '../src/lib/typingFeedback.js';

const speed = await readFile(new URL('../src/pages/SpeedChallenge.jsx', import.meta.url), 'utf8');

assert.equal(normalizeTypedAnswer('c-asá!', 4), 'CASA', 'speed answers must normalize to canonical letters');
assert.equal(normalizeTypedAnswer('123', 4), '', 'speed answers must reject numeric-only input');

for (const required of [
  "import { normalizeTypedAnswer } from '@/lib/typingFeedback'",
  'const answer = normalizeTypedAnswer(typed, currentItem.display.length)',
  'normalizeTypedAnswer(event.target.value, currentItem.display.length)',
  'normalizeTypedAnswer(previous + key, currentItem.display.length)',
]) {
  assert.ok(speed.includes(required), `Speed Challenge must share the typed answer boundary through ${required}`);
}

console.log('Lexia speed input boundary contract: PASS (physical and on-screen answers share canonical sanitization)');
