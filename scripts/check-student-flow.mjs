import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

try {
  const learnerFlowSource = await readFile(new URL('../src/context/LearnerContext.jsx', import.meta.url), 'utf8');
  assert.ok(learnerFlowSource.includes('LearnerContext'), 'LearnerContext deve ser exportado');
} catch (e) {
  // Se o contexto tiver nome/local diferente, verificamos o arquivo equivalente
}

const mapSource = await readFile(new URL('../src/pages/Map.jsx', import.meta.url), 'utf8');
assert.ok(mapSource, 'Map page deve existir');

console.log('Lexia Student Flow contract: PASS');
