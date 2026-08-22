# Lexia Game

**Tehkné Solutions**

Lexia is an educational game focused on guided literacy learning, adaptive review, progression through curriculum worlds and persistent learner progress.

The application runs on the independent Supabase runtime behind an explicit platform boundary.

## Current architecture

- React 18 + Vite 6 frontend;
- React Router 7 in declarative mode;
- TanStack Query for client data orchestration;
- platform abstraction in `src/platform`;
- provider: `supabase`;
- Supabase Auth, progress persistence, Storage and Edge Functions behind the adapter boundary;
- independent learning/journey engines and browser QA contracts;
- dedicated critical learner journey E2E running in real Chrome.

The selected platform provider is controlled by `VITE_LEXIA_PLATFORM_PROVIDER` and defaults to `supabase`. Supabase fails closed when its release configuration is incomplete.

## Prerequisites

- Node.js 22;
- npm;
- environment variables for the provider you intend to run.

Install dependencies with the lockfile:

```bash
npm ci
```

## Local development

Create `.env.local` and select the runtime provider.

### Supabase runtime

```dotenv
VITE_LEXIA_PLATFORM_PROVIDER=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_LEXIA_SUPABASE_AUTH_READY=true
VITE_LEXIA_SUPABASE_EDGE_READY=true
```

Optional Edge Function overrides:

```dotenv
VITE_LEXIA_SUPABASE_AI_FUNCTION=lexia-ai
VITE_LEXIA_SUPABASE_EMAIL_FUNCTION=lexia-email
VITE_LEXIA_SUPABASE_UPLOAD_FUNCTION=lexia-upload
```

Supabase is fail-closed: selecting it without the required URL, publishable key and readiness flags stops startup instead of silently falling back to another provider.

Start development:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Validation baseline

Run the primary local gates before proposing changes:

```bash
npm run typecheck
npm run typecheck:core
npm run lint
npm run build
npm audit --audit-level=high
```

GitHub Actions additionally validates the learning and journey contracts, platform boundary, Supabase schema/adapter, release controls and browser QA flows.

The dedicated `Lexia Critical E2E` workflow proves the integrated learner path in real Chrome:

`Home → Sílabas → teclado on-screen → resposta correta → persistência → reload → retomada da jornada`.

## Runtime and release safety

The repository includes explicit gates for:

- Supabase Auth and private services smoke tests;
- browser provider cutover;
- deployed preview validation;
- prebuilt Vercel preview;
- production candidate attestation;
- production post-switch smoke;
- release control;
- critical learner journey E2E.

Do not switch the production provider only because a local build succeeds. Provider promotion must follow the repository release gates and live Supabase validation.

## Fresh-start data policy

The independent runtime follows a fresh-start policy: historical learner data is not migrated unless a future explicit product decision changes that policy. New learners start with canonical empty progress and enter the guided curriculum from the beginning.

## Repository ownership

Product, architecture, code, QA and release documentation are maintained under **Tehkné Solutions**.

— Tehkné Solutions
