import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const selector = await readFile('src/components/game/LetterSelector.jsx', 'utf8');
const premiumCss = await readFile('src/styles/premium-game.css', 'utf8');

for (const token of [
  'lexia-letter-selector-surface',
  'lexia-letter-tile',
  'lexia-letter-selector-legend',
  "import GameActionButton from '@/components/game/GameActionButton'",
  'gameVariant="neutral"',
  'if (mastery >= 80)',
  'if (mastery >= 40)',
  'ALPHABET.map((item, i)',
  'transition={{ delay: i * 0.02 }}',
  'playClickSound();',
  'onSelect(item.letter);',
  'onClick={onClose}',
  'bg-background flex flex-col',
  'border-t border-border bg-card',
  "mastered: 'bg-secondary/20 border-secondary text-secondary ring-2 ring-secondary/30'",
  "learning: 'bg-accent/20 border-accent text-accent-foreground ring-2 ring-accent/30'",
  "started: 'bg-primary/10 border-primary/30 text-primary'",
  "new: 'bg-muted border-border text-muted-foreground'",
]) {
  assert.ok(selector.includes(token), `LetterSelector must preserve ${token}`);
}

for (const token of [
  'backdrop-blur',
  'shadow-sm',
  'bg-card/50',
  'bg-gradient',
]) {
  assert.ok(!selector.includes(token), `LetterSelector must not include legacy visual token ${token}`);
}

assert.ok(
  selector.includes('<motion.button'),
  'LetterSelector must preserve bespoke animated alphabet tiles instead of forcing generic CTA semantics',
);
assert.ok(
  selector.includes('aria-label={`${item.letter},'),
  'LetterSelector tiles must expose letter and mastery state to assistive technology',
);

for (const selectorClass of [
  '.lexia-letter-selector-surface',
  '.lexia-letter-tile',
  '.lexia-letter-selector-legend',
]) {
  assert.ok(premiumCss.includes(selectorClass), `Premium stylesheet must define ${selectorClass}`);
}

assert.ok(
  premiumCss.includes('html:not(.high-contrast) .lexia-letter-selector-surface'),
  'Letter selector material must preserve high-contrast opt-out',
);
assert.ok(
  premiumCss.includes('0 4px 0 hsl(var(--lexia-paper-deep))'),
  'Letter tiles must use authored physical depth rather than generic utility shadows',
);

console.log('Lexia M38-P Premium Letter Selector: PASS (semantic selector material, authored tiles, high-contrast fallback, mastery behavior and motion preserved)');
