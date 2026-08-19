import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, relative } from 'node:path';

const ROOT = new URL('../', import.meta.url);
const SOURCE_ROOT = new URL('../src/', import.meta.url);
const ALLOWED_VENDOR_FILE = 'src/platform/adapters/base44Adapter.js';
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
const violations = [];
const legacyFacadeConsumers = [];

for (const fileUrl of files) {
  const path = relative(ROOT.pathname, fileUrl.pathname);
  const content = await readFile(fileUrl, 'utf8');
  const importsVendor = content.includes("from '@base44/sdk'") || content.includes("from '@base44/sdk/") || content.includes('from "@base44/sdk"') || content.includes('from "@base44/sdk/');

  if (importsVendor && path !== ALLOWED_VENDOR_FILE) {
    violations.push(`${path}: imports @base44/sdk outside the Base44 adapter`);
  }

  if (content.includes('@/platform/adapters/base44Adapter') && path !== 'src/platform/index.js') {
    violations.push(`${path}: imports the concrete Base44 adapter directly`);
  }

  if (content.includes('@/api/base44Client')) {
    legacyFacadeConsumers.push(path);
  }
}

assert.deepEqual(violations, [], `Platform boundary violations:\n${violations.join('\n')}`);
assert.deepEqual(
  legacyFacadeConsumers,
  [],
  `Legacy Base44 facade imports are no longer allowed:\n${legacyFacadeConsumers.join('\n')}`
);

await import('./check-read-resilience.mjs');

console.log('Lexia platform boundary: PASS (0 legacy facade consumers; vendor SDK isolated in adapter; read resilience contract verified)');
