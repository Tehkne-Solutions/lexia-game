# Lexia M04-D — Portable Progress Migration

**Tehkné Solutions**

## Goal

Make learner progress portable between Base44 and the independent provider without carrying vendor-specific identifiers into the destination.

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

## Import policy

Import matches destination records by normalized progress key.

Default behavior is conservative:

1. missing destination record → create;
2. incoming record stronger than destination → update;
3. destination equal or stronger → skip;
4. `force=true` explicitly overrides the conservative rule.

Strength is compared by attempts, repetitions, stars, correct attempts, streak, stability and level, in that order. This is designed to prevent an old backup from silently replacing richer learner history.

## Security and privacy

Snapshots contain no provider user ID or authentication token. E-mail addresses and credentials are not part of the format. Import always uses the currently authenticated destination platform account.

## Next operational step

When a real Supabase project is connected:

1. export each Base44 learner's progress through the current platform adapter;
2. create/confirm the corresponding Supabase account;
3. authenticate as that destination learner or execute an approved administrative migration path;
4. validate the snapshot;
5. import and reconcile counts;
6. retain the original snapshot as rollback evidence until cohort validation is complete.

— Tehkné Solutions
