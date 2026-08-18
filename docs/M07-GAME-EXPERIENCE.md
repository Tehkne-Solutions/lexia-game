# Lexia M07 — Game Experience Foundation

**Tehkné Solutions**

## Goal

Turn Lexia from a collection of functional learning screens into one coherent game journey driven by the learner's real progress.

The Learning Engine remains responsible for pedagogy. M07 adds a game-experience layer that explains that pedagogy to the player as worlds, missions, next objectives and continuation actions.

## M07-A — Journey Engine — COMPLETE

A deterministic `Journey Engine` converts learner progress into a single recommended mission.

The canonical stage flow is:

1. Letters;
2. Simple syllables;
3. First words;
4. Mastery/free practice.

For a fresh account with zero progress, the Journey Engine delegates to the Learning Engine and returns:

- world: `alphabet`;
- mission: first discovery;
- target: `I`;
- path: `/play`;
- CTA: `Começar jornada`.

The Journey Engine does not replace FSRS or curriculum rules. It only exposes the recommended game-facing continuation state.

## M07-B — Mission-driven Welcome — COMPLETE

Welcome now:

- does not query private Supabase progress before authentication;
- uses the fresh-start mission for public visitors;
- loads real progress after authentication;
- shows the current mission, description and stage progress;
- routes the primary CTA to the Journey Engine recommendation;
- keeps free practice and secondary game areas available.

## M07-C — Journey-aware World Map — COMPLETE

World Map now shares the same Journey Engine state as Welcome:

- shows the recommended next destination;
- visually marks the current mission world;
- uses the Journey Engine path for the recommended world's Continue action;
- keeps optional/unlocked worlds available independently.

This prevents the home and map from giving contradictory progression guidance.

## M07-D — Guided PlayGame handoff — COMPLETE

The letter activity now consumes the same journey state:

- waits for learner progress to load before synchronizing a guided mission;
- returning learners start on the Journey Engine target instead of always resetting to `I`;
- practice mode remains independent from guided mission synchronization;
- mission context is visible inside the activity;
- the result state offers a direct handoff back to the journey map;
- AI fallback in Practice mode no longer persists progress.

## M07-E — Session Quest Loop — COMPLETE

Guided PlayGame sessions are now framed as short expeditions instead of an endless sequence of isolated exercises.

The first live quest is `Expedição das Letras`:

- goal: 3 successful persisted encounters;
- failed attempts do not advance the expedition;
- one drawing encounter can advance the quest at most once, even when a parent/learner corrects the AI judgment manually;
- the quest only summarizes stars already earned by the existing scoring system;
- no new FSRS weight, mastery threshold, currency or hidden score is introduced;
- Practice mode is excluded from the quest system.

PlayGame presents:

- a compact expedition progress bar;
- current checkpoints and stars earned during that session;
- a completion handoff with narrative feedback;
- `Voltar ao mapa` as the primary completion action;
- `Continuar treinando` as the optional continuation action.

When expedition completion and a combo celebration would happen on the same result, expedition completion takes presentation priority so overlays do not compete.

## M07-F — World Narrative & Relics — COMPLETE

The map now presents the learning progression as named story chapters instead of generic content tiers.

Canonical chapter layer:

1. **Capítulo I — O Bosque dos Símbolos** — letters;
2. **Capítulo II — As Pontes do Som** — simple syllables;
3. **Capítulo III — O Labirinto dos Encontros** — complex syllables;
4. **Capítulo IV — A Biblioteca Desperta** — first words;
5. **Capítulo V — O Jardim das Histórias** — sentences;
6. **Epílogo — A Torre da Maestria** — continued mastery.

Each chapter exposes a narrative briefing, completion text and one thematic relic. Relics are **derived rewards**, not a new economy:

- no relic row, inventory table or new backend field is created;
- no currency, purchase, loot roll or hidden score exists;
- a relic is considered unlocked only when the existing progress stats already prove the chapter's mastery condition;
- clearing data automatically removes the derived relic state because there is no independent relic persistence.

Current relic set:

- `Pena das 26 Vozes` — alphabet mastery;
- `Concha das Sílabas` — simple syllable mastery;
- `Bússola dos Encontros` — complex syllable chapter;
- `Chave das Primeiras Palavras` — first-word mastery;
- `Semente das Histórias` — sentence chapter;
- `Lanterna da Maestria` — letters + simple syllables + first words mastered.

