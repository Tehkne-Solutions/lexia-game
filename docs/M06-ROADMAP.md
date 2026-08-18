# Lexia M06 — Fresh Start Runtime Roadmap

**Tehkné Solutions**

## Goal

Establish the post-migration baseline for Lexia: a clean independent runtime with no legacy learner data dependency and a direct path to Supabase-first development.

## M06-A — Fresh Start baseline — COMPLETE

- active migration/ownership runtime retired;
- obsolete migration gates removed;
- Fresh Start architecture contract blocking in CI;
- Supabase schema and functional adapter contracts blocking;
- core typecheck blocking;
- inherited Base44-generated UI type debt remains visible as an advisory baseline;
- Base44 retained only as temporary application rollback/reference.

## M06-B — Fresh-start onboarding — COMPLETE IN CODE

- Supabase Welcome remains public before authentication;
- protected learning routes redirect to authentication while preserving same-origin `returnTo`;
- new accounts receive `onboarding_version=fresh-start-v1`;
- signup UX explicitly communicates that the learner starts from zero;
- empty progress is the canonical first-run state;
- Learning Engine contract proves empty progress → curriculum phase 1 → initial guided letter `I`;
- no seed/import/ownership reconstruction is required.

## Operational cutover gates — PENDING EXTERNAL CONFIGURATION

These gates do not block continued product development, but they block switching production from Base44 to Supabase.

### Auth and live disposable-user validation

- configure Supabase Auth site/redirect URLs;
- validate password signup/sign-in/recovery against the live clean project;
- validate RLS CRUD using a disposable development learner;
- delete disposable validation data after the gate.

### Independent service completion

- connect handwriting AI upstream through `lexia-ai`;
- connect parent-report e-mail upstream through `lexia-email`;
- validate private drawing upload and short-lived signed URLs;
- verify server-side secrets never enter client bundles.

### Browser release gate

- authenticated desktop/mobile E2E;
- Welcome → Login → guided learning → World Map → syllables/words → Profile/Parent Dashboard;
- reload/session refresh/logout;
- RLS isolation;
- upload/AI/e-mail flows;
- Base44 fallback drill.

### Controlled provider cutover

- set public Supabase runtime variables in preview;
- enable Auth/Edge readiness flags;
- switch provider to Supabase for preview;
- execute full browser release gate;
- promote provider selection only after clean preview evidence.

## Fresh-start data policy

The live Supabase project is currently clean: 0 Auth users, 0 progress rows and 0 Storage objects. No Base44 or previous Supabase learner data will be migrated.

No user/progress migration is part of M06 or any subsequent release path unless a new explicit product decision replaces this policy.

— Tehkné Solutions
