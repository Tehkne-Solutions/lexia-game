import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const drawing = await readFile(`${root}src/components/game/DrawingCanvas.jsx`, 'utf8');

assert.ok(drawing.includes("import GamePanel from '@/components/game/GamePanel'"), 'DrawingCanvas must use GamePanel');
assert.ok(drawing.includes('tone="paper"'), 'Drawing board must use paper material');
assert.ok(drawing.includes("canvas.toDataURL('image/png')"), 'Drawing export contract must remain intact');
assert.ok(drawing.includes("ctx.strokeStyle = 'hsl(258, 65%, 45%)'"), 'Drawing stroke contract must remain intact');
assert.ok(drawing.includes('role="status"'), 'Evaluation overlay must expose status semantics');
assert.ok(!drawing.includes('shadow-xl'), 'Drawing surface must not use heavy shadow chrome');
assert.ok(!drawing.includes('backdrop-blur'), 'Drawing surface must not use glass blur');
assert.ok(!drawing.includes('bg-white/80'), 'Evaluation overlay must use semantic background token');

console.log('Lexia M38-L Premium Drawing Surface: PASS (semantic material, preserved bitmap/stroke/evaluation contract)');
