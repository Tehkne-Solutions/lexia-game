# Lexia M12 — Whole-Journey Parent Insights

**Tehkné Solutions**

## Goal

M12 aligns the parent experience with the complete literacy journey already established by M08.

Before M12, the Parent Dashboard still summarized attempts, accuracy, streak and weekly recommendations almost entirely from one-character letter records. That became conceptually stale once the playable curriculum expanded to:

1. **Mundo das Letras** — 26 targets;
2. **Sílabas Simples** — 20 targets;
3. **Sílabas Complexas** — 20 targets;
4. **Primeiras Palavras** — 20 targets;
5. **Frases Mágicas** — 20 targets.

M12 keeps the existing learning rules intact and changes only the parent-facing interpretation/presentation layer.

## Canonical parent journey

`src/game/parentInsightsEngine.js` is the provider-neutral parent insight layer.

It mirrors the five curriculum families and their existing persistence namespaces:

- letters: `A`…`Z`;
- simple syllables: `SYL_*`;
- complex syllables: `SYLC_*`;
- words: `WORD_*`;
- sentences: `SENT_*`.

The total canonical journey therefore contains **106 mastery targets**.

No new persistence entity or score is introduced.

## Mastery semantics remain unchanged

M12 does not reinterpret learning success:

- letters remain mastered at FSRS mastery `>= 80`;
- syllables, words and sentences remain mastered after at least 3 correct attempts with at least 60% accuracy.

The parent engine consumes those existing rules to summarize progress; it does not write progress and does not influence scheduling.

## Whole-journey metrics

The Parent Dashboard now reports:

- total stars across all curriculum records;
- **Precisão geral** across every practiced curriculum family;
- total mastered targets out of `106`;
- completed curriculum chapters out of `5`;
- maximum streak across the whole practiced journey;
- total attempts across the whole practiced journey.

This explicitly retires the previous behavior where global-looking accuracy, attempts and streak were calculated from letter records only.

## Chapter overview

The new **Jornada de Alfabetização** panel shows all five chapters in canonical order.

Each chapter reports:

- mastered / total targets;
- percent mastered;
- targets started;
- chapter-specific accuracy;
- completion state.

The current mission is sourced from the same `Journey Engine` used by Welcome and World Map, preventing a separate parent-only interpretation of where the learner should continue.

## Parent recommendations

The **Próximo foco em casa** block derives simple, non-punitive recommendations from:

- current Journey Engine stage;
- remaining targets in that chapter;
- whole-journey accuracy;
- total practice volume;
- maximum streak.

Recommendations support practice decisions but do not create rewards, penalties or a second pedagogy engine.

## Weekly report

The parent e-mail is now **Relatório de Jornada — Lexia Game** rather than an alphabet-only weekly report.

It includes:

- overall mastered targets and completion percentage;
- chapters completed;
- stars;
- whole-journey accuracy;
- streak and attempt totals;
- one line for each of the five curriculum chapters;
- current Journey Engine mission;
- the same parent recommendations visible in the dashboard.

Recipient security is unchanged: the platform e-mail adapter still restricts delivery to the authenticated account in the Supabase release path.

## Letter detail preserved

M12 does not remove useful diagnostic detail from the original dashboard.

The letter grid and per-letter mastery chart remain available under **Detalhe do Mundo das Letras**. They are now presented as chapter-specific diagnostics rather than as if they represented the entire literacy journey.

## Blocking contract

`Parent journey insights contract` validates:

- exactly 106 canonical targets across five chapters;
- empty Fresh Start behavior;
- whole-curriculum attempts/correct/accuracy/streak aggregation;
- strict separation of `SYL_*` and `SYLC_*`;
- complete 106/106 journey → five chapters complete → Journey Engine mastery state;
- full five-chapter weekly report;
- Parent Dashboard consumption of the parent engine;
- retirement of the old letters-only inline metrics/report logic.

## Real browser evidence

The existing production-build Chrome/CDP QA expands from 5 to **6 surfaces** across the same three viewport classes:

### Viewports

1. mobile-short — `360×640`;
2. mobile — `390×844`;
3. desktop — `1440×900`.

### Surfaces

1. Welcome;
2. PlayGame;
3. World Map;
4. Sílabas Complexas;
5. Frases Mágicas;
6. **Área dos Pais**.

This produces **18 screenshots** in `lexia-m12-browser-layout`.

For the Parent Dashboard, the browser gate requires:

- `Jornada de Alfabetização`;
- `Precisão geral`;
- `Sílabas Complexas`;
- `Frases Mágicas`;
- no page-level horizontal overflow in any viewport.

## Release boundary

M12 is independent of the external Supabase cutover blocker tracked by the operational release issue. It does not change providers, Auth, schema, secrets, Vercel configuration or M09–M11 release semantics.

Fresh Start remains canonical: no historical learner history is migrated.

— Tehkné Solutions
