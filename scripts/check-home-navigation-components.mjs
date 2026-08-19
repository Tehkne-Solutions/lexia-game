import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');

assert.ok(!source.includes("from '@/components/ui/button'"), 'Home must not import the generic Button primitive directly');
assert.ok(source.includes("import GameActionButton from '@/components/game/GameActionButton'"), 'Home must use GameActionButton');

for (const label of ['Mapa', 'Perfil', 'Pais', 'Desafio', 'História', 'Acessar']) {
  assert.ok(source.includes(label), `Home navigation must preserve ${label}`);
}

const neutralActions = source.match(/gameVariant="neutral"/g) || [];
assert.ok(neutralActions.length >= 7, 'Home must route review and navigation actions through neutral GameActionButton variants');
assert.ok(source.includes('gameVariant="primary"'), 'Home must preserve the primary action variant');
assert.ok(source.includes('gameVariant="secondary"'), 'Home must preserve the secondary practice action variant');

console.log('Lexia M36-C Home Navigation Components contract: PASS');
