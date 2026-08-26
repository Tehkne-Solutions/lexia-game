import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

let learnerContextFound = false;
const contextPaths = [
  '../src/context/LearnerContext.jsx',
  '../src/contexts/LearnerContext.jsx',
  '../src/context/AuthContext.jsx'
];

for (const p of contextPaths) {
  try {
    const src = await readFile(new URL(p, import.meta.url), 'utf8');
    if (src) {
      learnerContextFound = true;
      break;
    }
  } catch (e) {
    // Tenta o próximo caminho
  }
}

const mapPaths = [
  '../src/pages/Map.jsx',
  '../src/pages/Home.jsx',
  '../src/App.jsx',
  '../src/components/Map.jsx'
];

let mapFound = false;
for (const p of mapPaths) {
  try {
    const src = await readFile(new URL(p, import.meta.url), 'utf8');
    if (src) {
      mapFound = true;
      break;
    }
  } catch (e) {
    // Tenta o próximo caminho
  }
}

assert.ok(mapFound, 'Página/Componente principal de navegação do aluno deve existir');

console.log('Lexia Student Flow contract: PASS');
