# Lexia M10-C — GitHub-built Vercel Supabase Preview

**Tehkné Solutions**

## Purpose

M10-C provides a controlled preview path when Vercel remote/cloud build capacity is unavailable or rate-limited.

The application is built inside GitHub Actions, then the generated Vercel Build Output is published with `vercel deploy --prebuilt`. The resulting preview URL is immediately passed to the M10-B deployed-browser proof.

This is a preview-only fallback. It does not deploy production.

## Why this exists

The current Vercel Git integration may report `build-rate-limit` even while the application itself passes GitHub CI/build. M10-C separates application build correctness from Vercel cloud-build availability:

1. GitHub checks out the exact release commit;
2. GitHub installs dependencies;
3. GitHub pulls Vercel **preview** project configuration;
4. GitHub runs `vercel build` locally with the Supabase provider and exact Git SHA;
5. Vercel receives `.vercel/output` through `vercel deploy --prebuilt`;
6. the URL returned by that trusted deploy is used directly by the deployed-browser proof.

## Required protected values

The workflow runs under GitHub Environment `lexia-live-smoke` and requires:

- `VERCEL_TOKEN`;
- `VERCEL_ORG_ID`;
- `VERCEL_PROJECT_ID`;
- `LEXIA_LIVE_SUPABASE_URL`;
- `LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY`;
- `LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY`;
- `LEXIA_LIVE_TEST_EMAIL`;
- `LEXIA_LIVE_TEST_PASSWORD`.

The workflow explicitly validates these values are present before attempting deployment.

## Build identity

The GitHub-side Vercel build forces:

```text
VITE_LEXIA_PLATFORM_PROVIDER=supabase
VITE_LEXIA_SUPABASE_AUTH_READY=true
VITE_LEXIA_SUPABASE_EDGE_READY=true
VITE_LEXIA_RELEASE_SHA=<github.sha>
```

The public Supabase URL/publishable key enter the Vite build. Service-role and disposable test credentials do not.

## Preview-only deployment

M10-C uses:

```text
vercel pull --environment=preview
vercel build
vercel deploy --prebuilt
```

It never uses `--prod`.

The generated deployment output must contain a `https://*.vercel.app` preview URL. The workflow exports only that generated URL to the next proof step.

## Trusted handoff to M10-B

M10-C does **not** accept a preview URL from a dispatch input and does not use an unrelated stored URL.

The URL passed to `run-live-deployed-supabase-preview-smoke.mjs` comes from the immediately preceding Vercel deploy step. M10-B then independently rejects the page unless its embedded:

- release SHA equals `github.sha`;
- build provider equals `supabase`;
- origin is HTTPS and remains stable through navigation.

Only after those checks are disposable credentials created/entered.

## Evidence

A successful end-to-end M10-C execution uploads:

`lexia-m10c-prebuilt-vercel-supabase-preview`

containing the deployed-browser screenshots.

The artifact is success-only. A successful prebuilt upload followed by a failed browser proof is therefore **not** valid release evidence.

## Failure semantics

M10-C is fail-closed. Expected blockers include:

- missing Vercel token/project/team values;
- missing Supabase live-test values;
- Vercel preview configuration cannot be pulled;
- local `vercel build` fails;
- prebuilt deployment quota/API fails;
- deployment output does not expose a Vercel preview URL;
- preview is protected in a way the browser proof cannot access;
- deployed SHA/provider identity is wrong;
- Auth/session/UI proof fails.

None of these failures authorize fallback to production or disabling validation.

## Production boundary

M10-C is a mechanism for creating and proving a controlled preview. Even when green it does not:

- set production provider variables;
- call `vercel deploy --prod`;
- promote a preview to production;
- modify production DNS;
- bypass M10 release attestation;
- migrate learner history.

— Tehkné Solutions
