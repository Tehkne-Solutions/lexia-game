# Lexia Backend Abstraction — M03

**Tehkné Solutions**

## Objective

Remove Base44 SDK lock-in from application code before replacing the active backend provider.

## Final boundary

Only `src/platform/adapters/base44Adapter.js` may import `@base44/sdk`.

All application modules now depend directly on `lexiaPlatform` from `src/platform`. The temporary `src/api/base44Client.js` compatibility facade used during M03 was retired after its consumer count reached zero.

The active provider is still Base44, but Base44 is now an implementation detail behind the platform contract rather than an application-level dependency.

## Provider-neutral capabilities

The application contract currently exposes:

- `progress.list/create/update/remove/clearAll`
- `auth.me/logout/redirectToLogin/getPublicSettings/hasAccessToken`
- `storage.uploadFile`
- `ai.invoke`
- `email.send`

These capabilities cover the current Lexia product flows including guided letter gameplay, syllables and words, profile, world map, story mode, parent reports, authentication and account-progress deletion.

## Enforcement

`scripts/check-platform-boundary.mjs` scans application source and fails CI when:

- `@base44/sdk` is imported outside the Base44 adapter;
- a concrete Base44 adapter is imported outside the platform registry;
- any module imports the retired `@/api/base44Client` facade.

The release gate now requires **zero legacy facade consumers**.

## Migration status

M03 completed the six final legacy call sites:

1. `src/lib/PageNotFound.jsx`
2. `src/pages/ParentDashboard.jsx`
3. `src/pages/PlayGame.jsx`
4. `src/pages/PlaySyllables.jsx`
5. `src/pages/Profile.jsx`
6. `src/pages/WorldMap.jsx`

`SpeedChallenge` and the remaining local-only features already had no Base44 dependency.

## Next step — M04

M04 can now add an independent provider (Supabase for auth/data plus independent storage/AI/email services) behind the same contract without rewriting gameplay screens. Base44 remains active until the replacement adapter is configured, migrated and passes the same release gates.

— Tehkné Solutions
