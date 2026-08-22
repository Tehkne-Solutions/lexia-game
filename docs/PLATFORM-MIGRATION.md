# Lexia Platform Migration

**Tehkné Solutions**

## Objective

Keep the exported Lexia gameplay and UX working while removing infrastructure lock-in incrementally.

## M01 rule

Application modules should depend on `lexiaPlatform` from `src/platform` instead of importing a vendor SDK directly.

The only provider is `supabase`, with independent persistence, AI, storage and email services behind the platform contract.

## Contract

The current contract exposes:

- `progress`: list/create/update/remove/clearAll
- `auth`: current user, logout, login redirect, public settings and access-token presence
- `storage`: file upload
- `ai`: model invocation
- `email`: transactional send

Retired compatibility shims are not part of the active runtime.

## CI baseline

The active export uses blocking typecheck, lint and build release gates.

## Migration sequence

1. M01 — provider contract + independent adapter + CI.
2. M02 — unified learning engine and pedagogical curriculum.
3. M03 — migrate all remaining direct compatibility-shim call sites to provider-neutral services.
4. M04 — add Supabase/independent service adapters and data migration.
5. M05 — release the independent Lexia build.

## Non-regression rule

No migration step may remove the current game routes, learning modes, progress model, world map, story mode, parent dashboard, profile, accessibility, audio feedback, achievements or practice flows without an explicit product decision.
