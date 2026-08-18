# Lexia M04-D/E — Portable Progress Migration

**Tehkné Solutions**

## Goal

Make learner progress portable between Base44 and the independent provider without carrying vendor-specific identifiers into the destination, while handling mixed anonymous/authenticated source ownership safely.

## Snapshot format

A snapshot has the stable envelope:

```json
{
  "schema": "lexia-progress-snapshot",
  "version": 1,
  "sourceProvider": "base44",
  "exportedAt": "2026-08-18T12:00:00.000Z",
  "records": []
}
```

The snapshot intentionally strips provider-owned fields such as record IDs, user IDs, creator IDs and provider timestamps. The authenticated destination account determines ownership during import.

## Portable record fields

Only Lexia domain state is retained:

- child display name;
- letter/syllable/word progress key;
- FSRS stability, difficulty, interval, repetitions and next review;
- attempts, correct attempts and streak;
- last grade;
- stars and level.

Keys such as `A`, `SYL_BA` and `WORD_CASA` remain valid, so migration covers the full game rather than letters only.

## Ownership reconciliation

Base44 source history can contain multiple ownership buckets, including `anonymous` and registered accounts. M04-E adds an explicit reconciliation stage before the portable snapshot is created.

The migration operator must provide `selectedOwnerRefs`. The reconciler never assumes anonymous history belongs to a registered account. When explicitly selected owner buckets contain the same progress key, the stronger record is retained using the same conservative progress comparison used during destination import.

Provider owner references are used only during reconciliation and are removed from the resulting snapshot.

## Destination import policy

Import matches destination records by normalized progress key.

Default behavior is conservative:

1. missing destination record → create;
2. incoming record stronger than destination → update;
3. destination equal or stronger → skip;
4. `force=true` explicitly overrides the conservative rule.

Strength is compared by attempts, repetitions, stars, correct attempts, streak, stability and level, in that order.

## Security and privacy

Portable snapshots contain no provider user ID, authentication token or e-mail address. Import always uses the currently authenticated destination platform account.

## Operational sequence

When a real Supabase project is connected:

1. audit Base44 ownership buckets;
2. explicitly confirm source-owner-to-destination-user mapping;
3. reconcile selected source ownership buckets;
4. generate and validate the portable snapshot;
5. authenticate as the destination learner or execute an approved administrative migration path;
6. import and reconcile create/update/skip counts;
7. retain the original snapshot as rollback evidence until cohort validation is complete.

— Tehkné Solutions
