import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sentenceSource = await readFile(new URL('../src/pages/PlaySentences.jsx', import.meta.url), 'utf8');
const premiumCss = await readFile(new URL('../src/styles/premium-game.css', import.meta.url), 'utf8');

for (const token of [
  'lexia-sentence-token',
  'lexia-sentence-token-selected',
  'lexia-sentence-token-available',
  'onClick={() => removeToken(token.id)}',
  'onClick={() => addToken(token.id)}',
  'aria-label={`Remover ${token.word} da frase`}',
  'aria-label={`Adicionar ${token.word} à frase`}',
  'const addToken = useCallback((id) => {',
  'const removeToken = useCallback((id) => {',
]) {
  assert.ok(sentenceSource.includes(token), `M38-R sentence token invariant missing: ${token}`);
}

assert.equal(
  (sentenceSource.match(/<button/g) || []).length,
  2,
  'Sentence builder must keep exactly the two native semantic token button families',
);
assert.equal(
  (sentenceSource.match(/if \(phase !== 'build'\) return;/g) || []).length,
  2,
  'Add/remove token callbacks must remain guarded to the build phase',
);
assert.equal(
  (sentenceSource.match(/playClickSound\(\);/g) || []).length >= 3,
  true,
  'Sentence interactions must retain click feedback',
);

for (const legacy of [
  'shadow-sm',
  'hover:border-primary/50',
  'bg-gradient',
]) {
  assert.equal(sentenceSource.includes(legacy), false, `Sentence token surface must not regress to legacy chrome: ${legacy}`);
}

for (const selector of [
  'html:not(.high-contrast) .lexia-sentence-token {',
  'html:not(.high-contrast) .lexia-sentence-token-available {',
  'html:not(.high-contrast) .lexia-sentence-token-available:hover {',
  'html:not(.high-contrast) .lexia-sentence-token-selected {',
  'html:not(.high-contrast) .lexia-sentence-token:active {',
]) {
  assert.ok(premiumCss.includes(selector), `Premium stylesheet must define ${selector}`);
}

for (const material of [
  'background-color: hsl(var(--card));',
  'border-color: hsl(var(--lexia-panel-edge)) !important;',
  'background-color: hsl(var(--primary));',
  'border-color: hsl(var(--lexia-primary-depth)) !important;',
  'color: hsl(var(--primary-foreground));',
  '0 3px 0 hsl(var(--lexia-paper-deep))',
  'transform: translateY(2px) scale(0.95);',
]) {
  assert.ok(premiumCss.includes(material), `Premium sentence token material missing: ${material}`);
}

assert.ok(
  sentenceSource.includes('bg-primary text-primary-foreground') &&
    sentenceSource.includes('border-2 border-border bg-background'),
  'Sentence tokens must retain solid JSX fallbacks for high-contrast mode',
);

console.log('Lexia M38-R Premium Sentence Tokens: PASS (native add/remove pieces, build guards, tactile material, accessibility labels and high-contrast fallbacks preserved)');
