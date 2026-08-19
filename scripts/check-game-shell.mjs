import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
assert.ok(css.includes('.game-viewport'));
assert.ok(css.includes('.game-viewport-scroll'));
assert.ok(css.includes('.game-scroll-y'));
assert.ok(css.includes('100dvh'), 'game shell must use dynamic viewport height');
assert.ok(css.includes('env(safe-area-inset-top)'), 'game shell must respect top safe area');
assert.ok(css.includes('env(safe-area-inset-bottom)'), 'game shell must respect bottom safe area');
assert.ok(css.includes('.game-drawing-board'));
assert.ok(css.includes('42dvh'), 'drawing board must adapt to low-height mobile viewports');

const welcome = await readFile(new URL('../src/pages/Welcome.jsx', import.meta.url), 'utf8');
assert.ok(welcome.includes('game-viewport-scroll'), 'Welcome must own its viewport scrolling');
assert.ok(welcome.includes('game-safe-top'));
assert.ok(welcome.includes('game-safe-bottom'));
assert.equal(welcome.includes('min-h-screen'), false, 'Welcome must not rely on legacy 100vh screen utility');

const playGame = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(playGame.includes('game-viewport flex flex-col'));
assert.ok(playGame.includes('game-scroll-y game-safe-bottom flex-1'), 'only PlayGame content region should scroll when required');
assert.ok(playGame.includes('<GameplayHud'), 'PlayGame must delegate its top safe-area shell to GameplayHud');
assert.equal(playGame.includes('min-h-screen'), false, 'PlayGame must not exceed the dynamic viewport shell');

const gameplayHud = await readFile(new URL('../src/components/game/GameplayHud.jsx', import.meta.url), 'utf8');
assert.ok(gameplayHud.includes('game-safe-top'), 'delegated gameplay HUD must retain top safe-area protection');
assert.ok(gameplayHud.includes('flex-shrink-0'), 'delegated gameplay HUD must remain outside the scrolling content region');

const worldMap = await readFile(new URL('../src/pages/WorldMap.jsx', import.meta.url), 'utf8');
assert.ok(worldMap.includes('game-viewport flex flex-col'));
assert.ok(worldMap.includes('game-scroll-y flex-1 relative'), 'World Map must scroll inside the game shell');
assert.ok(worldMap.includes('game-safe-top'));
assert.ok(worldMap.includes('game-safe-bottom'));
assert.equal(worldMap.includes('min-h-screen'), false, 'World Map must not use document-level screen height');

const drawing = await readFile(new URL('../src/components/game/DrawingCanvas.jsx', import.meta.url), 'utf8');
assert.ok(drawing.includes('game-drawing-board'));
assert.ok(drawing.includes('game-drawing-actions'));
assert.equal(drawing.includes("maxWidth: '260px'"), false, 'drawing board must not retain fixed inline width');

console.log('Lexia Game Shell M07-G/M37-A contract: PASS (100dvh, delegated safe-area HUD, bounded scrolling, responsive drawing surface)');
