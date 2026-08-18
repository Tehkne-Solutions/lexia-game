# Lexia Learning Engine 2.0 — M02

**Tehkné Solutions**

## Goal

Unify the explicit pedagogical progression from the original repository with the broader Base44 game without reducing the current 26-letter, syllable, word, world-map or gamification scope.

## Architecture

The learning engine is intentionally separate from UI and persistence:

- `src/learning/curriculum.js` owns pedagogical phases, ordering and unlock policy.
- `src/learning/engine.js` composes curriculum state with the existing FSRS mastery calculation.
- `src/lib/alphabetData.js` remains the full A-Z presentation catalog and receives curriculum metadata.
- practice/manual selection may still expose all letters; guided progression uses the adaptive learning sequence.
- daily challenges are restricted to letters already unlocked by the guided curriculum.

## Curriculum phases

1. Vogais e Traços Essenciais — I, U, E, A, O
2. Curvas e Formas Básicas — C, P, B, D
3. Consoantes Frequentes — L, T, S, R
4. Formas Combinadas — M, N, F, V
5. Sons e Formas Avançadas — G, J, H, Q, X, Z
6. Alfabeto Estendido — K, W, Y

The original repository's anchor words and legacy levels are retained as metadata where they existed. Missing letters are completed using the Base44 A-Z catalog instead of being dropped.

## Adaptive selection priority

Guided next-letter selection follows this order:

1. overdue FSRS reviews inside unlocked phases;
2. struggling unlocked letters;
3. the next unstarted letter in pedagogical order;
4. lowest-mastery unlocked review pool.

Syllable and word progress records are explicitly excluded from letter scheduling.

## Phase advancement

A phase advances when either:

- at least 60% of its letters reach 80% mastery; or
- at least 80% were attempted and phase average mastery reaches 65%.

This keeps progression adaptive instead of requiring every letter to be perfect before novelty appears.

## Verification

`scripts/check-learning-engine.mjs` asserts full A-Z coverage, unique curriculum ordering, phase-1 startup, phase advancement, guided next-letter behavior and daily-challenge candidate behavior.

— Tehkné Solutions
