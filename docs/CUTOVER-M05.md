# Lexia M05 — Supabase Cutover & Rollback Runbook

**Tehkné Solutions**

## Purpose

This runbook is the operational gate for moving Lexia from the Base44 provider to the independent Supabase provider. It is intentionally fail-closed: Base44 remains the default until every required cutover condition is proven.

## Current safe state

- Base44 is the default runtime provider.
- The live Supabase project is healthy.
- The canonical progress schema and RLS are deployed.
- The private drawing bucket is deployed.
- `lexia-upload`, `lexia-ai`, and `lexia-email` are deployed with JWT verification.
- Supabase currently has no destination learner identity and no imported learner progress.
- Base44 source audit has 70 progress records: 26 letters, 44 syllables, 0 persisted words.
- Source ownership is split between 52 `anonymous` records and 18 registered-account records.

No ownership assumption is allowed during cutover.

## Required public client configuration

The Vite application expects the following variables when Supabase is tested:

```text
VITE_SUPABASE_URL=<live project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable client key>
VITE_LEXIA_SUPABASE_AUTH_READY=true
VITE_LEXIA_SUPABASE_EDGE_READY=true
```

Function names are optional because the defaults already match the deployed functions:

```text
VITE_LEXIA_SUPABASE_AI_FUNCTION=lexia-ai
VITE_LEXIA_SUPABASE_EMAIL_FUNCTION=lexia-email
VITE_LEXIA_SUPABASE_UPLOAD_FUNCTION=lexia-upload
```

Do **not** set the production provider to Supabase yet.

## Required server-side configuration

Configure only in Supabase Edge Function secrets/server configuration:

```text
LEXIA_AI_UPSTREAM_URL=<Tehkné-controlled AI endpoint>
LEXIA_AI_UPSTREAM_KEY=<optional server credential>
LEXIA_EMAIL_UPSTREAM_URL=<Tehkné-controlled email endpoint>
LEXIA_EMAIL_UPSTREAM_KEY=<optional server credential>
```

Never place these secrets in `VITE_*` variables or the repository.

## Auth gate

Before enabling Supabase for any cohort:

1. Configure the Supabase Auth site URL for the intended Lexia origin.
2. Allow the exact login / recovery redirect origins used by preview and production.
3. Validate sign-up, e-mail confirmation where enabled, password sign-in, refresh and password recovery.
4. Confirm cross-origin `returnTo` values remain rejected by the Lexia login implementation.

## Ownership and progress migration gate

The Base44 source contains two ownership buckets. The destination mapping must be explicitly recorded before any import.

For each destination learner:

1. Create or confirm the destination Supabase Auth identity.
2. Explicitly select which Base44 ownership bucket(s) belong to that learner.
3. Generate the provider-neutral progress snapshot.
4. Reconcile duplicate keys using the existing conservative stronger-history rule.
5. Import through the destination provider.
6. Compare source and destination counts by key family:
   - letters;
   - `SYL_*`;
   - `WORD_*`.
7. Keep the source snapshot as rollback evidence; never write provider IDs into it.

Do not attach `anonymous` history to a registered learner by inference.

## Browser E2E gate

The Supabase provider is not release-ready until a real authenticated browser session proves:

1. login and session refresh;
2. progress list/create/update/delete under RLS;
3. guided letter progression and FSRS scheduling;
4. syllable and word progress isolation from letter scheduling;
5. private drawing upload and signed URL lifecycle;
6. handwriting AI request/response normalization;
7. parent report e-mail restricted to the authenticated user;
8. logout and session removal;
9. refresh/reload persistence;
10. no regression in World Map, Profile, Story, Speed Challenge, Parent Dashboard or Settings.

## Cutover sequence

Only after all gates above are green:

1. Set public Supabase URL/key in the target Vercel environment.
2. Set `VITE_LEXIA_SUPABASE_AUTH_READY=true`.
3. Set `VITE_LEXIA_SUPABASE_EDGE_READY=true`.
4. Deploy and validate while **still using Base44** as provider.
5. Set `VITE_LEXIA_PLATFORM_PROVIDER=supabase` for a controlled preview/cohort.
6. Run the full browser E2E again on that deployment.
7. Reconcile live destination counts and logs.
8. Expand the cohort only after stability is proven.

## Immediate rollback

If Supabase cutover causes auth, data, upload, AI, e-mail or gameplay regressions:

1. set `VITE_LEXIA_PLATFORM_PROVIDER=base44`;
2. redeploy the same application commit;
3. do not delete the Supabase data produced during the failed cohort;
4. capture the failing deployment/log evidence;
5. repair on the integration branch;
6. repeat the cutover gates before retrying.

The rollback changes provider selection only; it must not rewrite learner history.

## Merge gate

PR #1 remains draft until:

- destination ownership is explicitly resolved;
- Supabase Auth redirects and Edge Function upstreams are configured;
- real authenticated browser E2E passes;
- first-cohort rollback is demonstrably available.

— Tehkné Solutions
