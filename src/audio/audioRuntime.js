const AUDIO_SETTINGS_KEY = 'lexia.audio.v1';

const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  masterVolume: 1,
  sfxVolume: 0.75,
  voiceVolume: 1,
  voiceEnabled: true,
});

let audioContext = null;
let cachedVoice = null;

function clamp01(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(1, Math.max(0, numeric));
}

export function normalizeAudioSettings(value = {}) {
  return {
    masterVolume: clamp01(value.masterVolume, DEFAULT_AUDIO_SETTINGS.masterVolume),
    sfxVolume: clamp01(value.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
    voiceVolume: clamp01(value.voiceVolume, DEFAULT_AUDIO_SETTINGS.voiceVolume),
    voiceEnabled: value.voiceEnabled !== false,
  };
}

export function loadAudioSettings() {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || 'null');
    return normalizeAudioSettings(saved || DEFAULT_AUDIO_SETTINGS);
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings) {
  const normalized = normalizeAudioSettings(settings);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function updateAudioSettings(patch) {
  return saveAudioSettings({ ...loadAudioSettings(), ...patch });
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;
  const AudioContextCtor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  audioContext = AudioContextCtor ? new AudioContextCtor() : null;
  return audioContext;
}

export async function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx.state === 'running';
}

let unlockAttached = false;
export function initAudioUnlockListeners() {
  if (typeof window === 'undefined' || unlockAttached) return;
  unlockAttached = true;
  const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
  const handleInteraction = () => {
    unlockAudio().then((unlocked) => {
      if (unlocked) {
        events.forEach((evt) => window.removeEventListener(evt, handleInteraction, true));
      }
    }).catch(() => {});
  };
  events.forEach((evt) => window.addEventListener(evt, handleInteraction, { capture: true, passive: true }));
}

if (typeof window !== 'undefined') {
  initAudioUnlockListeners();
}

export function playTone(frequency, duration, type = 'sine', level = 0.3) {
  const settings = loadAudioSettings();
  const effectiveVolume = Math.max(0.0001, level * settings.masterVolume * settings.sfxVolume);
  if (effectiveVolume <= 0.0001) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(effectiveVolume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function voiceScore(voice) {
  const lang = String(voice?.lang || '').toLowerCase();
  const name = String(voice?.name || '').toLowerCase();
  let score = 0;
  if (lang === 'pt-br') score += 100;
  else if (lang.startsWith('pt')) score += 60;
  if (/microsoft|google|apple|luciana|francisca|antonio|pt-br/.test(name)) score += 20;
  if (voice?.localService) score += 5;
  return score;
}

export function selectPreferredPortugueseVoice(voices = []) {
  return [...voices]
    .filter((voice) => String(voice?.lang || '').toLowerCase().startsWith('pt'))
    .sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null;
}

function resolveVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!cachedVoice || !voices.includes(cachedVoice)) {
    cachedVoice = selectPreferredPortugueseVoice(voices);
  }
  return cachedVoice;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = selectPreferredPortugueseVoice(window.speechSynthesis.getVoices());
  });
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speakNatural(text, lang = 'pt-BR') {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return false;
  const settings = loadAudioSettings();
  if (!settings.voiceEnabled || settings.masterVolume <= 0 || settings.voiceVolume <= 0) return false;

  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = settings.masterVolume * settings.voiceVolume;

  const voice = resolveVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
}

export function previewVoice() {
  return speakNatural('Olá! Eu sou a Corujinha. Vamos aprender juntos?');
}

export { AUDIO_SETTINGS_KEY, DEFAULT_AUDIO_SETTINGS };
