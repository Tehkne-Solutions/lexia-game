# Lexia M10 — Release Orchestration

**Tehkné Solutions**

## Purpose

M10 turns the independent M09 live proofs into one auditable release-evidence chain without deploying or silently changing the runtime provider.

The central rule is simple: **a Supabase release candidate is not attested unless all required live proofs are green on the same `main` commit**.

## Canonical data rule

M06 Fresh Start remains authoritative.

M10 does not migrate:

- historical learner history;
- anonymous historical history;
- previous Supabase learner history;
- provider-owned user IDs or progress snapshots.

Disposable smoke-test users/rows/objects are allowed only for validation and must be cleaned by the corresponding harness.

## Evidence chain

### Gate A — Auth / REST / private Storage

Workflow: `Lexia Live Supabase Auth Smoke`

Required release execution:

- branch: `main`;
- exact release SHA;
- `workflow_dispatch`;
- `recovery=true`;
- conclusion: `success`;
- artifact: `lexia-m09b-auth-rest-storage-recovery-true`.

This proves the real GoTrue + REST/JWT/RLS + private Storage path and exercises password recovery as part of release evidence.

### Gate B — private upstream services

Workflow: `Lexia Live Supabase Services Smoke`

Required release execution:

- branch: `main`;
- exact release SHA;
- `workflow_dispatch`;
- `service=both`;
- conclusion: `success`;
- artifact: `lexia-m09d-services-both`.

This prevents an AI-only or e-mail-only smoke from being reused as complete release evidence.

### Gate C — actual Supabase client build in Chrome

Workflow: `Lexia Live Supabase Browser Cutover`

Required release execution:

- branch: `main`;
- exact release SHA;
- `workflow_dispatch`;
- conclusion: `success`;
- artifact: `lexia-m09e-supabase-browser-cutover`.

The browser workflow builds Vite with `VITE_LEXIA_PLATFORM_PROVIDER=supabase` and validates the rendered login/session/reload/navigation/logout experience against the live Supabase backend.

### Gate D — Auth redirect configuration evidence

Supabase Auth site URL and redirect allow-list cannot be inferred from RLS, REST or a local Vite preview.

M10 therefore requires an explicit HTTPS evidence reference during attestation. The reference should identify the reviewed configuration showing the intended Lexia origin(s) and recovery redirect policy.

## M10 attestation workflow

Workflow: `Lexia Supabase Release Attestation`

The workflow is manual and runs behind GitHub Environment `lexia-release-approval`.

Inputs:

- Auth smoke run ID;
- services smoke run ID;
- browser smoke run ID;
- HTTPS Auth redirect configuration evidence reference.

The attestation queries the GitHub Actions API with read-only permissions and rejects evidence unless each selected run:

1. is completed;
2. concluded `success`;
3. was started via `workflow_dispatch`;
4. ran from `main`;
5. has the exact same `head_sha` as the attestation commit;
6. comes from the expected workflow name/path;
7. belongs to this repository;
8. exposes the exact required non-expired artifact.

## Attestation output

On success, M10 writes:

`artifacts/m10/release-attestation.json`

and uploads it as:

`lexia-m10-release-attestation`

The document records:

- repository;
- exact release SHA;
- each proof run ID and artifact;
- Auth redirect evidence reference;
- Fresh Start rule;
- `production_deploy_performed: false`;
- `provider_switch_performed: false`;
- `deployed_supabase_preview_still_required: true`.

A green M10 attestation means **the commit is authorized to enter a controlled deployed Supabase preview**. It is not a production deployment authorization by itself.

## Why the same SHA is mandatory

Evidence from a previous commit may describe different Auth, RLS, Edge Function, browser or UI behavior. Reusing old green runs after code changes would create a false release signal.

M10 therefore requires all live evidence and the attestation to point to the same 40-character commit SHA.

## What happens after M10 attestation

The next release step must deploy the exact attested commit to a controlled environment with the Supabase provider enabled and verify the **deployed origin**, not only the local Vite preview.

That deployed proof must confirm:

- actual served provider is Supabase;
- approved HTTPS origin is compatible with Auth configuration;
- login/recovery redirects use the deployed origin;
- authenticated browser journey remains green;
- live logs and Fresh Start counts remain coherent;
- rollback to the safe provider is available for the same application commit.

Only after that deployed-provider proof should production promotion be considered.

## Failure semantics

M10 is fail-closed.

It fails if:

- any run ID is missing or duplicated;
- any proof failed or is incomplete;
- a proof came from a push/PR instead of manual dispatch;
- a proof came from another branch;
- proof SHA differs from the release SHA;
- workflow name/path differs from the canonical harness;
- required evidence artifact is missing/expired;
- recovery was not proven;
- both private services were not proven;
- Auth redirect evidence is absent or not HTTPS;
- attestation is dispatched from anything other than `main`.

## Non-goals

M10 does **not**:

- configure GitHub secrets;
- configure Supabase Auth redirect URLs;
- deploy Vercel or any other hosting provider;
- modify production environment variables;
- switch `VITE_LEXIA_PLATFORM_PROVIDER`;
- migrate historical learner progress;
- delete legitimate production learner data.

— Tehkné Solutions
