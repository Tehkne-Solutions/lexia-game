# Lexia M08 — Curriculum Worlds Expansion

**Tehkné Solutions**

## Goal

M08 converts the two remaining placeholder worlds into real curriculum experiences and closes the first complete playable literacy journey.

The canonical progression is now:

1. **Mundo das Letras** — 26 letters;
2. **Sílabas Simples** — 20 mastery targets;
3. **Sílabas Complexas** — 20 mastery targets;
4. **Primeiras Palavras** — 20 mastery targets;
5. **Frases Mágicas** — 20 mastery targets;
6. **Torre da Maestria** — free continued practice after the five curriculum chapters are mastered.

M08 preserves the M07 rule that game presentation must explain the pedagogy rather than create a second scoring system.

## Progress namespaces

All curriculum families share the existing learner-progress entity while remaining distinguishable by canonical keys:

- letters: `A`…`Z`;
- simple syllables: `SYL_*`;
- complex syllables: `SYLC_*`;
- first words: `WORD_*`;
- sentences: `SENT_*`.

Letters continue to use the FSRS-based mastery score. Syllables, words and sentences use the existing repeated-success mastery contract:

- at least 3 correct attempts;
- at least 60% accuracy.

No schema migration or parallel progression table is introduced.

## Chapter III — Sílabas Complexas

The former placeholder is now playable at:

`/play-syllables?mode=complex`

The experience reuses the proven typed-learning interaction while giving it a dedicated catalog, persistence namespace and chapter identity.

### Canonical catalog

Exactly 20 advanced combinations are mastery targets:

`BRA, BRE, BRI, BRO, CRA, CRE, CRI, CRO, DRA, FRA, FRE, FRI, GRA, GRE, GRI, PRA, PRE, TRA, TRE, TRI`

Every target has a concrete Portuguese anchor word and visual cue.

Examples:

- `BRA` → Braço;
- `CRI` → Criança;
- `DRA` → Dragão;
- `GRI` → Grilo;
- `TRA` → Trator;
- `TRI` → Trilho.

### Session loop

The chapter uses `Expedição dos Encontros`:

- 4 successful persisted encounters;
- failed attempts do not advance the expedition;
- stars are only the stars already granted by the existing learning result;
- completion returns to the same M07 session handoff architecture.

## Chapter V — Frases Mágicas

The former placeholder is now playable at:

`/play-sentences`

It intentionally uses a dedicated mechanic rather than forcing full sentences through the alphabet keyboard.

### Interaction

For each challenge:

1. the learner receives an illustration and short spoken/text clue;
2. the words of the sentence are shuffled;
3. the learner taps words in the intended order;
4. selected words can be removed to revise the sequence;
5. verification checks the assembled sentence against the canonical target;
6. incorrect order receives corrective feedback without revealing a parallel score;
7. correct completion grants the same existing one-star success reward and persists `SENT_*` progress.

### Canonical catalog

There are exactly 20 short targets designed for mobile early-literacy interaction.

Examples:

- `O GATO DORME`;
- `A BOLA ROLA`;
- `O PATO NADA`;
- `A LUA BRILHA`;
- `O SAPO PULA`;
- `A CRIANÇA BRINCA`;
- `O DRAGÃO VOA`;
- `A ESTRELA BRILHA`.

The catalog keeps sentence length at 3–4 words so the full construction interaction remains legible on small screens.

### Session loop

The chapter uses `Expedição das Histórias`:

- 4 successful persisted sentences;
- unique encounter identity prevents accidental double progress;
- no new currency or hidden score;
- the same Session Quest completion handoff returns the learner to the world journey.

## Complete Journey Engine

The Journey Engine now expresses the full sequence:

`LETTERS → SYLLABLES → COMPLEX_SYLLABLES → WORDS → SENTENCES → MASTERY`

Canonical paths:

