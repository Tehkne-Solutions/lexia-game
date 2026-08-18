# Lexia M09 — Production Runtime Readiness

**Tehkné Solutions**

## Goal

M09 separates what has already been proven on the live independent Supabase runtime from what must still be demonstrated before provider cutover. Fresh Start remains authoritative: no Base44 or previous Supabase learner history is migrated.

## Live project audited

- project: `lexia-game`;
- region: `sa-east-1`;
- status at audit: `ACTIVE_HEALTHY`;
- project ref: `flekxghnaezlmxtgrjjk`.

## Proven live — clean baseline

Immediately before the runtime proof:

- Supabase Auth users: **0**;
- `public.lexia_progress` rows: **0**;
- Storage objects: **0**;
- Storage buckets: **1**.

After the transactional RLS proof, the same zero counts were confirmed again. No disposable identity or learner record was left behind.

## Proven live — progress isolation

`public.lexia_progress` has RLS enabled and authenticated own-row policies for:

- SELECT;
- INSERT;
- UPDATE;
- DELETE.

A live transactional proof created two synthetic Auth identities only inside one transaction, switched the database session to `authenticated`, changed `auth.uid()` through the request JWT claim, inserted one row for each identity and proved from learner A's context:

- visible rows: **1**;
- own rows visible: **1**;
- learner B rows visible: **0**;
- cross-user UPDATEs: **0**;
- cross-user DELETEs: **0**;
- own-row UPDATE succeeded.

The transaction was then rolled back.

The table also enforces:

- primary key on `id`;
- foreign key `user_id -> auth.users(id)` with `ON DELETE CASCADE`;
- unique `(user_id, letter)`;
- grade check from 0 through 4;
- `user_id` defaults to `auth.uid()`.

## Proven live — private drawing storage

Bucket `lexia-drawings` is private and configured with:

- 2 MB maximum object size;
- PNG, JPEG and WebP only.

There are intentionally no direct `storage.objects` policies for the application user. Client uploads therefore do not bypass the application boundary.

`lexia-upload` is ACTIVE with JWT verification and authenticated-user enforcement. It:

- requires POST;
- requires an authenticated user;
- validates MIME type and 2 MB limit again at the function boundary;
- writes through the server/admin context under `${userId}/...`;
- disables upsert;
- creates a signed URL with **300-second** lifetime;
- removes the object if signed-URL creation fails.

## Proven live — handwriting AI boundary

`lexia-ai` is ACTIVE with JWT verification and authenticated-user enforcement. It:

- accepts POST only;
- reads upstream URL/key only from server environment variables;
- rejects invalid or oversized prompts;
- requires exactly one drawing URL;
- validates the upstream evaluation shape;
- normalizes score, grade, feedback and recognized shape before returning them;
- returns fail-closed errors when the upstream is absent or invalid.

No AI upstream credential is required in the Vite client bundle.

## Proven live — parent e-mail boundary

`lexia-email` is ACTIVE with JWT verification and authenticated-user enforcement. It:

- accepts POST only;
- reads upstream URL/key only from server environment variables;
- derives the destination identity from the authenticated JWT e-mail;
- rejects a requested recipient that does not match the authenticated user;
- limits subject/body size;
- forwards only `{to: authenticatedEmail, subject, body}` to the upstream;
- fails closed when the upstream is unavailable.

This prevents Lexia from acting as an arbitrary authenticated mail relay.

## Advisors reviewed

The Supabase security advisor currently warns that `public.lexia_progress` is discoverable in the GraphQL schema to authenticated users because authenticated users have SELECT permission. RLS remains active and the transactional proof above demonstrates own-row isolation. Revoking SELECT merely to silence this warning would break the legitimate authenticated data path, so M09 records it as an accepted advisory rather than weakening application functionality.

The performance advisor also reports the review-scheduling index as currently unused. With a zero-user Fresh Start database, this is informational and not a release blocker.

## Prepared live proof harnesses — not yet a PASS

The repository now contains three explicit, secret-backed manual proofs under GitHub Environment `lexia-live-smoke`. Their architecture is validated by normal CI, but **their presence is not evidence that the live workflows have run successfully**.

### Auth / REST / Storage smoke

`live-supabase-auth-smoke.yml` is prepared to prove with disposable real GoTrue identities:

- sign-up and password sign-in;
- authenticated `/user`;
- fresh zero-progress accounts;
- REST create/list/update/delete;
- real JWT/RLS cross-user isolation;
- refresh-token continuity and logout revocation;
- optional recovery;
- authenticated private upload, user-scoped object path, 300-second signed URL and cleanup.

### Private services smoke

`live-supabase-services-smoke.yml` can run AI, e-mail or both independently. It is prepared to prove:

- authenticated `lexia-upload` -> signed drawing URL -> `lexia-ai` normalized response;
- e-mail relay to a third party is rejected;
- authenticated self-report e-mail succeeds only through the configured real upstream;
- disposable Auth and Storage cleanup in `finally`.

### Browser provider-cutover smoke

`live-supabase-browser-smoke.yml` builds the actual Vite application with:

- `VITE_LEXIA_PLATFORM_PROVIDER=supabase`;
- explicit Auth readiness;
- explicit Edge readiness;
- only Supabase URL + publishable key entering the client build.

Its browser proof is prepared to exercise the real React/Auth/adapter surface on a 390×844 Chrome viewport:

- public Welcome;
- protected `/play` redirect to `/login` with `returnTo`;
- password login through the rendered form;
- return to the first guided mission on a Fresh Start account;
- persisted Supabase session;
- reload without losing the protected route;
- authenticated World Map, Profile, Parent Dashboard and Settings;
- real **Sair da conta** UI;
- Supabase logout and local session removal;
- screenshots as release evidence;
- disposable account cleanup in `finally`.

The browser smoke also closes a product gap discovered during M09-E: Supabase logout is now exposed in Settings instead of existing only inside the adapter/AuthContext.

## Not yet proven — do not overclaim

The following remain release gates until the corresponding live workflow or configuration inspection actually passes:

1. real GoTrue password sign-up;
2. e-mail confirmation behavior, if enabled;
3. password sign-in;
4. token refresh after reload;
5. password recovery/redirect behavior;
6. logout/session removal;
7. authenticated browser CRUD through the Supabase REST adapter;
8. authenticated browser upload -> signed URL -> AI flow;
9. authenticated parent-report e-mail invocation;
10. exact Auth site URL / redirect allow-list configuration;
11. Supabase provider-switch browser execution;
12. full browser release evidence after provider switch;
13. production provider cutover.

Items covered by prepared harnesses remain unproven until those secret-backed workflows themselves produce green evidence. Exact Auth redirect configuration remains a separate configuration inspection gate.

## Cutover rule

Production remains on its existing provider until all remaining gates above are green. M09 evidence authorizes continued Supabase-first validation; it does **not** authorize skipping Auth/browser E2E and does not reopen legacy data migration.

— Tehkné Solutions
