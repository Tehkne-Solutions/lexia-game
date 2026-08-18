# Lexia M11 — Supabase Release Control

**Tehkné Solutions**

## Purpose

M11 reduces the operational cutover sequence to one controlled GitHub Actions entrypoint without weakening any M09/M10 evidence gate and without performing the production provider switch.

The workflow `Lexia Supabase Release Control` runs only by `workflow_dispatch`, on `main`, behind `lexia-release-approval`, with `contents: read` and `actions: write`. It does not receive Supabase or Vercel credentials itself. Child workflows keep those secrets inside their existing protected environments.

## Inputs

The operator provides only non-secret release evidence/configuration references:

- `auth_redirect_evidence_url`: HTTPS evidence confirming Supabase Auth site URL and redirect allow-list;
- `production_origin`: intended public production HTTPS root origin;
- `rollback_evidence_url`: HTTPS rollback-readiness evidence;
- `preview_strategy`: `prebuilt` (default) or `existing-secret`.

## Automated sequence

For the exact SHA from which M11 was started:

1. dispatch `Lexia Live Supabase Auth Smoke` with `recovery=true`;
2. wait for `success` and require `lexia-m09b-auth-rest-storage-recovery-true`;
3. dispatch `Lexia Live Supabase Services Smoke` with `service=both`;
4. wait for `success` and require `lexia-m09d-services-both`;
5. dispatch `Lexia Live Supabase Browser Cutover`;
6. require `lexia-m09e-supabase-browser-cutover`;
7. dispatch `Lexia Supabase Release Attestation` with the three run IDs and Auth redirect evidence;
8. require `lexia-m10-release-attestation`;
9. prove a deployed Supabase preview:
   - default: `Lexia Vercel Prebuilt Supabase Preview`, or
   - alternate: `Lexia Live Deployed Supabase Preview` using its protected preview URL secret;
10. require the corresponding M10-B/M10-C artifact;
11. dispatch `Lexia Production Candidate Attestation` with release-attestation run ID, preview run ID, production origin and rollback evidence;
12. require `lexia-m10d-production-candidate-attestation`;
13. write `lexia-m11-release-control-candidate` containing the exact SHA and all child run/artifact IDs.

## Fail-closed behavior

M11 aborts if:

- it is not started from `main`;
- `main` moves to a different SHA during the chain;
- any child run is not `workflow_dispatch` on `main`;
- any child run uses a different SHA;
- any child run fails/cancels/times out;
- a required evidence artifact is missing or expired;
- an evidence/configuration URL is not HTTPS;
- the production origin is not a clean HTTPS root origin.

A stopped M11 run is not a partial release approval. Restart from the then-current `main` after the blocking condition is resolved.

## Secret boundary

The control workflow itself does **not** consume:

- Supabase service-role key;
- Supabase test credentials;
- Vercel token/org/project values;
- production provider variables.

Those remain exclusively in the child workflow environments defined by M09/M10.

## Production boundary

A green M11 artifact means only:

> this exact `main` SHA has a complete live pre-production evidence chain and a valid M10-D production candidate.

It explicitly records:

- `production_deploy_performed: false`;
- `production_provider_switch_performed: false`.

The production change is still an explicit approved operation outside M11. After that change, `Lexia Live Production Supabase Post-Switch` (M10-E) must run using the M10-D run ID produced by the chain and must pass against the actual public production origin.

## Recommended operation

Use `preview_strategy=prebuilt` while Vercel Git/cloud builds are rate-limited. This asks GitHub Actions to build the Supabase preview locally and Vercel to publish only the prebuilt preview output. It never uses `--prod`.

— Tehkné Solutions
