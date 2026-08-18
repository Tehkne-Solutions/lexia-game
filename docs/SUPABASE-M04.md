# Lexia M04 — Independent Supabase Provider

**Tehkné Solutions**

## Current status

M04-A staged the independent data provider and RLS schema. M04-B adds the independent email/password authentication experience, while Base44 deliberately remains the default production runtime.

## Provider selection

`VITE_LEXIA_PLATFORM_PROVIDER` accepts:

- `base44` — default and current production behavior;
- `supabase` — independent provider, guarded by readiness checks.

Supabase selection fails fast unless all release markers are present:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy `VITE_SUPABASE_ANON_KEY` remains a temporary fallback)
- `VITE_LEXIA_SUPABASE_AUTH_READY=true`
- `VITE_LEXIA_SUPABASE_EDGE_READY=true`

## Data path

`src/platform/adapters/supabaseAdapter.js` implements the Lexia platform contract without adding a Supabase JavaScript SDK dependency. Progress uses `/rest/v1/lexia_progress`; authenticated JWTs plus RLS isolate each account's records.

`supabase/migrations/202608180001_lexia_progress.sql` preserves the current FSRS/gamification fields and supports letter, syllable and word progress keys.

## Authentication — M04-B

The platform contract now includes:

- `auth.signInWithPassword`
- `auth.signUp`
- `auth.requestPasswordReset`

The Supabase adapter persists access/refresh tokens locally for the staged client-only flow, refreshes near-expiry sessions, and maps the password/signup/recovery endpoints. `/login` is public only when the Supabase provider is active; Base44 continues using its hosted authentication flow.

The login page supports:

- email/password sign-in;
- account creation with email confirmation as a valid outcome;
- password-recovery email request;
- same-origin validation for `returnTo` to prevent external open redirects.

Before activation, Supabase Auth redirect URLs must include the production Lexia origin and the login/recovery destination.

## AI, upload and email staging

The provider contract routes these capabilities through guarded Supabase Edge Function names:

- `lexia-upload`
- `lexia-ai`
- `lexia-email`

They remain protected by `VITE_LEXIA_SUPABASE_EDGE_READY=true`. M04-C must implement the functions, secrets and integration tests before the provider can activate.

## Activation rule

No production environment should set `VITE_LEXIA_PLATFORM_PROVIDER=supabase` until:

1. the SQL migration is applied;
2. Base44 progress data is exported and reconciled per user;
3. Supabase Auth redirect URLs and email flow are validated;
4. Edge Functions are deployed;
5. provider contract, lint, build and end-to-end tests pass;
6. a rollback path to Base44 is retained for the first release cohort.

— Tehkné Solutions
