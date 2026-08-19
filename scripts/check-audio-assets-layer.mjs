import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AUDIO_ASSET_IDS,
  AUDIO_ASSET_KIND,
  AUDIO_ASSET_MANIFEST,
  getAudioAssetDefinition,
  listAudioAssets,
} from '../src/audio/audioAssetManifest.js';

const assets = listAudioAssets();
assert.equal(assets.length, Object.keys(AUDIO_ASSET_MANIFEST).length, 'manifest listing must expose every registered asset');
assert.ok(assets.length >= 8, 'M34-B must register the core SFX set and canonical voice preview');
assert.equal(listAudioAssets(AUDIO_ASSET_KIND.SFX).length, 7, 'core SFX family must remain complete');
assert.equal(listAudioAssets(AUDIO_ASSET_KIND.VOICE).length, 1, 'M34-B must expose the initial canonical voice asset');

const ids = assets.map((asset) => asset.id);
assert.equal(new Set(ids).size, ids.length, 'audio asset IDs must be unique');
const sources = assets.flatMap((asset) => asset.sources || []);
assert.equal(new Set(sources).size, sources.length, 'audio source paths must be unique');
for (const asset of assets) {
  assert.equal(getAudioAssetDefinition(asset.id)?.id, asset.id, `manifest lookup must resolve ${asset.id}`);
  assert.ok(asset.sources?.length >= 2, `${asset.id} must provide at least two real-file formats`);
  assert.ok(asset.sources[0].endsWith('.ogg'), `${asset.id} should prefer OGG`);
  assert.ok(asset.sources.some((source) => source.endsWith('.mp3')), `${asset.id} must include MP3 fallback`);
}
assert.match(getAudioAssetDefinition(AUDIO_ASSET_IDS.VOICE_OWL_PREVIEW).fallbackText, /Corujinha/);

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
  clear: () => memory.clear(),
};

let audioConstructs = 0;
class FailingAudio {
  constructor(source = '') {
    audioConstructs += 1;
    this.src = source;
    this.volume = 1;
    this.preload = '';
    this.oncanplaythrough = null;
    this.onloadeddata = null;
    this.onerror = null;
  }
  load() {
    queueMicrotask(() => this.onerror?.(new Error('missing asset')));
  }
  play() {
    return Promise.reject(new Error('missing asset'));
  }
}
globalThis.Audio = FailingAudio;

const {
  getAudioAssetRuntimeState,
  playAudioAsset,
  playVoiceAsset,
  preloadAudioAsset,
  resetAudioAssetRuntimeState,
} = await import('../src/audio/audioAssetPlayer.js');

resetAudioAssetRuntimeState();
let fallbackCount = 0;
const first = await playAudioAsset(AUDIO_ASSET_IDS.SFX_CLICK, () => { fallbackCount += 1; });
assert.equal(first, false, 'missing produced SFX must fall back instead of throwing');
assert.equal(fallbackCount, 1, 'SFX fallback must run exactly once');
assert.equal(audioConstructs, 2, 'first missing SFX must probe OGG then MP3 exactly once');
assert.equal(getAudioAssetRuntimeState().failedSources.length, 2, 'failed sources must be cached for the session');

const constructsAfterFirstFailure = audioConstructs;
await playAudioAsset(AUDIO_ASSET_IDS.SFX_CLICK, () => { fallbackCount += 1; });
assert.equal(audioConstructs, constructsAfterFirstFailure, 'known missing sources must not be re-probed on every click');
assert.equal(fallbackCount, 2, 'fallback remains available after failures are cached');
assert.equal(await preloadAudioAsset('missing.asset.id'), false, 'unknown asset IDs must fail closed');

memory.set('lexia.audio.v1', JSON.stringify({ masterVolume: 1, sfxVolume: 0.8, voiceVolume: 1, voiceEnabled: false }));
const voiceDisabled = await playVoiceAsset(AUDIO_ASSET_IDS.VOICE_OWL_PREVIEW);
assert.equal(voiceDisabled, false, 'disabled narration must not probe or speak a voice asset');

const playerSource = await readFile(new URL('../src/audio/audioAssetPlayer.js', import.meta.url), 'utf8');
assert.ok(playerSource.includes('failedSources'), 'asset player must cache failed paths');
assert.ok(playerSource.includes('preloadPromises'), 'asset player must deduplicate concurrent preload work');
assert.ok(playerSource.includes('speakNatural'), 'voice assets must retain natural speech fallback');

const soundsSource = await readFile(new URL('../src/lib/sounds.js', import.meta.url), 'utf8');
assert.ok(soundsSource.includes('playAudioAsset'), 'legacy SFX API must prefer produced assets');
for (const idName of ['SFX_CLICK', 'SFX_CORRECT', 'SFX_WRONG', 'SFX_CELEBRATION', 'SFX_DRAW', 'SFX_STAR', 'SFX_LEVEL_UP']) {
  assert.ok(soundsSource.includes(`AUDIO_ASSET_IDS.${idName}`), `sounds API must route ${idName} through canonical asset IDs`);
}

const packReadme = await readFile(new URL('../public/audio/README.md', import.meta.url), 'utf8');
assert.match(packReadme, /Tehkné Solutions/);
assert.match(packReadme, /OGG\/Vorbis/);
assert.match(packReadme, /fallback/i);

console.log('Lexia M34-B Audio Assets Layer contract: PASS (canonical manifest, asset-first SFX, cached missing-file fallback, voice-ready layer)');
