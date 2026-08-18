import { calculateMastery } from './fsrs';
import { ALPHABET } from './alphabetData';

const CHALLENGE_KEY = 'lexia_daily_challenge';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getDailyChallenge(allProgress) {
  const today = getTodayKey();
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(CHALLENGE_KEY)); } catch { return null; }
  })();

  // Return today's saved challenge if it exists
  if (saved && saved.date === today) return saved;

  // Generate new challenge — pick 3 letters the student struggles with most
  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.letter] = p; });

  // Score each letter: lower = needs more practice
  const scored = ALPHABET.map(item => {
    const p = progressMap[item.letter];
    if (!p || p.total_attempts === 0) return { letter: item.letter, score: 0 }; // never tried
    return { letter: item.letter, score: calculateMastery(p) };
  });

  // Sort by mastery ascending, take worst 8, pick 3 randomly
  const worst = scored.sort((a, b) => a.score - b.score).slice(0, 8);
  const shuffled = worst.sort(() => Math.random() - 0.5).slice(0, 3);
  const letters = shuffled.map(s => s.letter);

  const challenge = {
    date: today,
    letters,
    progress: {}, // { letter: boolean }
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
  const allDone = saved.letters.every(l => saved.progress[l]);
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