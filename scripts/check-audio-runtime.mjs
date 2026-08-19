import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AUDIO_SETTINGS_KEY,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
  normalizeAudioSettings,
  saveAudioSettings,
  selectPreferredPortugueseVoice,
  updateAudioSettings,
} from '../src/audio/audioRuntime.js';

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
  clear: () => memory.clear(),
};

memory.clear();
assert.deepEqual(loadAudioSettings(), DEFAULT_AUDIO_SETTINGS, 'missing settings must use safe defaults');

const normalized = normalizeAudioSettings({
  masterVolume: 2,
  sfxVolume: -1,
  voiceVolume: 0.45,
  voiceEnabled: false,
});
assert.equal(normalized.masterVolume, 1, 'master volume must clamp to 1');
assert.equal(normalized.sfxVolume, 0, 'sfx volume must clamp to 0');
assert.equal(normalized.voiceVolume, 0.45);
assert.equal(normalized.voiceEnabled, false);

saveAudioSettings({ sfxVolume: 0.4, voiceVolume: 0.8, voiceEnabled: true });
assert.equal(loadAudioSettings().sfxVolume, 0.4);
assert.equal(loadAudioSettings().voiceVolume, 0.8);
assert.equal(loadAudioSettings().voiceEnabled, true);
assert.ok(memory.has(AUDIO_SETTINGS_KEY), 'audio settings must persist under the canonical storage key');

const updated = updateAudioSettings({ sfxVolume: 0.65 });
assert.equal(updated.sfxVolume, 0.65);
assert.equal(updated.voiceVolume, 0.8, 'partial updates must preserve unrelated audio settings');

const voices = [
  { name: 'English Voice', lang: 'en-US', localService: true },
  { name: 'Português Portugal', lang: 'pt-PT', localService: true },
  { name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)', lang: 'pt-BR', localService: false },
  { name: 'Português Brasil Genérico', lang: 'pt-BR', localService: true },
];
const preferred = selectPreferredPortugueseVoice(voices);
assert.equal(preferred.lang, 'pt-BR', 'voice selection must prioritize Brazilian Portuguese');
assert.match(preferred.name, /Francisca/i, 'known high-quality PT-BR voices should win when available');

const runtimeSource = await readFile(new URL('../src/audio/audioRuntime.js', import.meta.url), 'utf8');
assert.ok(runtimeSource.includes("utterance.rate = 0.92"), 'voice rate must remain calm and comprehensible');
assert.ok(runtimeSource.includes('utterance.pitch = 1'), 'voice pitch must remain natural instead of artificially high');
assert.ok(runtimeSource.includes('function getAudioContext()'), 'AudioContext must be lazy');
assert.ok(!runtimeSource.includes('const audioCtx = AudioContextCtor ? new AudioContextCtor()'), 'AudioContext must not be created at module load');

const soundsSource = await readFile(new URL('../src/lib/sounds.js', import.meta.url), 'utf8');
assert.ok(soundsSource.includes("from '@/audio/audioRuntime'"), 'legacy sounds API must delegate to the audio runtime');
assert.ok(soundsSource.includes('speakNatural(text, lang)'), 'legacy speak() must use the natural voice runtime');
assert.ok(!soundsSource.includes('pitch = 1.3'), 'legacy artificial pitch must be removed');

const settingsSource = await readFile(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
for (const required of ['Som e voz', 'Efeitos sonoros', 'Volume da voz', 'Narração da Corujinha', 'Ouvir voz da Corujinha']) {
  assert.ok(settingsSource.includes(required), `Settings must expose ${required}`);
}

console.log('Lexia M34-A Audio Runtime contract: PASS (lazy context, persistent buses, PT-BR voice selection, natural speech, settings controls)');
