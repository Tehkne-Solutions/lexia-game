import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const playGame = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
const hud = await readFile(new URL('../src/components/game/GameplayHud.jsx', import.meta.url), 'utf8');
const resultActions = await readFile(new URL('../src/components/game/GameplayResultActions.jsx', import.meta.url), 'utf8');
const premiumCss = await readFile(new URL('../src/styles/premium-game.css', import.meta.url), 'utf8');

assert.ok(playGame.includes("import GameplayHud from '@/components/game/GameplayHud'"), 'PlayGame must use GameplayHud');
assert.ok(playGame.includes("import GameplayResultActions from '@/components/game/GameplayResultActions'"), 'PlayGame must use GameplayResultActions');
assert.ok(playGame.includes("import GameActionButton from '@/components/game/GameActionButton'"), 'PlayGame must use semantic game actions');
assert.ok(!playGame.includes("@/components/ui/button"), 'PlayGame must not import generic Button directly');
assert.ok(!playGame.includes("from 'react-router-dom'"), 'PlayGame must delegate route links to semantic children');
assert.ok(!playGame.includes('from-secondary to-secondary/80'), 'PlayGame must not author legacy Continue gradient');
assert.ok(playGame.includes('<GameplayHud'), 'premium HUD must be mounted');
assert.ok(playGame.includes('<GameplayResultActions'), 'premium result actions must be mounted');
assert.ok(playGame.includes('lexia-game-panel-reward'), 'daily multiplier feedback must use reward material');

assert.ok(hud.includes('lexia-gameplay-hud'), 'HUD must expose authored surface class');
assert.ok(hud.includes('GameActionButton'), 'HUD controls must use semantic game actions');
assert.ok(hud.includes('ProgressBar'), 'HUD must preserve canonical progress display');
assert.ok(hud.includes("to=\"/world\""), 'HUD must preserve canonical map path');

assert.ok(resultActions.includes('GameActionButton'), 'result controls must use semantic game actions');
assert.ok(resultActions.includes('Tentar novamente'), 'retry action must remain available');
assert.ok(resultActions.includes("isPracticeMode ? 'Próxima' : 'Continuar'"), 'continue semantics must remain mode-aware');
assert.ok(resultActions.includes("to=\"/world\""), 'journey map handoff must remain available');

assert.ok(premiumCss.includes('.lexia-gameplay-hud'), 'premium CSS must style gameplay HUD');
assert.ok(premiumCss.includes('.lexia-result-feedback-panel'), 'premium CSS must style result feedback panel');

console.log('Lexia M37-A Premium Gameplay HUD contract: PASS');
