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

Journey and Session Quest engines are included in the blocking core typecheck.

## Next slices

- M07-F: world-specific narrative and rewards without changing pedagogical scoring;
- M07-G: game-shell/mobile viewport refinement and visual QA.

— Tehkné Solutions
