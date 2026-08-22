# Lexia M10-D — Production Candidate Attestation

**Tehkné Solutions**

## Purpose

M10-D is the final **evidence aggregation** gate before any production provider configuration is considered. It does not deploy and does not switch the application provider.

A commit becomes a production **candidate** only when the same SHA has both:

1. the complete M10-A release attestation; and
2. a successful deployed Supabase preview proof from M10-B or M10-C.

M10-D additionally requires explicit references for the intended public production origin and rollback readiness.

## Required evidence

### Release attestation

Run ID must point to:

`Lexia Supabase Release Attestation`

with artifact:

`lexia-m10-release-attestation`

The run must be completed successfully, manually dispatched from `main`, belong to this repository and use the exact M10-D SHA.

Because M10-A already verifies M09 Auth/REST/Storage, private services, browser Supabase build and Auth redirect evidence on that same SHA, M10-D does not duplicate those API calls; it verifies the canonical attestation run and artifact.

### Deployed preview proof

M10-D accepts one of two canonical deployed-preview paths:

**Existing controlled preview**

- workflow: `Lexia Live Deployed Supabase Preview`;
- artifact: `lexia-m10b-deployed-supabase-preview`.

**GitHub-built Vercel prebuilt preview**

- workflow: `Lexia Vercel Prebuilt Supabase Preview`;
- artifact: `lexia-m10c-prebuilt-vercel-supabase-preview`.

Whichever run is selected must also be successful, `workflow_dispatch`, `main`, same SHA, canonical workflow path and non-expired evidence.

## Production origin

The workflow requires the intended public Lexia production origin as an HTTPS root URL.

It rejects:

- non-HTTPS origins;
- embedded URL credentials;
- path-based values;
- query strings;
- fragments.

The production origin input is an attestation target only. M10-D does not modify DNS or deploy to that origin.

## Rollback evidence

An HTTPS rollback evidence reference is mandatory. It should point to the reviewed operational evidence showing that the candidate can return to the safe provider without rewriting learner history.

The canonical rollback remains redeployment of the last known-good Supabase release, followed by evidence capture.

## Output

Successful M10-D creates:

`artifacts/m10d/production-candidate-attestation.json`

uploaded as:

`lexia-m10d-production-candidate-attestation`

The artifact records:

- repository;
- exact SHA;
- intended production origin;
- rollback evidence reference;
- M10-A run/artifact;
- deployed-preview run/artifact;
- Fresh Start invariant;
- `authorized_for_production_configuration: true`;
- `production_deploy_performed: false`;
- `production_provider_switch_performed: false`;
- `post_switch_production_smoke_required: true`.

## Meaning of a green M10-D

A green M10-D means the commit has enough evidence to be **considered for an explicit production configuration change**.

It does not mean:

- production is already deployed;
- provider has been switched;
- DNS changed;
- production traffic has been validated;
- rollback has been exercised under public traffic;
- post-switch smoke can be skipped.

## Mandatory post-switch gate

After an explicitly approved production provider switch, the public production origin must still run a post-switch smoke that confirms:

- deployed build identifies the exact candidate SHA;
- deployed build identifies `provider=supabase`;
- Auth/session flow works on the public production origin;
- Fresh Start behavior is intact;
- logs do not show release-blocking Auth/API/Edge regressions;
- rollback remains immediately available.

Until that smoke passes, launch is not considered closed.

## Fresh Start

M10-D preserves M06 Fresh Start. Historical learner progress must not be introduced as part of candidate attestation, deployment or rollback.

— Tehkné Solutions
