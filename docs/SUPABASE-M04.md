# Lexia M04 — Independent Supabase Provider

**Tehkné Solutions**

## Current status

M04-A staged data/RLS, M04-B staged independent authentication, M04-C added the server-side Edge Functions, M04-D added portable progress snapshots, M04-E added Base44 ownership reconciliation, and M04-F has now bootstrapped the real `lexia-game` Supabase project.

Base44 deliberately remains the default runtime until user ownership, Auth redirects, upstream secrets, data import and authenticated browser E2E are complete.

## Provider selection

`VITE_LEXIA_PLATFORM_PROVIDER` accepts `base44` (default) or `supabase` (guarded). Supabase activation requires URL, publishable key, auth-ready and edge-ready flags.

## Live M04-F infrastructure

The existing Supabase project in São Paulo (`sa-east-1`) is active and healthy.

Applied and verified:

- `public.lexia_progress` with authenticated-user RLS;
- private `lexia-drawings` bucket;
- `lexia-upload` Edge Function with JWT verification;
- `lexia-ai` Edge Function with JWT verification;
- `lexia-email` Edge Function with JWT verification;
- security audit with no RLS-disabled public-table errors after legacy cleanup.

The restored project contained empty legacy progress tables. Their reconciliation is versioned in:

- `supabase/migrations/202608180003_reconcile_legacy_lexia_progress_schema.sql`;
- `supabase/migrations/202608180004_remove_empty_legacy_progress.sql`.

Both migrations abort instead of deleting non-empty legacy data.

See `docs/SUPABASE-M04-F-LIVE.md` for the live bootstrap record.

## Data and auth

- progress: `/rest/v1/lexia_progress`, scoped by authenticated JWT + RLS;
- auth: password sign-in, signup, recovery and refresh session;
- primary schema: `supabase/migrations/202608180001_lexia_progress.sql`;
- private drawings bucket: `supabase/migrations/202608180002_lexia_drawings_bucket.sql`.

## Edge Functions

All three functions require an authenticated user JWT.

### `lexia-upload`

- accepts one PNG/JPEG/WebP drawing;
- maximum 2 MiB;
- writes to private bucket `lexia-drawings` under the authenticated user path;
- returns a signed URL with a 5-minute lifetime;
- never exposes a secret key to the browser.

### `lexia-ai`

- validates the drawing-evaluation request;
- forwards to a Tehkné-controlled/configurable upstream defined by `LEXIA_AI_UPSTREAM_URL`;
- optional upstream credential lives in Edge Function secret `LEXIA_AI_UPSTREAM_KEY`;
- validates and normalizes `score`, `grade`, `feedback` and `recognized_as` before returning data to the game.

### `lexia-email`

- forwards parent reports through `LEXIA_EMAIL_UPSTREAM_URL`;
- optional credential: `LEXIA_EMAIL_UPSTREAM_KEY`;
- forces the recipient to match the authenticated user's e-mail, preventing the game endpoint from becoming an arbitrary mail relay.

## Secrets and deployment

No upstream secret belongs in Vite/client environment variables. Edge Function secrets must be configured in Supabase. The repository contains no production secrets.

The Supabase project URL and a dedicated publishable key have been resolved, but the available Vercel connector in this environment is read-only for environment variables. They have therefore not been injected into Vercel yet.

## Activation rule

Do not set `VITE_LEXIA_PLATFORM_PROVIDER=supabase` in production until:

1. Auth site/redirect URLs and e-mail confirmation/recovery are validated;
2. server-side AI/e-mail upstream secrets are configured;
3. Base44 progress ownership is explicitly reconciled per learner;
4. destination Supabase identity exists;
5. portable progress snapshot import is reconciled against source counts;
6. Vercel public Supabase configuration/readiness flags are set;
7. authenticated browser E2E passes against the real Supabase project;
8. rollback to Base44 remains available for the first release cohort.

— Tehkné Solutions
