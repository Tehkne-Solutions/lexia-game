import { playTone, speakNatural } from '@/audio/audioRuntime';

export function playCorrectSound() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((frequency, index) => {
    setTimeout(() => playTone(frequency, 0.3, 'sine', 0.25), index * 100);
  });
}

export function playWrongSound() {
  playTone(300, 0.4, 'triangle', 0.15);
  setTimeout(() => playTone(250, 0.4, 'triangle', 0.12), 150);
}

export function playCelebrationSound() {
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
  notes.forEach((frequency, index) => {
    setTimeout(() => playTone(frequency, 0.4, 'sine', 0.2), index * 120);
  });
  setTimeout(() => {
    [2093, 2637, 3135].forEach((frequency, index) => {
      setTimeout(() => playTone(frequency, 0.2, 'sine', 0.1), index * 80);
    });
  }, 600);
}

export function playClickSound() {
  playTone(800, 0.08, 'sine', 0.15);
}

export function playDrawSound() {
  playTone(440 + Math.random() * 200, 0.05, 'sine', 0.05);
}

export function playStarSound() {
  playTone(1200, 0.15, 'sine', 0.2);
  setTimeout(() => playTone(1600, 0.2, 'sine', 0.15), 100);
}

export function playLevelUpSound() {
  const notes = [392, 440, 523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((frequency, index) => {
    setTimeout(() => playTone(frequency, 0.5, 'sine', 0.2), index * 150);
  });
}

export function speak(text, lang = 'pt-BR') {
  return speakNatural(text, lang);
}
