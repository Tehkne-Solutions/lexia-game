# Lexia M07 — Game Experience Foundation

**Tehkné Solutions**

## Goal

Turn Lexia from a collection of functional learning screens into one coherent game journey driven by the learner's real progress.

The Learning Engine remains responsible for pedagogy. M07 adds a game-experience layer that explains that pedagogy to the player as worlds, missions, next objectives and continuation actions.

## M07-A — Journey Engine

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

## M07-B — Mission-driven Welcome

Welcome now:

- does not query private Supabase progress before authentication;
- uses the fresh-start mission for public visitors;
- loads real progress after authentication;
- shows the current mission, description and stage progress;
- routes the primary CTA to the Journey Engine recommendation;
- keeps free practice and secondary game areas available.

## M07-C — Journey-aware World Map

World Map now shares the same Journey Engine state as Welcome:

- shows the recommended next destination;
- visually marks the current mission world;
- uses the Journey Engine path for the recommended world's Continue action;
- keeps optional/unlocked worlds available independently.

This prevents the home and map from giving contradictory progression guidance.

## Release contract

M07 adds a blocking Journey Engine contract covering:

- fresh start → letter `I`;
- letters complete → syllables;
- syllables complete → words;
- words complete → mastery/free practice;
- aggregate journey progress counts and stars.

The Journey Engine is included in the blocking core typecheck.

## Next slices

- M07-D: session/quest presentation inside the learning screen;
- M07-E: mission completion handoff back to the map/journey;
- M07-F: world-specific narrative and rewards without changing pedagogical scoring;
- M07-G: game-shell/mobile viewport refinement and visual QA.

— Tehkné Solutions
