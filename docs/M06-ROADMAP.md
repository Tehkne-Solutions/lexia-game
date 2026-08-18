# Lexia M06 — Fresh Start Runtime Roadmap

**Tehkné Solutions**

## Goal

Establish the post-migration baseline for Lexia: a clean independent runtime with no legacy learner data dependency and a direct path to Supabase-first development.

## M06-A — Fresh Start baseline

- retire active migration/ownership runtime;
- remove obsolete migration gates;
- promote typecheck to blocking;
- enforce Fresh Start architecture contract;
- keep Supabase schema and adapter contracts blocking;
- retain Base44 only as temporary application rollback/reference.

## M06-B — Supabase-first development runtime

- configure and validate Auth redirects;
- validate password signup/sign-in/recovery against the live clean project;
- validate empty-account learning start;
- validate RLS CRUD using a disposable development learner;
- delete disposable validation data after the gate;
- prepare provider-selection cutover without committing secrets.

## M06-C — Independent service completion

- connect handwriting AI upstream through `lexia-ai`;
- connect parent-report e-mail upstream through `lexia-email`;
- validate private drawing upload and short-lived signed URLs;
- verify server-side secrets never enter client bundles.

## M06-D — Browser release gate

- authenticated desktop/mobile E2E;
- Welcome → Login → guided learning → World Map → syllables/words → Profile/Parent Dashboard;
- reload/session refresh/logout;
- RLS isolation;
- upload/AI/e-mail flows;
- Base44 fallback drill.

## M06-E — Controlled provider cutover

- set public Supabase runtime variables in preview;
- enable Auth/Edge readiness flags;
- switch provider to Supabase for preview;
- execute full browser release gate;
- promote provider selection only after clean preview evidence.

No user/progress migration is part of M06.

— Tehkné Solutions
