# Lexia M04 — Independent Supabase Provider

**Tehkné Solutions**

## Current status

M04-A staged data/RLS. M04-B staged independent authentication. M04-C now adds the server-side Edge Function implementation for private drawing upload, handwriting-AI proxying and parent-report email delivery. Base44 deliberately remains the default runtime until the independent stack is deployed and migrated.

## Provider selection

`VITE_LEXIA_PLATFORM_PROVIDER` accepts `base44` (default) or `supabase` (guarded). Supabase activation still requires URL, publishable key, auth-ready and edge-ready flags.

## Data and auth

- progress: `/rest/v1/lexia_progress`, scoped by authenticated JWT + RLS;
- auth: password sign-in, signup, recovery and refresh session;
- schema: `supabase/migrations/202608180001_lexia_progress.sql`;
- private drawings bucket: `supabase/migrations/202608180002_lexia_drawings_bucket.sql`.

## Edge Functions — M04-C

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

No upstream secret belongs in Vite/client environment variables. Edge Function secrets must be configured in Supabase before deployment. The repository contains no production keys.

## Activation rule

Do not set `VITE_LEXIA_PLATFORM_PROVIDER=supabase` in production until:

1. both SQL migrations are applied;
2. Base44 progress is exported/reconciled per user;
3. Auth redirect URLs and e-mail confirmation/recovery are validated;
4. all three Edge Functions are deployed and their upstream secrets configured;
5. the M04 contracts plus browser E2E pass against the real Supabase project;
6. rollback to Base44 remains available for the first release cohort.

— Tehkné Solutions
