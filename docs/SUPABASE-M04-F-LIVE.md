# Lexia M04-F — Live Supabase Bootstrap

**Tehkné Solutions**

## Status

The existing `lexia-game` Supabase project in São Paulo (`sa-east-1`) has been restored and bootstrapped for the independent provider track. Base44 remains the default application provider; this stage does not switch production traffic.

## Applied infrastructure

- `public.lexia_progress` reconciled to the M04 schema;
- row-level security enabled;
- authenticated-only CRUD policies scoped by `auth.uid() = user_id`;
- private `lexia-drawings` bucket, 2 MiB max, PNG/JPEG/WebP only;
- `lexia-ai`, `lexia-email`, and `lexia-upload` Edge Functions deployed with JWT verification enabled.

## Legacy project reconciliation

The restored Supabase project contained two empty pre-M04 progress schemas:

1. an incompatible `public.lexia_progress` table without `user_id`;
2. an unused `public.progress` table with RLS disabled.

Both were empty. Reconciliation is intentionally fail-closed:

- `202608180003_reconcile_legacy_lexia_progress_schema.sql` only replaces the incompatible table when it contains zero rows;
- `202608180004_remove_empty_legacy_progress.sql` only removes `public.progress` when it contains zero rows;
- either migration aborts rather than discarding non-empty legacy data.

## Security audit

After reconciliation, the Supabase security advisor has no RLS-disabled errors. The remaining GraphQL visibility warning for `public.lexia_progress` is expected because authenticated clients need `SELECT`; row-level policies still restrict rows to the authenticated user's `user_id`.

The private drawing bucket is not publicly readable.

## Still intentionally disabled

Do not set `VITE_LEXIA_PLATFORM_PROVIDER=supabase` yet.

Remaining release work:

1. configure Auth site/redirect URLs;
2. configure server-side AI/e-mail upstream secrets;
3. decide ownership mapping for Base44 source buckets (52 anonymous records + 18 registered-account records);
4. create/confirm destination Supabase user identity;
5. import the portable progress snapshot and reconcile counts;
6. configure Vercel public Supabase URL/publishable key plus readiness flags;
7. execute authenticated browser E2E for login, progress, drawing upload, AI feedback and parent report;
8. retain Base44 as rollback until the Supabase cohort is proven.

No production secrets are committed to the repository.

— Tehkné Solutions
