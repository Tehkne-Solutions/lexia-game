import { AUDIO_ASSET_IDS } from '@/audio/audioAssetManifest';
import { playAudioAsset } from '@/audio/audioAssetPlayer';
import { playTone, speakNatural } from '@/audio/audioRuntime';

function fallbackCorrectSound() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((frequency, index) => {
    setTimeout(() => playTone(frequency, 0.3, 'sine', 0.25), index * 100);
  });
}

function fallbackWrongSound() {
  playTone(300, 0.4, 'triangle', 0.15);
  setTimeout(() => playTone(250, 0.4, 'triangle', 0.12), 150);
}

function fallbackCelebrationSound() {
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

function fallbackClickSound() {
  playTone(800, 0.08, 'sine', 0.15);
}

function fallbackDrawSound() {
  playTone(440 + Math.random() * 200, 0.05, 'sine', 0.05);
}

function fallbackStarSound() {
  playTone(1200, 0.15, 'sine', 0.2);
  setTimeout(() => playTone(1600, 0.2, 'sine', 0.15), 100);
}

function fallbackLevelUpSound() {
  const notes = [392, 440, 523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((frequency, index) => {
    setTimeout(() => playTone(frequency, 0.5, 'sine', 0.2), index * 150);
  });
}

export function playCorrectSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_CORRECT, fallbackCorrectSound);
}

export function playWrongSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_WRONG, fallbackWrongSound);
}

export function playCelebrationSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_CELEBRATION, fallbackCelebrationSound);
}

export function playClickSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_CLICK, fallbackClickSound);
}

export function playDrawSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_DRAW, fallbackDrawSound);
}

export function playStarSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_STAR, fallbackStarSound);
}

export function playLevelUpSound() {
  void playAudioAsset(AUDIO_ASSET_IDS.SFX_LEVEL_UP, fallbackLevelUpSound);
}

export function speak(text, lang = 'pt-BR') {
  return speakNatural(text, lang);
}
