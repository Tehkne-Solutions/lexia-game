export const AUDIO_SETTINGS_KEY = 'lexia_audio_settings';

export const DEFAULT_AUDIO_SETTINGS = {
  soundEnabled: true,
  ttsEnabled: true,
  volume: 1.0,
  pitch: 1.0,
  rate: 0.92,
  masterVolume: 1.0,
  sfxVolume: 1.0,
  voiceVolume: 1.0,
  voiceEnabled: true
};

const defaultSettings = DEFAULT_AUDIO_SETTINGS;

let audioCtxInstance = null;

export function getAudioContext() {
  if (!audioCtxInstance) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtxInstance = new AudioCtx();
    }
  }
  return audioCtxInstance;
}

export function normalizeAudioSettings(settings = {}) {
  const clamp = (val, def = 1) => {
    if (typeof val !== 'number' || isNaN(val)) return def;
    return Math.max(0, Math.min(1, val));
  };

  return {
    ...DEFAULT_AUDIO_SETTINGS,
    ...settings,
    masterVolume: clamp(settings.masterVolume, DEFAULT_AUDIO_SETTINGS.masterVolume),
    sfxVolume: clamp(settings.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
    voiceVolume: clamp(settings.voiceVolume, DEFAULT_AUDIO_SETTINGS.voiceVolume),
    voiceEnabled: typeof settings.voiceEnabled === 'boolean' ? settings.voiceEnabled : DEFAULT_AUDIO_SETTINGS.voiceEnabled,
  };
}

export function loadAudioSettings() {
  try {
    const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
    return saved ? normalizeAudioSettings(JSON.parse(saved)) : { ...DEFAULT_AUDIO_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings) {
  try {
    const normalized = normalizeAudioSettings(settings);
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.warn('Erro ao salvar configurações de áudio:', e);
  }
}

export function updateAudioSettings(partialSettings) {
  const current = loadAudioSettings();
  const updated = normalizeAudioSettings({ ...current, ...partialSettings });
  saveAudioSettings(updated);
  return updated;
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function playTone(freq = 440, type = 'sine', duration = 0.2, volume = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Erro ao sintetizar tom de áudio:', e);
  }
}

export function selectPreferredPortugueseVoice(voices = []) {
  if (!voices || !voices.length) return null;

  const ptBrVoices = voices.filter(
    (v) => v.lang && (v.lang.includes('pt-BR') || v.lang.includes('pt_BR'))
  );

  if (ptBrVoices.length > 0) {
    const franciscaVoice = ptBrVoices.find((v) => /Francisca/i.test(v.name));
    if (franciscaVoice) return franciscaVoice;
    return ptBrVoices[0];
  }

  const anyPtVoice = voices.find(
    (v) => v.lang && (v.lang.includes('pt') || v.lang.includes('PT'))
  );

  return anyPtVoice || voices[0] || null;
}

export function speakNatural(text, options = {}) {
  const settings = loadAudioSettings();
  if (!settings.ttsEnabled || !settings.voiceEnabled) return;

  speakText(text, {
    pitch: options.pitch ?? settings.pitch ?? 1,
    rate: options.rate ?? settings.rate ?? 0.92,
    volume: options.volume ?? settings.voiceVolume ?? settings.volume ?? 1.0,
    lang: options.lang || 'pt-BR'
  });
}

export function previewVoice(text = 'Aprender a ler é mágico!', options = {}) {
  speakText(text, options);
}

export function speakText(text, options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'pt-BR';
  utterance.pitch = 1;
  utterance.rate = 0.92;
  utterance.volume = options.volume ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  const ptVoice = selectPreferredPortugueseVoice(voices);
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakLetterPrompt(letter, exampleWord) {
  const cleanLetter = letter ? letter.toUpperCase() : '';
  const text = exampleWord 
    ? `Letra ${cleanLetter}! ${cleanLetter} de ${exampleWord}. Desenhe a letra ${cleanLetter}!`
    : `Desenhe a letra ${cleanLetter}!`;
  
  speakText(text, { pitch: 1, rate: 0.92 });
}

export function initAudioUnlockListeners() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((evt) => {
    window.addEventListener(evt, unlock, { once: true, passive: true });
  });
}
