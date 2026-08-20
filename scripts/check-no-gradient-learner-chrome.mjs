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

const sharedRoots = [
  'src/components/game',
];

const sharedFiles = [
  'src/styles/premium-game.css',
];

const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);
const forbidden = [
  { label: 'Tailwind gradient utility', pattern: /\bbg-gradient(?:-[a-z0-9-]+)?\b/gi },
  { label: 'CSS linear-gradient', pattern: /\blinear-gradient\s*\(/gi },
  { label: 'CSS radial-gradient', pattern: /\bradial-gradient\s*\(/gi },
  { label: 'CSS conic-gradient', pattern: /\bconic-gradient\s*\(/gi },
];

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
  ...sharedFiles,
  ...(await Promise.all(sharedRoots.map(collectFiles))).flat(),
];

const uniqueFiles = [...new Set(files)].sort();
const violations = [];

for (const relativePath of uniqueFiles) {
  const content = await readFile(path.join(root, relativePath), 'utf8');
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0;
    for (const match of content.matchAll(rule.pattern)) {
      violations.push({
        file: relativePath,
        line: lineNumberAt(content, match.index || 0),
        rule: rule.label,
        token: match[0],
      });
    }
  }
}

if (violations.length > 0) {
  console.error('Lexia M38-D No-Gradient Learner Chrome Audit: FAIL');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} — ${violation.rule}: ${violation.token}`);
  }
}

assert.equal(
  violations.length,
  0,
  `learner-facing chrome must remain gradient-free (${violations.length} violation${violations.length === 1 ? '' : 's'})`,
);

console.log(`Lexia M38-D No-Gradient Learner Chrome Audit: PASS (${uniqueFiles.length} learner/shared files scanned; zero gradient utilities/functions)`);
