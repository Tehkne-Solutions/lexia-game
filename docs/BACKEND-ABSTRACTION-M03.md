# Lexia Backend Abstraction — M03

**Tehkné Solutions**

## Objective

Remove Base44 SDK lock-in from application code before replacing the active backend provider.

## Boundary

Only `src/platform/adapters/base44Adapter.js` may import `@base44/sdk`.

Application code talks to `lexiaPlatform`. Screens that still use the original generated `base44.*` shape go through `src/api/base44Client.js`, which is now a compatibility facade over `lexiaPlatform` rather than an export of the raw vendor client.

This means changing the active provider no longer requires generated screens to know the Base44 SDK implementation.

## Legacy facade surface

The compatibility facade intentionally supports only the capabilities already used by Lexia:

- `entities.ChildProgress.list/create/update/delete`
- `auth.me/logout/redirectToLogin`
- `integrations.Core.UploadFile`
- `integrations.Core.InvokeLLM`
- `integrations.Core.SendEmail`

No generic SDK escape hatch is exposed.

## Enforcement

`scripts/check-platform-boundary.mjs` scans application source and fails CI when:

- `@base44/sdk` is imported outside the Base44 adapter;
- a concrete Base44 adapter is imported outside the platform registry;
- the legacy facade stops delegating to `lexiaPlatform` or exposes the raw client.

The script also reports how many legacy facade consumers remain. Those call sites can now be migrated incrementally without blocking the provider transition.

— Tehkné Solutions
