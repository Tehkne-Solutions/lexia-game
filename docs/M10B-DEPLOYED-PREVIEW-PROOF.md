# Lexia M10-B — Deployed Supabase Preview Proof

**Tehkné Solutions**

## Purpose

M10-A attests that the required live backend/browser proofs are green on one `main` commit. M10-B verifies the next boundary: an **actual HTTPS deployment** of that commit must be compiled with the Supabase provider and must preserve the authenticated Lexia experience on its deployed origin.

This gate does not create the deployment. It inspects a deployment whose origin is supplied only through the protected `lexia-live-smoke` GitHub Environment.

## Protected preview origin

Workflow: `Lexia Live Deployed Supabase Preview`

The deployed origin is read exclusively from:

`LEXIA_LIVE_PREVIEW_URL`

stored as a protected GitHub Environment secret.

The preview URL is deliberately **not** a `workflow_dispatch` input because the browser proof enters disposable credentials. Accepting an arbitrary user-supplied URL would allow those credentials to be sent to an untrusted origin.

Before any disposable account is created or any password is typed, M10-B rejects the target unless:

- protocol is HTTPS;
- URL contains no embedded username/password;
- URL is an origin/root URL with no path, query or fragment;
- the rendered application exposes the exact expected release SHA;
- the rendered application exposes `provider=supabase`.

## Build identity

Vite now publishes two non-sensitive build markers on the root document element:

- `data-lexia-release-sha`;
- `data-lexia-build-provider`.

Release SHA resolution order:

1. `VITE_LEXIA_RELEASE_SHA` when explicitly provided;
2. Vercel `VERCEL_GIT_COMMIT_SHA`;
3. GitHub `GITHUB_SHA`;
4. empty value when no release identity exists.

Provider marker comes from `VITE_LEXIA_PLATFORM_PROVIDER` and defaults to `supabase`.

A deployed preview that cannot identify the exact expected SHA or reports a provider other than `supabase` is rejected before credentials are created/entered.

## Browser proof

After deployment identity is verified, the workflow creates one confirmed disposable Supabase Auth user and validates on Chrome mobile 390×844:

1. `/play` is protected;
2. redirect stays on the approved preview origin;
3. Login renders and preserves `returnTo`;
4. password login succeeds through the real deployed React UI;
5. Fresh Start opens the initial guided mission;
6. Supabase session has access + refresh tokens;
7. reload preserves the authenticated route;
8. World Map remains authenticated;
9. Profile remains authenticated;
10. Parent Dashboard remains authenticated;
11. Settings remains authenticated;
12. real **Sair da conta** clears the local Supabase session and returns to Login.

Screenshots are captured as deployed release evidence.

## Cleanup

The disposable Auth identity is removed in `finally`, including after a failed assertion. Progress owned by that identity is removed through the existing Auth foreign-key cascade.

No legitimate learner record is touched.

## Evidence artifact

A successful run uploads:

`lexia-m10b-deployed-supabase-preview`

from `artifacts/m10b/*.png`.

The artifact is success-only; a partial failing browser session cannot be reused as deployed-preview approval.

## What M10-B does not prove by itself

M10-B does not automatically prove:

- that the same deployment is the public production deployment;
- that production DNS has been switched;
- that every Supabase Auth redirect setting was manually reviewed;
- that production rollback has been exercised against public traffic;
- that production provider configuration should be changed automatically.

Those remain promotion/launch controls after the deployed preview is green.

## Fail-closed rule

Never point `LEXIA_LIVE_PREVIEW_URL` at an origin that has not been intentionally selected for Lexia release validation. The secret is a trust boundary because disposable credentials are entered only after the deployment identifies itself as the expected Lexia Supabase commit.

— Tehkné Solutions