- Letters → `/play`;
- Simple Syllables → `/play-syllables`;
- Complex Syllables → `/play-syllables?mode=complex`;
- First Words → `/play-syllables?mode=words`;
- Sentences → `/play-sentences`;
- Mastery → `/play?mode=practice`.

Welcome and World Map continue to consume the same Journey Engine state, so the primary CTA, highlighted world and actual activity route cannot intentionally diverge.

## World unlock semantics

M08 fixes an earlier unlock flaw where 100% letter mastery could satisfy the old `1.0` letter-mastery threshold for several later worlds at once.

The rules are now:

- **Mundo das Letras:** always available;
- **Sílabas Simples:** existing early unlock — 100 stars, 70% letter mastery, or previous world completion;
- **Sílabas Complexas:** previous world complete or 200 stars;
- **Primeiras Palavras:** previous world complete or 150 stars;
- **Frases Mágicas:** previous world complete or 300 stars.

This keeps the existing star-based freedom while restoring a meaningful sequential curriculum path.

## Statistics and relics

`buildStats()` now reports independent mastery for:

- simple syllables;
- complex syllables;
- words;
- sentences.

The World Map uses mastery, not merely first exposure, for world completion.

Derived relics remain persistence-free:

- `Pena das 26 Vozes` — letters;
- `Concha das Sílabas` — simple syllables;
- `Bússola dos Encontros` — complex syllables;
- `Chave das Primeiras Palavras` — first words;
- `Semente das Histórias` — sentences;
- `Lanterna da Maestria` — all five curriculum chapters mastered.

The mastery relic no longer unlocks before complex syllables and sentences are complete.

## Release gates

M08 extends the blocking release suite with `Curriculum worlds contract`, validating:

- exact complex-syllable catalog size and uniqueness;
- exact sentence catalog size and canonical word order;
- mobile-friendly sentence length;
- progress namespaces;
- actual play routes;
- sequential unlock behavior and star bypasses;
- complex/sentence expedition configuration;
- Journey Engine progression into the new stages;
- new progress-stat families;
- application route registration.

The existing Journey and World Experience contracts were also expanded to require the full five-world journey and all six derived relics.

The blocking core typecheck now includes the advanced curriculum catalogs and World Map unlock rules.

## Real browser evidence

M08 expands the Chrome/CDP release gate to **five surfaces across three viewport classes**:

### Viewports

1. mobile-short — `360×640`;
2. mobile — `390×844`;
3. desktop — `1440×900`.

### Surfaces

1. Welcome;
2. PlayGame;
3. World Map;
4. Sílabas Complexas;
5. Frases Mágicas.

This produces **15 screenshots per CI run** in the `lexia-m08-curriculum-browser-layout` artifact.

The gate verifies:

- dynamic viewport parity;
- no horizontal document overflow;
- bounded internal scrolling;
- the M07 drawing geometry contract;
- presence of both advanced worlds on the map;
- correct advanced-world title and expedition presentation.

### Reviewed evidence

The approved M08 evidence confirms:

- **360×640 Complex Syllables:** header, chapter, expedition progress, mascot prompt, target, three-letter answer slots, full on-screen keyboard and `Verificar` remain usable in one bounded game surface;
- **360×640 Frases Mágicas:** header, expedition, mascot, visual clue, spoken clue, assembly area, all sentence tokens and `Verificar frase` remain reachable without horizontal collision;
- standard mobile preserves additional breathing room with the same information hierarchy;
- desktop keeps the focused central learning composition;
- World Map renders the expanded chapter journey without page-level overflow.

## M08 result

The first curriculum journey is no longer partially placeholder-driven. Every canonical chapter on the World Map now has a real learning route, real progress family and real mastery condition.

M08 does not require legacy-data migration because Lexia remains on the approved Fresh Start baseline.

The next macro-phase should focus on **production-runtime readiness and learner/parent operational validation**, while continuing to evolve content depth without breaking the complete journey established here.

— Tehkné Solutions
