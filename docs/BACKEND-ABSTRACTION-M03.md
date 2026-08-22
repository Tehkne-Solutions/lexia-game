# Lexia Backend Abstraction — M03

**Tehkné Solutions**

## Objective

Remove vendor SDK lock-in from application code and use the independent Supabase runtime.

## Final boundary

The application imports no vendor SDK outside the Supabase boundary.

All application modules now depend directly on `lexiaPlatform` from `src/platform`. The temporary compatibility facade used during M03 was retired after its consumer count reached zero.

Supabase is the active provider behind the platform contract.

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

- a retired vendor SDK is imported by application code;
- a concrete adapter is imported outside the platform registry;
- any module imports a retired compatibility facade.

The release gate now requires **zero legacy facade consumers**.

## Migration status

M03 completed the six final legacy call sites:

1. `src/lib/PageNotFound.jsx`
2. `src/pages/ParentDashboard.jsx`
3. `src/pages/PlayGame.jsx`
4. `src/pages/PlaySyllables.jsx`
5. `src/pages/Profile.jsx`
6. `src/pages/WorldMap.jsx`

`SpeedChallenge` and the remaining local-only features already had no provider dependency.

## Next step — M04

The independent Supabase provider now supplies auth/data plus storage/AI/email services behind the same contract without rewriting gameplay screens.

— Tehkné Solutions
