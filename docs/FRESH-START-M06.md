# Lexia M06 — Fresh Start Runtime

**Tehkné Solutions**

## Decision

Lexia starts from zero for learner accounts and learner progress.

No Base44 or previous Supabase user/progress history will be migrated into the independent runtime. Historical migration code remains recoverable through Git history only and is not part of the active product architecture.

## Canonical clean state

The live Supabase `lexia-game` project is the canonical independent backend and currently has:

- 0 Supabase Auth users;
- 0 rows in `public.lexia_progress`;
- 0 objects in Storage;
- canonical `lexia_progress` schema with authenticated-user RLS;
- private `lexia-drawings` bucket;
- `lexia-upload`, `lexia-ai`, and `lexia-email` deployed with JWT verification.

## Runtime rules

1. A newly created learner has no imported progress.
2. The Learning Engine determines the first guided learning item from an empty progress set.
3. `SYL_*` and `WORD_*` progress remains isolated from letter scheduling.
4. Provider-internal IDs are never treated as learner identity outside the provider adapter.
5. Base44 data is not a migration source from M06 onward.
6. Base44 may remain temporarily available only as an application-level rollback/reference while the Supabase runtime cutover is validated.

## Retired M04 migration subsystem

The following active-runtime modules/gates are retired in M06:

- `src/migration/progressSnapshot.js`;
- `src/migration/ownershipReconciliation.js`;
- `scripts/check-progress-migration.mjs`;
- `scripts/check-ownership-reconciliation.mjs`.

The historical M04 audit and migration documentation is retained for traceability, but it no longer defines release requirements.

## Release gates from M06 onward

Blocking CI must cover:

- TypeScript/JavaScript typecheck;
- Learning Engine contract;
- Platform Boundary contract;
- Independent Provider contract;
- Edge Functions contract;
- Fresh Start contract;
- Supabase schema contract;
- Supabase adapter functional contract;
- ESLint;
- Vite production build.

## Remaining provider-cutover gates

Because no data migration is required, provider cutover is now blocked only by runtime validation and configuration:

1. configure Supabase Auth site/redirect URLs;
2. configure server-side AI and e-mail upstream secrets;
3. configure Vercel public Supabase URL/key and readiness flags;
4. run authenticated browser E2E for Auth, progress RLS, upload, AI, e-mail and gameplay;
5. switch `VITE_LEXIA_PLATFORM_PROVIDER=supabase` in a controlled preview/cohort;
6. keep Base44 provider selection available for immediate rollback until Supabase runtime stability is proven.

No legacy user ownership decision or historical progress reconciliation is required.

— Tehkné Solutions
