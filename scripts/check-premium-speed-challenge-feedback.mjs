import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const speed = await readFile(new URL('../src/pages/SpeedChallenge.jsx', import.meta.url), 'utf8');

for (const token of [
  'const GAME_DURATION = 60',
  'function bestScoreKey(profileId)',
  'getSpeedChallengeProfile(stats)',
  "const [phase, setPhase] = useState('ready')",
  'setInterval(() => {',
  '}, 1000)',
  "setPhase('playing')",
  "setPhase('done')",
  "setFeedback('correct')",
  "setFeedback('wrong')",
  'localStorage.getItem(bestScoreKey(speedProfile.id))',
  'localStorage.setItem(bestScoreKey(speedProfile.id), String(score))',
  'confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })',
  'playCorrectSound()',
  'playWrongSound()',
  '<OnScreenKeyboard',
  'onKey={(key) => setTyped((previous) => (previous + key).slice(0, currentItem.display.length))}',
  'onDelete={() => setTyped((previous) => previous.slice(0, -1))}',
  'tone="reward"',
  "timeLeft <= 10 ? 'text-destructive' : 'text-muted-foreground'",
  'className="text-secondary font-display text-2xl"',
  'className="text-destructive font-display text-2xl"',
  'className="font-display text-lg text-accent mt-2"',
  'Recorde deste nível',
  'Frases continuam no modo próprio de composição',
]) {
  assert.ok(speed.includes(token), `SpeedChallenge M38-T invariant missing: ${token}`);
}

for (const forbidden of [
  'text-red-',
  'bg-red-',
  'border-red-',
  'text-green-',
  'bg-green-',
  'border-green-',
  'text-amber-',
  'bg-amber-',
  'border-amber-',
  'bg-gradient',
]) {
  assert.equal(speed.includes(forbidden), false, `SpeedChallenge must not include fixed feedback utility: ${forbidden}`);
}

assert.ok(
  speed.includes("feedback === 'wrong' ? 'review' : 'paper'"),
  'wrong-answer state must preserve review material tone',
);
assert.ok(
  speed.includes("score >= bestScore && score > 0 ? 'reward' : 'paper'"),
  'record result must preserve reward material tone',
);

console.log('Lexia M38-T Premium Speed Challenge Feedback: PASS (semantic timer/correct/wrong/reward feedback; timing, persistence, audio and typing preserved)');
