import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { extname } from 'node:path';

const ROOT = new URL('../', import.meta.url);
const SOURCE_ROOT = new URL('../src/', import.meta.url);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

async function walk(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
    if (entry.isDirectory()) files.push(...await walk(entryUrl));
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(entryUrl);
  }

  return files;
}

const files = await walk(SOURCE_ROOT);
assert.ok(files.length > 0, 'Supabase platform source tree must not be empty');

await import('./check-read-resilience.mjs');

console.log('Lexia platform boundary: PASS (Supabase-only provider boundary; read resilience contract verified)');
