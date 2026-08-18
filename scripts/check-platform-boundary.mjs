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

  if (content.includes('@/api/base44Client') && path !== 'src/api/base44Client.js') {
    legacyFacadeConsumers.push(path);
  }
}

assert.deepEqual(violations, [], `Platform boundary violations:\n${violations.join('\n')}`);

const facadeContent = await readFile(new URL('../src/api/base44Client.js', import.meta.url), 'utf8');
assert.ok(facadeContent.includes('lexiaPlatform'), 'legacy Base44 facade must delegate to lexiaPlatform');
assert.ok(!facadeContent.includes('base44Adapter.raw'), 'legacy facade must not expose the raw Base44 client');

console.log(`Lexia platform boundary: PASS (${legacyFacadeConsumers.length} legacy facade consumer(s) remain)`);
if (legacyFacadeConsumers.length > 0) {
  console.log(`Legacy facade consumers: ${legacyFacadeConsumers.sort().join(', ')}`);
}
