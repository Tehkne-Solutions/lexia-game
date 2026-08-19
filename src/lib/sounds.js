// Sound effects using Web Audio API - no external files needed
const AudioContextCtor = typeof window !== 'undefined'
  ? (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)
  : null;
const audioCtx = AudioContextCtor ? new AudioContextCtor() : null;

function ensureContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  if (!audioCtx) return;
  ensureContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playCorrectSound() {
  if (!audioCtx) return;
  ensureContext();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.25), i * 100);
  });
}

export function playWrongSound() {
  if (!audioCtx) return;
  ensureContext();
  playTone(300, 0.4, 'triangle', 0.15);
  setTimeout(() => playTone(250, 0.4, 'triangle', 0.12), 150);
}

export function playCelebrationSound() {
  if (!audioCtx) return;
  ensureContext();
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.2), i * 120);
  });
  setTimeout(() => {
    [2093, 2637, 3135].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.1), i * 80);
    });
  }, 600);
}

export function playClickSound() {
  if (!audioCtx) return;
  ensureContext();
  playTone(800, 0.08, 'sine', 0.15);
}

export function playDrawSound() {
  if (!audioCtx) return;
  ensureContext();
  playTone(440 + Math.random() * 200, 0.05, 'sine', 0.05);
}

export function playStarSound() {
  if (!audioCtx) return;
  ensureContext();
  playTone(1200, 0.15, 'sine', 0.2);
  setTimeout(() => playTone(1600, 0.2, 'sine', 0.15), 100);
}

export function playLevelUpSound() {
  if (!audioCtx) return;
  ensureContext();
  const notes = [392, 440, 523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.5, 'sine', 0.2), i * 150);
  });
}

export function speak(text, lang = 'pt-BR') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.pitch = 1.3;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt'));
  if (ptVoice) utterance.voice = ptVoice;

  window.speechSynthesis.speak(utterance);
}
