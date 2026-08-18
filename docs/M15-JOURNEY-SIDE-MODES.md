# Lexia M15 — Journey Side Modes

**Tehkné Solutions**

## Goal

M15 aligns the two optional gameplay modes with the five-chapter literacy journey without turning them into duplicate copies of the main curriculum activities.

Before M15:

- Story Mode unlocked every chapter from `lettersMastered` only;
- its copy said that every story unlocked by mastering more letters;
- Speed Challenge always mixed letters + simple syllables regardless of learner progress;
- its record did not distinguish an easy early pool from a later harder pool;
- Speed Challenge still used gradient CTA styling that no longer matches the consolidated game direction.

## One progression truth

`sideModesEngine.js` derives access from the canonical World Experience relic catalog.

It does not hardcode chapter mastery thresholds.

The same relic rules therefore drive:

- World Map / World Experience;
- Profile relic progress;
- M14 Journey Collectibles;
- M15 storybook unlocks;
- M15 Speed Challenge tiers.

## Biblioteca da Jornada

Story Mode becomes a six-book narrative library:

1. **Capítulo I — O Bosque dos Símbolos** — available on Fresh Start;
2. **Capítulo II — As Pontes do Som** — unlocks after `Pena das 26 Vozes`;
3. **Capítulo III — O Labirinto dos Encontros** — unlocks after `Concha das Sílabas`;
4. **Capítulo IV — A Biblioteca Desperta** — unlocks after `Bússola dos Encontros`;
5. **Capítulo V — O Jardim das Histórias** — unlocks after `Chave das Primeiras Palavras`;
6. **Epílogo — A Torre da Maestria** — unlocks after `Semente das Histórias`.

Each book contains five short read-aloud pages and uses the existing speech system.

The stories reinforce the meaning of each curriculum world but do not write progress or replace the learning missions.

## Adaptive Speed Challenge

The 60-second challenge now grows with the learner's journey.

### Tier 1 — Letras

Always available. Fresh Start pool contains exactly the 26 alphabet targets.

### Tier 2 — Sílabas simples

Added after the alphabet relic unlocks.

### Tier 3 — Sílabas complexas

Added after the simple-syllable relic unlocks.

### Tier 4 — Primeiras palavras

Added after the complex-syllable relic unlocks.

The pool is cumulative, so later learners still rehearse earlier knowledge while receiving harder targets.

## Why sentences remain outside Speed Challenge

Sentence mastery in Lexia is about **word order and composition**, not merely typing characters quickly.

The existing on-screen speed keyboard has no space/composition mechanic. M15 therefore keeps sentence practice in `/play-sentences` rather than degrading it into a technically convenient but pedagogically weaker speed task.

## Fair records

Speed Challenge best scores are now stored per unlocked-pool identity.

Examples:

- letters-only record;
- letters + simple syllables record;
- letters + simple + complex syllables record;
- full speed pool through first words.

This avoids comparing a 60-second alphabet-only score against a later run containing longer words.

## Visual direction

Speed Challenge CTAs and status surfaces use flat game UI rather than gradient buttons.

Story Mode uses the same restrained card/border hierarchy as the current Journey/Profile surfaces.

## Blocking contract

`Journey side modes contract` verifies:

- six canonical storybooks;
- story unlock metadata references relic IDs, not letter/mastery counters;
- Fresh Start exposes exactly 1/6 storybooks;
- sequential canonical relic progression unlocks 2/6 → 6/6;
- Fresh Start Speed pool is exactly 26 letters and 1/4 tiers;
- alphabet mastery adds simple syllables;
- simple-syllable mastery adds complex syllables;
- complex-syllable mastery adds first words;
- sentence composition remains delegated to `/play-sentences`;
- no mastery thresholds are duplicated inside the side-mode engine;
- Story Mode no longer claims every story depends on letters;
- Speed Challenge no longer hardcodes the old two-type copy or gradient CTAs.

## Browser evidence

M15 keeps the complete M14 24-screenshot regression gate and adds an isolated side-mode browser gate:

- Story Mode × 3 viewports;
- Speed Challenge ready state × 3 viewports.

The combined artifact contains **30 screenshots**.

### Story Fresh Start proof

Requires:

- `Biblioteca da Jornada`;
- `Histórias que acompanham seus mundos`;
- `1/6 livros`;
- locked next-book prerequisite `Pena das 26 Vozes`;
- no horizontal overflow.

### Speed Fresh Start proof

Requires:

- `Desafio Relâmpago!`;
- `Treino atual`;
- `Até Letras`;
- `1/4` tiers;
- explicit sentence-composition guidance;
- no horizontal overflow.

Artifact: `lexia-m15-browser-layout`.

## Release boundary

M15 changes derived optional gameplay only. It does not change:

- canonical curriculum progress;
- mastery thresholds;
- FSRS scheduling;
- persistence schema;
- Supabase Auth/provider;
- Fresh Start;
- M09–M11 release controls.

No legacy learner history is migrated.

— Tehkné Solutions
