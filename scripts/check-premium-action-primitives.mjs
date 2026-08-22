import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

const learnerPages = [
  'src/pages/Welcome.jsx',
  'src/pages/WorldMap.jsx',
  'src/pages/Profile.jsx',
  'src/pages/PracticeHub.jsx',
  'src/pages/PlayGame.jsx',
  'src/pages/PlaySyllables.jsx',
  'src/pages/PlaySentences.jsx',
  'src/pages/SpeedChallenge.jsx',
  'src/pages/StoryMode.jsx',
];

const sharedRoots = ['src/components/game'];
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const allowedRawButtonFiles = new Set([
  'src/components/game/GameActionButton.jsx',
]);

async function collectFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const info = await stat(absolutePath);
  if (info.isFile()) return extensions.has(path.extname(relativePath)) ? [relativePath] : [];
  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => collectFiles(path.join(relativePath, entry.name))));
  return nested.flat();
}

function lineNumberAt(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

const files = [
  ...learnerPages,
  ...(await Promise.all(sharedRoots.map(collectFiles))).flat(),
];
const uniqueFiles = [...new Set(files.map((file) => file.replaceAll(path.sep, '/')))].sort();
const violations = [];

const rawButtonImport = /from\s+['"]@\/components\/ui\/button['"]/g;
const rawButtonRequire = /require\(\s*['"]@\/components\/ui\/button['"]\s*\)/g;

for (const relativePath of uniqueFiles) {
  if (allowedRawButtonFiles.has(relativePath)) continue;
  const content = await readFile(path.join(root, relativePath), 'utf8');
  for (const pattern of [rawButtonImport, rawButtonRequire]) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      violations.push({
        file: relativePath,
        line: lineNumberAt(content, match.index || 0),
        token: match[0],
      });
    }
  }
}

if (violations.length > 0) {
  console.error('Lexia M38-F Premium Action Primitive Audit: FAIL');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} — raw UI Button dependency: ${violation.token}`);
  }
}

assert.equal(
  violations.length,
  0,
  `learner-facing gameplay must use GameActionButton instead of raw UI Button (${violations.length} violation${violations.length === 1 ? '' : 's'})`,
);

console.log(`Lexia M38-F Premium Action Primitive Audit: PASS (${uniqueFiles.length} learner/shared files scanned; raw UI Button allowed only inside GameActionButton)`);
