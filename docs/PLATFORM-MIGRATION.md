# Lexia Platform Migration

**Tehkné Solutions**

## Objective

Keep the Base44-exported Lexia gameplay and UX working while removing infrastructure lock-in incrementally.

## M01 rule

Application modules should depend on `lexiaPlatform` from `src/platform` instead of importing a vendor SDK directly.

The first provider is `base44`. Future providers (for example Supabase-backed persistence and independent AI/storage services) must implement the same contract before they can be selected.

## Contract

The current contract exposes:

- `progress`: list/create/update/remove/clearAll
- `auth`: current user, logout, login redirect, public settings and access-token presence
- `storage`: file upload
- `ai`: model invocation
- `email`: transactional send

`src/api/base44Client.js` remains temporarily as a compatibility shim so the original export can be migrated page-by-page without a risky big-bang rewrite.

## Migration sequence

1. M01 — provider contract + Base44 adapter + CI.
2. M02 — unified learning engine and pedagogical curriculum.
3. M03 — migrate all remaining direct compatibility-shim call sites to provider-neutral services.
4. M04 — add Supabase/independent service adapters and data migration.
5. M05 — make Base44 optional and release the independent Lexia build.

## Non-regression rule

No migration step may remove the current game routes, learning modes, progress model, world map, story mode, parent dashboard, profile, accessibility, audio feedback, achievements or practice flows without an explicit product decision.
