# Lexia — Supabase Cutover & Rollback Runbook

**Tehkné Solutions**

> Historical note: this document originated in M05. Its old ownership/import procedure was superseded by **M06 Fresh Start**. No Base44 learner history and no previous Supabase learner history may be migrated into the current Lexia runtime.

## Purpose

This runbook defines the operational gate for moving Lexia from the safe default provider to the independent Supabase provider. It is intentionally fail-closed: the existing provider remains the default until every live proof required by M09/M10 is green on the same release commit.

## Canonical Fresh Start rule

The destination Supabase runtime starts new learner identities from zero.

Forbidden during cutover:

- importing Base44 progress;
- attaching anonymous history to a new account;
- importing previous Supabase learner history;
- reconciling historical provider identities into a destination learner;
- changing the Fresh Start rule merely to preserve old progress.

The only destination data allowed before release validation is disposable smoke-test data that is cleaned up by the live proof harnesses.

## Safe default

`resolvePlatformProvider({})` must continue to resolve to the existing provider. Supabase is selected only through explicit release configuration.

Required public Supabase build variables are:

```text
VITE_LEXIA_PLATFORM_PROVIDER=supabase
VITE_SUPABASE_URL=<live project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable client key>
VITE_LEXIA_SUPABASE_AUTH_READY=true
VITE_LEXIA_SUPABASE_EDGE_READY=true
```

Only public URL/key and readiness flags belong in the Vite build. Service-role, AI upstream and e-mail upstream credentials must never enter `VITE_*` variables.

## Live proof gates

M09 provides three independent manual workflows under the protected GitHub Environment `lexia-live-smoke`.

### 1. Auth / REST / Storage

Run `Lexia Live Supabase Auth Smoke` with recovery enabled. It must prove:

- real disposable GoTrue identities;
- password sign-in;
- authenticated `/user`;
- Fresh Start zero progress;
- REST CRUD;
- real JWT/RLS cross-user isolation;
- refresh continuity;
- password recovery request;
- logout refresh-token revocation;
- private drawing upload;
- user-scoped Storage path;
- 300-second signed URL;
- mandatory cleanup.

### 2. Private services

Run `Lexia Live Supabase Services Smoke` with scope `both`. It must prove:

- authenticated upload -> signed URL -> AI evaluation;
- normalized AI response contract;
- third-party e-mail relay rejection;
- authenticated self-report e-mail through the configured real upstream;
- mandatory Auth/Storage cleanup.

### 3. Supabase browser runtime

Run `Lexia Live Supabase Browser Cutover`. It builds the actual Vite application with the Supabase provider and proves in Chrome:

- public Welcome;
- protected-route redirect to Login with same-origin `returnTo`;
- real rendered password login;
- Fresh Start guided mission;
- persisted session;
- reload persistence;
- World Map, Profile, Parent Dashboard and Settings while authenticated;
- real UI logout and local session removal;
- screenshot evidence;
- disposable Auth cleanup.

## Manual configuration gate

The exact Supabase Auth site URL and redirect allow-list remain a configuration-level proof. Before any deployed preview or production switch, record evidence that:

- the intended Lexia production origin is configured;
- the controlled preview origin is allowed when preview recovery/redirect behavior is tested;
- recovery redirects return only to approved Lexia origins.

This confirmation cannot be inferred from SQL RLS or from a local Vite preview.

## M10 release attestation

The M10 attestation consumes the workflow-run IDs for the three M09 live proofs. It must reject release evidence unless:

- every run concluded `success`;
- every run is `workflow_dispatch`;
- every run executed from `main`;
- every run used the same commit as the M10 attestation;
- Auth evidence confirms recovery was enabled;
- private-services evidence confirms scope `both`;
- browser evidence artifact exists;
- manual Auth redirect configuration evidence is supplied.

A successful M10 attestation produces a release-evidence artifact. It **does not deploy** and does not silently change provider configuration.

## Controlled provider switch

Only after the M10 attestation is green:

1. configure the target preview/deployment with the public Supabase variables;
2. keep all service-role/upstream credentials server-side;
3. deploy the exact attested commit;
4. confirm the deployment is actually built with `VITE_LEXIA_PLATFORM_PROVIDER=supabase`;
5. execute the browser release gate against that controlled deployment;
6. inspect Auth/API/Edge logs and Fresh Start destination counts;
7. expand beyond the controlled preview only after the deployed proof is green.

## Immediate rollback

If the Supabase provider causes auth, progress, upload, AI, e-mail or gameplay regression:

1. set `VITE_LEXIA_PLATFORM_PROVIDER=base44`;
2. redeploy the **same application commit**;
3. capture failing deployment/log evidence;
4. preserve any legitimate new Supabase learner data created after launch;
5. repair on a non-production branch;
6. rerun all release proofs before retrying.

Rollback changes provider selection only. It must never trigger historical data import or rewrite learner history.

## Release rule

No merge, workflow name, prepared harness, SQL test or local preview by itself authorizes production cutover. Production promotion requires the explicit live evidence chain and controlled deployed-provider proof above.

— Tehkné Solutions
