import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const retiredPaths = [
  'src/migration/progressSnapshot.js',
  'src/migration/ownershipReconciliation.js',
  'scripts/check-progress-migration.mjs',
  'scripts/check-ownership-reconciliation.mjs',
];

for (const retiredPath of retiredPaths) {
  await assert.rejects(access(new URL(`../${retiredPath}`, import.meta.url)), undefined, `${retiredPath} must remain retired`);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const sourceRoot = new URL('../src/', import.meta.url);
const sourceFiles = (await walk(sourceRoot)).filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));
for (const file of sourceFiles) {
  const content = await readFile(file, 'utf8');
  assert.equal(content.includes('/migration/'), false, `${file} must not depend on retired migration runtime`);
  assert.equal(content.includes('progressSnapshot'), false, `${file} must not depend on progress snapshots`);
  assert.equal(content.includes('ownershipReconciliation'), false, `${file} must not depend on ownership reconciliation`);
}

const policy = await readFile(new URL('../docs/FRESH-START-M06.md', import.meta.url), 'utf8');
assert.ok(policy.includes('0 Supabase Auth users'));
assert.ok(policy.includes('0 rows in `public.lexia_progress`'));
assert.ok(policy.includes('No Base44 or previous Supabase user/progress history will be migrated'));
assert.ok(policy.includes('No legacy user ownership decision'));

console.log('Lexia Fresh Start M06 contract: PASS (legacy migration runtime retired, clean-start policy enforced)');
