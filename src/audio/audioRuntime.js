const AUDIO_SETTINGS_KEY = 'lexia_audio_settings';

const defaultSettings = {
  soundEnabled: true,
  ttsEnabled: true,
  volume: 1.0,
  pitch: 1.25,
  rate: 0.85
};

export function loadAudioSettings() {
  try {
    const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings };
  } catch (e) {
    return { ...defaultSettings };
  }
}

export function saveAudioSettings(settings) {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Erro ao salvar configurações de áudio:', e);
  }
}

export function updateAudioSettings(partialSettings) {
  const current = loadAudioSettings();
  const updated = { ...current, ...partialSettings };
  saveAudioSettings(updated);
  return updated;
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function playTone(freq = 440, type = 'sine', duration = 0.2, volume = 0.3) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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

export function speakNatural(text, options = {}) {
  const settings = loadAudioSettings();
  if (!settings.ttsEnabled) return;

  speakText(text, {
    pitch: options.pitch ?? settings.pitch,
    rate: options.rate ?? settings.rate,
    volume: options.volume ?? settings.volume,
    lang: options.lang || 'pt-BR'
  });
}

export function previewVoice(text = 'Aprender a ler é mágico!', options = {}) {
  speakText(text, options);
}

export function speakText(text, options = {}) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'pt-BR';
  utterance.pitch = options.pitch ?? 1.25;
  utterance.rate = options.rate ?? 0.85;
  utterance.volume = options.volume ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(
    (v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR')
  );
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
  
  speakText(text, { pitch: 1.3, rate: 0.82 });
}

export function initAudioUnlockListeners() {
  const unlock = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((evt) => {
    window.addEventListener(evt, unlock, { once: true, passive: true });
  });
}
