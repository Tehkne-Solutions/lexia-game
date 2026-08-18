# Lexia M14 — Journey Collectibles

**Tehkné Solutions**

## Goal

M14 aligns the learner collection system with the complete literacy journey.

Before M14, the Profile album contained:

- 26 letter stickers;
- 8 milestone stickers;
- a footer that told the learner to master letters to earn more.

At the same time, the World Experience system already defined six canonical relics tied to the five curriculum chapters plus mastery. Those relics appeared in journey progress but were absent from the collectible album.

M14 unifies those surfaces without replacing the existing alphabet collection.

## Canonical relic source

`worldExperienceEngine.js` remains the only owner of chapter/relic unlock rules.

M14 adds `getWorldRelics(stats)`, which exposes all six relics with their canonical unlocked state:

1. **Pena das 26 Vozes** — Capítulo I;
2. **Concha das Sílabas** — Capítulo II;
3. **Bússola dos Encontros** — Capítulo III;
4. **Chave das Primeiras Palavras** — Capítulo IV;
5. **Semente das Histórias** — Capítulo V;
6. **Lanterna da Maestria** — Epílogo.

`getUnlockedWorldRelics()` and `getWorldRelicProgress()` now derive from that full catalog, preserving their existing semantics.

## Journey collectible engine

`journeyCollectiblesEngine.js` converts the canonical relic catalog into presentation-neutral collectible records.

It adds only visual identity:

- emoji;
- short display name;
- category `journey`.

It does **not** duplicate any mastery threshold. Unlock state comes directly from `getWorldRelics(stats)`.

## Collection structure

The Profile album is reorganized into three sections:

### Relíquias da Jornada

Six larger cards show one chapter relic each. On Fresh Start they remain locked; mastering the corresponding chapter reveals the canonical relic name, visual and description.

### Álbum do Alfabeto

All 26 existing per-letter stickers remain unchanged and continue unlocking from individual letter mastery.

### Marcos da Aventura

All 8 existing milestone stickers remain available. Alphabet-count milestones remain alphabet-specific, while streak/star milestones use the whole-journey statistics established by M13.

Total collection size: **40 items**.

## Visual direction

M14 removes the previous gradient treatment from the collection cards and uses flat game surfaces, borders and hierarchy instead.

The Fresh Start collection therefore reads as a map of future discoveries rather than an alphabet-only sticker grid.

## Blocking contract

`Journey collectibles contract` verifies:

- exactly six canonical relic collectibles;
- Fresh Start unlock count `0/6`;
- sequential chapter unlock behavior;
- complete curriculum unlocks all six relics;
- collectible unlock state exactly matches the World Experience relic state;
- no mastery thresholds are duplicated in the collectibles engine;
- existing letter/milestone sticker systems remain integrated;
- the album exposes the three canonical sections;
- the obsolete “Domine letras para ganhar mais!” framing stays retired;
- collection cards do not reintroduce gradient styling.

## Real browser evidence

The production-build Chrome/CDP regression suite expands to **8 states × 3 viewports = 24 screenshots**.

For each viewport, after capturing the normal Profile, the browser clicks the existing `Adesivos` tab and requires:

- `Relíquias da Jornada`;
- `Álbum do Alfabeto`;
- `Marcos da Aventura`;
- Fresh Start count `0/40 itens colecionados`;
- no document-level horizontal overflow.

Artifact: `lexia-m14-browser-layout`.

## Release boundary

M14 is a derived presentation/collection change only. It does not change:

- curriculum mastery thresholds;
- FSRS scheduling;
- progress persistence keys;
- Supabase schema/Auth/provider;
- Fresh Start;
- M09–M11 release controls.

No legacy learner history is migrated.

— Tehkné Solutions
