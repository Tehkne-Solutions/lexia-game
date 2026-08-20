import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const keyboard = await readFile('src/components/game/OnScreenKeyboard.jsx', 'utf8');
const premiumCss = await readFile('src/styles/premium-game.css', 'utf8');

for (const token of [
  "['Q','W','E','R','T','Y','U','I','O','P']",
  "['A','S','D','F','G','H','J','K','L']",
  "['Z','X','C','V','B','N','M']",
  'lexia-onscreen-keyboard',
  'lexia-keyboard-key',
  'lexia-keyboard-delete',
  'onPointerDown={(e) => { e.preventDefault(); onKey(k); playClickSound(); }}',
  'onPointerDown={(e) => { e.preventDefault(); onDelete(); playClickSound(); }}',
  'aria-label={`Tecla ${k}`}',
  'aria-label="Apagar último caractere"',
  'aria-label="Teclado virtual"',
]) {
  assert.ok(keyboard.includes(token), `OnScreenKeyboard must preserve ${token}`);
}

for (const token of [
  'shadow-sm',
  'active:bg-primary',
  'active:bg-destructive',
  'active:text-white',
  'bg-gradient',
]) {
  assert.ok(!keyboard.includes(token), `OnScreenKeyboard must not include legacy utility chrome ${token}`);
}

assert.equal(
  (keyboard.match(/lexia-keyboard-key/g) || []).length,
  2,
  'OnScreenKeyboard source must apply the semantic key material to letter and delete controls',
);

for (const selector of [
  '.lexia-keyboard-key',
  '.lexia-keyboard-key:active',
  '.lexia-keyboard-delete',
  '.lexia-keyboard-delete:active',
]) {
  assert.ok(premiumCss.includes(selector), `Premium stylesheet must define ${selector}`);
}

for (const token of [
  'color: hsl(var(--primary-foreground))',
  'color: hsl(var(--destructive-foreground))',
  '0 3px 0 hsl(var(--lexia-paper-deep))',
]) {
  assert.ok(premiumCss.includes(token), `Premium keyboard material must include ${token}`);
}

assert.ok(
  premiumCss.includes('html:not(.high-contrast) .lexia-keyboard-key'),
  'Premium keyboard styling must preserve the high-contrast opt-out',
);
assert.ok(
  keyboard.includes('bg-card border border-border') && keyboard.includes('bg-muted border border-border'),
  'Keyboard must retain solid high-contrast fallback surfaces in JSX',
);

console.log('Lexia M38-Q Premium On-Screen Keyboard: PASS (semantic tactile keys, pointer behavior, sound, delete and high-contrast fallbacks preserved)');