Welcome and World Map consume the same world-experience engine. The Home announces the current chapter above the current mission; the map displays the active chapter briefing, each world's chapter identity, relic status and aggregate relic collection progress.

## M07-G — Game Shell & Mobile Visual QA — COMPLETE

The primary game journey now runs inside a shared dynamic-viewport shell rather than document-level `min-h-screen` layouts.

Shared shell rules:

- `100dvh` with `100vh` fallback;
- safe-area support for top and bottom device insets;
- no horizontal document overflow;
- bounded internal scrolling where content legitimately exceeds the viewport;
- short-height compact behavior;
- drawing surface capped by both desktop width and available dynamic viewport height.

Surface behavior:

- **Welcome:** one safe-area-aware viewport scroll surface; chapter, mission and primary journey CTA remain visible on the 360×640 short-mobile reference after entrance animations settle;
- **PlayGame:** HUD, mission and session quest remain stable while only the central activity region may scroll; the square drawing board scales to `min(260px, 42dvh, 100%)` so its actions remain reachable;
- **World Map:** header remains fixed in the game shell while chapter/world content scrolls only inside the map region.

### Real browser release evidence

M07-G adds a blocking Chrome/CDP browser gate that builds and serves the production Vite output and validates three viewport classes:

1. mobile-short — `360×640`;
2. mobile — `390×844`;
3. desktop — `1440×900`.

For each viewport the gate captures and measures:

- Welcome;
- PlayGame;
- World Map.

That produces **9 visual evidence screenshots per run**. The automated measurements verify shell/viewport parity, absence of horizontal overflow, bounded scrolling and square/responsive drawing geometry. Screenshots are captured only after entrance animations have settled and are uploaded as the `lexia-m07g-browser-layout` GitHub Actions artifact for visual review.

The final reviewed evidence confirms:

- mobile-short shows the chapter, current mission and `Começar jornada` CTA without mandatory scrolling;
- standard mobile exposes the complete primary Home navigation;
- PlayGame keeps its HUD, expedition state and drawing interaction usable across all three viewport classes;
- World Map preserves chapter, mission, relic state and first world card without page-level overflow;
- desktop remains stable while retaining the existing focused central game composition.

## Release contracts

The blocking Journey Engine contract covers:

- fresh start → letter `I`;
- letters complete → syllables;
- syllables complete → words;
- words complete → mastery/free practice;
- aggregate journey progress counts and stars;
- Welcome does not query private Supabase progress before authentication;
- Welcome primary CTA follows the Journey Engine;
- World Map highlights the same recommended world;
- PlayGame waits for progress and synchronizes the recommended target;
- Practice fallback cannot persist learner progress.

The blocking Session Quest contract covers:

- 3-checkpoint guided letter expeditions;
- failures do not advance a quest;
- duplicate encounter IDs cannot advance twice;
- only existing stars are summarized;
- completion occurs exactly at the configured goal;
- Practice mode cannot create or advance a guided session quest;
- PlayGame carries stable encounter identity through AI evaluation and manual correction;
- session progress and completion presentation remain connected to the guided activity.

The blocking World Experience contract covers:

- canonical chapter catalog and chapter-to-world mapping;
- fresh accounts start with locked chapter relics;
- existing mastery deterministically unlocks only the corresponding relics;
- the core completed journey derives alphabet, simple-syllable, first-word and mastery relics;
- Home and World Map consume the same active chapter source;
- the world-experience engine contains no platform persistence or parallel scoring path.

The blocking Game Shell contract covers:

- shared `100dvh` viewport primitives;
- safe areas;
- bounded scrolling on Welcome, PlayGame and World Map;
- removal of legacy document-level screen-height shells from those surfaces;
- responsive drawing-board geometry.

The blocking Browser Layout QA adds real Chrome validation and screenshot evidence on mobile-short, mobile and desktop.

Journey, Session Quest and World Experience engines remain in the blocking core typecheck. The inherited Base44-generated UI type debt remains separately visible as an advisory legacy typecheck.

## M07 final state

**M07-A through M07-G are complete.**

The Game Experience Foundation now provides one continuous path from fresh account → mission → guided activity → short expedition → world map → chapter narrative → derived relic reward, with responsive web behavior verified in a real browser.

The next macro-phase is **M08 — Curriculum Worlds Expansion**, focused on converting the currently placeholder advanced worlds into fully playable curriculum experiences while preserving the M07 journey contracts.

— Tehkné Solutions
