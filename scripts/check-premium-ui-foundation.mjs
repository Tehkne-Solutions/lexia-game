import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const premiumCss = await readFile(new URL('../src/styles/premium-game.css', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');

assert.ok(mainSource.includes("@/styles/premium-game.css"), 'premium game theme must load after the base theme');

for (const token of [
  '--lexia-paper-deep',
  '--lexia-ink-soft',
  '--lexia-primary-depth',
  '--lexia-green-depth',
  '--lexia-gold-depth',
  '--lexia-panel-edge',
]) {
  assert.ok(premiumCss.includes(token), `premium foundation must define ${token}`);
}

assert.ok(premiumCss.includes(':root:not(.high-contrast)'), 'premium palette must opt out of high-contrast mode');
assert.ok(premiumCss.includes(':root.dark:not(.high-contrast)'), 'premium dark palette must opt out of high-contrast mode');
assert.ok(premiumCss.includes('[aria-label="Plano de aventura"]'), 'Home adventure plan must receive an authored surface treatment');
assert.ok(premiumCss.includes('button.bg-gradient-to-r'), 'legacy Home primary CTA must be intercepted by the premium theme');
assert.ok(premiumCss.includes('background-image: none !important'), 'premium primary action must remove the legacy gradient');
assert.ok(!premiumCss.includes('filter: drop-shadow'), 'premium UI must not introduce glow/drop-shadow effects');
assert.ok(!premiumCss.includes('text-shadow:'), 'premium UI must avoid glowing text treatments');
assert.ok(premiumCss.includes('@media (prefers-reduced-motion: reduce)'), 'premium interaction must preserve reduced-motion support');

const baseCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
assert.ok(baseCss.includes('.high-contrast'), 'existing accessibility high-contrast contract must remain available');

console.log('Lexia M35-A Premium UI Foundation contract: PASS (authored palette, material surfaces, no gradient/glow CTA, high-contrast preserved)');
