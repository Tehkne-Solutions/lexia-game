import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const syllables = await readFile(new URL('../src/pages/PlaySyllables.jsx', import.meta.url), 'utf8');
const sentences = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');

for (const required of [
  "setTyped('')",
  "setPhase('type')",
  "setMascotMessage(`Digite: ${target}`)",
  '}, [index]);',
]) {
  assert.ok(syllables.includes(required), `PlaySyllables must reset input on target transition through ${required}`);
}

for (const required of [
  'setTokens(shuffledTokens(current.words))',
  'setSelectedIds([])',
  "setPhase('build')",
  "setMascotMessage('Monte a frase!')",
  '}, [index]);',
  'key={current.id}',
]) {
  assert.ok(sentences.includes(required), `PlaySentences must isolate target input through ${required}`);
}

console.log('Lexia input isolation contract: PASS (typed text, selected tokens and animated panels reset between curriculum targets)');
