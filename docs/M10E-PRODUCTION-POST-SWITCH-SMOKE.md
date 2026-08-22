# Lexia M10-E — Production Post-Switch Smoke

**Tehkné Solutions**

## Purpose

M10-E is the final technical browser proof after an explicitly approved production provider switch has already happened outside this workflow.

It does not deploy, modify DNS or switch provider configuration. It inspects the public production origin and fails closed unless the exact production-candidate SHA is actually serving the Supabase build and the authenticated Lexia experience remains healthy.

## Prerequisite

Before the public origin is touched, M10-E requires a successful M10-D run:

- workflow: `Lexia Production Candidate Attestation`;
- branch: `main`;
- event: `workflow_dispatch`;
- exact same SHA as M10-E;
- artifact: `lexia-m10d-production-candidate-attestation`;
- artifact must not be expired.

The candidate run ID is the only workflow input.

## Protected production origin

The public Lexia origin is not an input. It comes from protected environment secret:

`LEXIA_PRODUCTION_URL`

inside GitHub Environment:

`lexia-production-release`

This boundary matters because the browser proof uses a disposable Supabase password. A dispatch caller cannot redirect the proof to an arbitrary site.

## Public-origin proof

After the M10-D precheck passes, M10-E reuses the deployed Supabase browser proof with:

`LEXIA_LIVE_PREVIEW_URL = LEXIA_PRODUCTION_URL`

Before any disposable account is created or credentials are entered, the public page must prove:

- HTTPS root origin;
- navigation remains on that origin;
- embedded release SHA equals the workflow SHA;
- embedded build provider equals `supabase`.

Only then does the smoke create the disposable identity and validate:

1. protected `/play` -> Login;
2. same-origin `returnTo`;
3. rendered password login;
4. Fresh Start initial mission;
5. Supabase access + refresh session persistence;
6. reload persistence;
7. authenticated World Map;
8. authenticated Profile;
9. authenticated Parent Dashboard;
10. authenticated Settings;
11. real **Sair da conta**;
12. local session removal and return to Login;
13. disposable Auth cleanup in `finally`.

## Evidence

A successful M10-E run uploads:

`lexia-m10e-production-post-switch`

with public-origin browser screenshots.

The artifact is success-only. A failed or partial public production smoke is never valid launch evidence.

## Meaning of a green M10-E

A green M10-E closes the **technical post-switch evidence chain** for the exact production SHA tested by the workflow.

It demonstrates that:

- the intended public origin is serving the expected commit;
- the build is actually Supabase-backed;
- protected Auth/session UI still works after the switch;
- major authenticated surfaces remain available;
- logout works;
- the release has passed the M10-D production-candidate gate first.

## Operational checks still outside the browser harness

Launch operations should still review:

- Supabase Auth/API/Edge logs;
- hosting/runtime errors;
- Fresh Start destination counts;
- domain/TLS health;
- rollback readiness under the real production configuration.

These checks should be captured alongside M10-E evidence for the release record.

## Fresh Start / rollback

M10-E does not migrate learner history. If production must roll back, deployment returns to the last known-good Supabase release without attaching historical progress to current learners.

— Tehkné Solutions
