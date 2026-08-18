# Lexia M13 — Learner Journey Profile

**Tehkné Solutions**

## Goal

M13 aligns the learner-facing Profile with the complete five-chapter literacy journey already represented by Welcome, World Map and the M12 Parent Dashboard.

Before M13, the Profile still presented a global-looking stat row where:

- the trophy metric was `Letras`;
- accuracy was calculated only from letter records;
- maximum streak was calculated only from letter records;
- attempts used by achievements were calculated only from letter records.

That became stale after the curriculum expanded to simple syllables, complex syllables, words and sentences.

## Global stats now mean the whole journey

`buildStats(allProgress)` now computes these global values across every persisted curriculum record:

- `totalAttempts`;
- `totalCorrect`;
- `accuracy`;
- `maxStreak`;
- `totalStars`.

The change also preserves explicit alphabet-only diagnostics:

- `letterAttempts`;
- `letterCorrect`;
- `letterAccuracy`;
- `letterMaxStreak`.

This keeps letter-specific pedagogical depth without mislabeling it as the learner's overall performance.

## Profile journey identity

The Profile now consumes the same canonical journey summary used by M12 and the shared Journey/World Experience engines.

Above the stat row it shows:

- active chapter and authored world title;
- current mission title and description;
- mission-local progress;
- total mastered targets out of `106`;
- completed chapters out of `5`;
- unlocked world relics.

The trophy stat is now **Jornada**, showing mastered targets / `106`.

Accuracy and streak in the top row are whole-journey values.

## Letter detail remains intentional

The `🔤 Letras` tab remains available and still shows:

- 26-letter mastery history;
- FSRS mastery state per letter;
- chapter-specific `letterAccuracy`;
- chapter-specific `letterAttempts`.

M13 therefore does not flatten all learning into one aggregate. It distinguishes correctly between:

- learner-level journey identity;
- chapter-specific diagnosis.

## Existing identity systems preserved

M13 keeps:

- avatar selection/unlocks;
- Corujinha customization;
- sticker album;
- existing achievement badges;
- daily challenge marker;
- level progression from collected stars;
- account deletion control.

The Profile tab strip becomes horizontally scrollable to preserve touch-target size instead of compressing five tabs into narrow mobile buttons.

## Achievement semantics

Existing `accuracy_80`, `attempts_50`, streak and star achievements now use true whole-journey global stats because those achievements are phrased as general learner performance.

Alphabet-specific achievements continue to use `masteredCount` / `lettersMastered` and therefore remain alphabet-specific.

No achievement IDs are removed or reinterpreted as curriculum unlock requirements.

## Blocking contract

`Learner journey profile contract` verifies:

- mixed letter + later-curriculum attempts are included in global attempts;
- global accuracy includes all practiced curriculum entities;
- global max streak includes all curriculum entities;
- alphabet-only diagnostics remain independently available;
- learner and parent views agree on whole-journey accuracy/streak;
- Profile uses the 106-target journey summary;
- Profile shows active chapter and relic progress;
- top trophy no longer labels letters as the whole journey;
- `🔤 Letras` detail remains present;
- mobile tabs retain usable width through horizontal scrolling.

## Real browser evidence

The production-build Chrome/CDP regression suite expands to **7 surfaces × 3 viewports = 21 screenshots**.

The new Profile surface is validated at:

- 360×640;
- 390×844;
- 1440×900.

The Profile browser proof requires:

- `Meu Perfil`;
- current Journey Engine mission (`Primeira descoberta` on Fresh Start);
- `Jornada`;
- relic progress text;
- no document-level horizontal overflow.

Artifact: `lexia-m13-browser-layout`.

## Release boundary

M13 changes presentation/stat aggregation only. It does not change:

- persistence keys;
- FSRS scheduling;
- mastery thresholds;
- Supabase schema;
- Auth/provider behavior;
- M09–M11 release controls;
- Fresh Start policy.

No legacy learner history is migrated.

— Tehkné Solutions
