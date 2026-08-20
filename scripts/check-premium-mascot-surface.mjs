import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mascot = await readFile(new URL('../src/components/game/MascotAvatar.jsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles/premium-mascot.css', import.meta.url), 'utf8');

for (const token of [
  "import '@/styles/premium-mascot.css'",
  'lexia-mascot-body',
  'lexia-mascot-message',
  "happy: { eyes: '✨', mouth: '😊' }",
  "excited: { eyes: '🌟', mouth: '🤩' }",
  "thinking: { eyes: '👀', mouth: '🤔' }",
  "celebrating: { eyes: '🎉', mouth: '🥳' }",
  "encouraging: { eyes: '💪', mouth: '😃' }",
  "sleeping: { eyes: '💤', mouth: '😴' }",
  'getEquippedAccessories(accessories || loadMascotAccessories())',
  "expression === 'celebrating'",
  "expression === 'thinking'",
  "repeat: Infinity",
  'equipped.hat',
  'equipped.glasses',
  'equipped.bow',
  'equipped.extra',
  'role="img" aria-label="mascot"',
  '{message && (',
  '<span className="relative z-10">{message}</span>',
]) {
  assert.ok(mascot.includes(token), `MascotAvatar M38-V invariant missing: ${token}`);
}

for (const forbidden of ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'backdrop-blur', 'bg-gradient']) {
  assert.equal(mascot.includes(forbidden), false, `MascotAvatar must not include legacy chrome: ${forbidden}`);
}

for (const selector of ['.lexia-mascot-body', '.lexia-mascot-message']) {
  assert.ok(css.includes(selector), `mascot stylesheet must define ${selector}`);
}
assert.ok(css.includes('html:not(.high-contrast) .lexia-mascot-body'), 'mascot material must preserve high-contrast opt-out');
assert.ok(css.includes('var(--lexia-paper-deep)'), 'mascot surface must use authored paper depth');
assert.ok(css.includes('var(--lexia-shadow)'), 'mascot surface must use authored shadow token');

console.log('Lexia M38-V Premium Mascot Surface: PASS (authored mascot/message material; expressions, accessories, motion and message preserved)');
