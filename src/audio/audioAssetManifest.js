export const AUDIO_ASSET_KIND = Object.freeze({
  SFX: 'sfx',
  VOICE: 'voice',
});

export const AUDIO_ASSET_IDS = Object.freeze({
  SFX_CLICK: 'sfx.click',
  SFX_CORRECT: 'sfx.correct',
  SFX_WRONG: 'sfx.wrong',
  SFX_CELEBRATION: 'sfx.celebration',
  SFX_DRAW: 'sfx.draw',
  SFX_STAR: 'sfx.star',
  SFX_LEVEL_UP: 'sfx.level-up',
  VOICE_OWL_PREVIEW: 'voice.owl.preview',
});

export const AUDIO_ASSET_MANIFEST = Object.freeze({
  [AUDIO_ASSET_IDS.SFX_CLICK]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_CLICK,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/ui-click.ogg', '/audio/sfx/ui-click.mp3']),
  }),
  [AUDIO_ASSET_IDS.SFX_CORRECT]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_CORRECT,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/correct.ogg', '/audio/sfx/correct.mp3']),
  }),
  [AUDIO_ASSET_IDS.SFX_WRONG]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_WRONG,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/wrong.ogg', '/audio/sfx/wrong.mp3']),
  }),
  [AUDIO_ASSET_IDS.SFX_CELEBRATION]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_CELEBRATION,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/celebration.ogg', '/audio/sfx/celebration.mp3']),
  }),
  [AUDIO_ASSET_IDS.SFX_DRAW]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_DRAW,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/draw-soft.ogg', '/audio/sfx/draw-soft.mp3']),
  }),
  [AUDIO_ASSET_IDS.SFX_STAR]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_STAR,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/star.ogg', '/audio/sfx/star.mp3']),
  }),
  [AUDIO_ASSET_IDS.SFX_LEVEL_UP]: Object.freeze({
    id: AUDIO_ASSET_IDS.SFX_LEVEL_UP,
    kind: AUDIO_ASSET_KIND.SFX,
    sources: Object.freeze(['/audio/sfx/level-up.ogg', '/audio/sfx/level-up.mp3']),
  }),
  [AUDIO_ASSET_IDS.VOICE_OWL_PREVIEW]: Object.freeze({
    id: AUDIO_ASSET_IDS.VOICE_OWL_PREVIEW,
    kind: AUDIO_ASSET_KIND.VOICE,
    sources: Object.freeze(['/audio/voice/pt-BR/corujinha-preview.ogg', '/audio/voice/pt-BR/corujinha-preview.mp3']),
    fallbackText: 'Olá! Eu sou a Corujinha. Vamos aprender juntos?',
  }),
});

export function getAudioAssetDefinition(assetId) {
  return AUDIO_ASSET_MANIFEST[assetId] || null;
}

export function listAudioAssets(kind = null) {
  const assets = Object.values(AUDIO_ASSET_MANIFEST);
  return kind ? assets.filter((asset) => asset.kind === kind) : assets;
}
