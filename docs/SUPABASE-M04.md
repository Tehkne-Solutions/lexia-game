# Lexia M04 — Independent Supabase Provider

**Tehkné Solutions**

## M04-A status

The independent provider is now staged in code but deliberately **not activated**. Base44 remains the default runtime until migration, authentication UI and Supabase Edge Functions are configured and validated.

## Provider selection

`VITE_LEXIA_PLATFORM_PROVIDER` accepts:

- `base44` — default and current production behavior;
- `supabase` — independent provider, guarded by readiness checks.

Supabase selection fails fast unless all release markers are present:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy `VITE_SUPABASE_ANON_KEY` remains a temporary fallback)
- `VITE_LEXIA_SUPABASE_AUTH_READY=true`
- `VITE_LEXIA_SUPABASE_EDGE_READY=true`

This prevents a partial migration from silently putting users on an incomplete backend.

## Data path

`src/platform/adapters/supabaseAdapter.js` implements the existing Lexia platform contract without adding a Supabase JavaScript SDK dependency. Progress uses the project REST API (`/rest/v1/lexia_progress`) and authenticated user JWTs; RLS is the data-isolation boundary.

The migration `supabase/migrations/202608180001_lexia_progress.sql` creates the progress table for letter, syllable and word keys, preserves the current FSRS/gamification fields and enforces per-user RLS policies.

## Auth/session staging

The adapter contains session primitives and maps `auth.me/logout/redirectToLogin`, but the independent `/login` experience is not yet declared release-ready. M04-B must implement and test sign-in/sign-up/recovery before `VITE_LEXIA_SUPABASE_AUTH_READY=true` is permitted.

## AI, upload and email staging

The existing platform contract routes these capabilities through Supabase Edge Function names:

- `lexia-upload`
- `lexia-ai`
- `lexia-email`

They remain guarded by `VITE_LEXIA_SUPABASE_EDGE_READY=true`. M04-B must implement the functions, secrets and integration tests before the provider can activate.

## Migration rule

No production environment should set `VITE_LEXIA_PLATFORM_PROVIDER=supabase` until:

1. the SQL migration is applied;
2. Base44 progress data is exported and reconciled per user;
3. auth flow is implemented;
4. Edge Functions are deployed;
5. provider contract, lint, build and end-to-end tests pass;
6. a rollback path to the Base44 provider is retained for the first release cohort.

— Tehkné Solutions
