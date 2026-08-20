import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const album = await readFile(new URL('../src/components/game/StickerAlbum.jsx', import.meta.url), 'utf8');
const customizer = await readFile(new URL('../src/components/game/MascotCustomizer.jsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles/premium-collectibles.css', import.meta.url), 'utf8');

for (const token of [
  "import '@/styles/premium-collectibles.css'",
  'getEarnedStickers(allProgress, stats)',
  'getJourneyStickers(stats)',
  'lexia-collectible-tile',
  'lexia-collectible-tile-earned',
  'journeyStickers.filter((sticker) => sticker.unlocked).length',
  'LETTER_STICKERS',
  'MILESTONE_STICKERS',
]) {
  assert.ok(album.includes(token), `StickerAlbum M38-U invariant missing: ${token}`);
}

for (const forbidden of ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'bg-gradient']) {
  assert.equal(album.includes(forbidden), false, `StickerAlbum must not include legacy tile chrome: ${forbidden}`);
}

for (const token of [
  "import '@/styles/premium-collectibles.css'",
  'isAccessoryUnlocked(accessory, totalStars)',
  'loadMascotAccessories',
  'saveMascotAccessories(updated)',
  'playClickSound()',
  'lexia-collectible-tile',
  'lexia-collectible-tile-selected',
  'aria-pressed={selected}',
  'aria-disabled={!unlocked}',
  'onClick={() => toggle(a)}',
]) {
  assert.ok(customizer.includes(token), `MascotCustomizer M38-U invariant missing: ${token}`);
}

for (const forbidden of ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'bg-gradient']) {
  assert.equal(customizer.includes(forbidden), false, `MascotCustomizer must not include legacy tile chrome: ${forbidden}`);
}

for (const selector of [
  '.lexia-collectible-tile',
  '.lexia-collectible-tile-earned',
  '.lexia-collectible-tile-selected',
]) {
  assert.ok(css.includes(selector), `collectible stylesheet must define ${selector}`);
}

assert.ok(
  css.includes('html:not(.high-contrast) .lexia-collectible-tile'),
  'collectible material must preserve high-contrast opt-out',
);
assert.ok(css.includes('var(--lexia-paper-deep)'), 'collectible tiles must use authored paper depth');
assert.ok(css.includes('var(--lexia-shadow)'), 'collectible tiles must use authored shadow token');

console.log('Lexia M38-U Premium Collectible Tiles: PASS (shared physical material, unlock/select/persistence and high-contrast behavior preserved)');
