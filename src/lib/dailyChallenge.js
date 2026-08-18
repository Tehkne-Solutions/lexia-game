import { ALPHABET } from './alphabetData';
import { getDailyChallengeCandidates } from '../learning/engine.js';

const CHALLENGE_KEY = 'lexia_daily_challenge';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyChallenge(allProgress) {
  const today = getTodayKey();
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(CHALLENGE_KEY)); } catch { return null; }
  })();

  if (saved && saved.date === today) return saved;

  // Daily challenges now respect the active curriculum instead of introducing
  // arbitrary late-stage letters before the learner is ready for them.
  const worst = getDailyChallengeCandidates(allProgress, ALPHABET, 8);
  const shuffled = [...worst].sort(() => Math.random() - 0.5).slice(0, 3);
  const letters = shuffled.map((item) => item.letter);

  const challenge = {
    date: today,
    letters,
    progress: {},
    completed: false,
    starsMultiplier: 2,
  };

  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  return challenge;
}

export function updateChallengeProgress(letter, success) {
  const today = getTodayKey();
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(CHALLENGE_KEY)); } catch { return null; }
  })();

  if (!saved || saved.date !== today) return null;
  if (!saved.letters.includes(letter)) return saved;

  saved.progress[letter] = saved.progress[letter] || success;
  const allDone = saved.letters.every((challengeLetter) => saved.progress[challengeLetter]);
  if (allDone) saved.completed = true;

  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(saved));
  return saved;
}

export function isChallengeCompleted() {
  const today = getTodayKey();
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(CHALLENGE_KEY)); } catch { return null; }
  })();
  return saved?.date === today && saved?.completed === true;
}
