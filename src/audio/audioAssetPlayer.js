import { getAudioAssetDefinition } from './audioAssetManifest.js';
import { loadAudioSettings, speakNatural, stopSpeech } from './audioRuntime.js';

const resolvedSources = new Map();
const failedSources = new Set();
const preloadPromises = new Map();

function audioVolumeForKind(kind) {
  const settings = loadAudioSettings();
  if (kind === 'voice') {
    if (!settings.voiceEnabled) return 0;
    return settings.masterVolume * settings.voiceVolume;
  }
  return settings.masterVolume * settings.sfxVolume;
}

function canUseAudioElement() {
  return typeof Audio !== 'undefined';
}

function markSourceFailure(source) {
  failedSources.add(source);
}

async function probeSource(source) {
  if (!canUseAudioElement() || failedSources.has(source)) return null;
  if (resolvedSources.has(source)) return source;

  const cached = preloadPromises.get(source);
  if (cached) return cached;

  const promise = new Promise((resolve) => {
    const audio = new Audio();
    const cleanup = () => {
      audio.oncanplaythrough = null;
      audio.onloadeddata = null;
      audio.onerror = null;
    };
    const success = () => {
      cleanup();
      resolvedSources.set(source, source);
      resolve(source);
    };
    const failure = () => {
      cleanup();
      markSourceFailure(source);
      resolve(null);
    };
    audio.preload = 'auto';
    audio.oncanplaythrough = success;
    audio.onloadeddata = success;
    audio.onerror = failure;
    audio.src = source;
    try {
      audio.load();
    } catch {
      failure();
    }
  }).finally(() => preloadPromises.delete(source));

  preloadPromises.set(source, promise);
  return promise;
}

export async function resolveAudioAssetSource(assetId) {
  const definition = getAudioAssetDefinition(assetId);
  if (!definition || !canUseAudioElement()) return null;

  for (const source of definition.sources || []) {
    if (failedSources.has(source)) continue;
    const resolved = await probeSource(source);
    if (resolved) return resolved;
  }
  return null;
}

export async function preloadAudioAsset(assetId) {
  return Boolean(await resolveAudioAssetSource(assetId));
}

export async function preloadAudioAssets(assetIds = []) {
  const results = await Promise.all(assetIds.map(async (assetId) => [assetId, await preloadAudioAsset(assetId)]));
  return Object.fromEntries(results);
}

export async function playAudioAsset(assetId, fallback = null) {
  const definition = getAudioAssetDefinition(assetId);
  const volume = audioVolumeForKind(definition?.kind);
  if (!definition || volume <= 0 || !canUseAudioElement()) {
    fallback?.();
    return false;
  }

  const source = await resolveAudioAssetSource(assetId);
  if (!source) {
    fallback?.();
    return false;
  }

  try {
    const audio = new Audio(source);
    audio.preload = 'auto';
    audio.volume = Math.min(1, Math.max(0, volume));
    const playResult = audio.play();
    if (playResult?.catch) {
      await playResult;
    }
    return true;
  } catch {
    markSourceFailure(source);
    fallback?.();
    return false;
  }
}

export async function playVoiceAsset(assetId, fallbackText = '', lang = 'pt-BR') {
  const definition = getAudioAssetDefinition(assetId);
  const text = fallbackText || definition?.fallbackText || '';
  const settings = loadAudioSettings();
  if (!settings.voiceEnabled || settings.masterVolume <= 0 || settings.voiceVolume <= 0) return false;

  stopSpeech();
  const played = await playAudioAsset(assetId, null);
  if (played) return true;
  return speakNatural(text, lang);
}

export function getAudioAssetRuntimeState() {
  return {
    resolvedSources: [...resolvedSources.keys()],
    failedSources: [...failedSources],
    pendingSources: [...preloadPromises.keys()],
  };
}

export function resetAudioAssetRuntimeState() {
  resolvedSources.clear();
  failedSources.clear();
  preloadPromises.clear();
}
