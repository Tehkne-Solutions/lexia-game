# Lexia M29 — Independent Runtime Developer Baseline

**Tehkné Solutions**

## M29-A — Repository entrypoint alignment

The repository entrypoint must describe the runtime that actually exists.

### Completed

- replaced the stale generated README;
- documented the independent platform boundary;
- documented Supabase as the production runtime;
- documented provider selection and Supabase fail-closed readiness;
- documented Node/npm development commands and validation gates;
- documented the Critical Learner Journey E2E path;
- documented release safety and the Fresh Start data policy;
- preserved Tehkné Solutions as the only product signature.

### Guardrail

No runtime, gameplay, routing or UX behavior is changed by M29-A. This milestone removes operational ambiguity so future product work starts from the correct architecture.

## M29-B — Adaptive primary learner action

The Home primary CTA now follows the learner's pedagogical state instead of always pointing directly to the current curriculum mission.

### Priority contract

1. Fresh Start / first run always keeps the initial guided curriculum mission as the primary action.
2. After first run, a due intelligent review with an exact review path becomes the primary action.
3. When no review is due, the primary action returns to the current curriculum journey path.
4. Daily Challenge and Free Practice remain optional parallel modes and never replace the canonical primary action.

### Implementation

- added `src/game/learnerNextActionEngine.js` as a pure decision boundary;
- Home consumes the engine through `primaryAction.path`, `primaryAction.cta` and review-aware mascot guidance;
- exact review paths produced by the existing review engine are reused without creating another review queue;
- added `scripts/check-learner-next-action.mjs`;
- made the Learner Next Action contract blocking in `Lexia CI`.

### Guardrails

- first-run learning cannot be displaced by stale or inconsistent review data;
- invalid journey state fails closed;
- no change to Daily Challenge, Practice Hub, World Map, scoring or persistence contracts;
- review completion naturally returns the learner to curriculum once no due review remains.

## M29-C — Adaptive Home browser proof

The adaptive priority is now validated through the real built application in Chrome, not only through the pure decision contract.

### Browser proof

- builds Lexia with the deterministic in-memory E2E platform only inside the disposable test build;
- starts from the mastered alphabet and confirms the normal Home primary action is `Continuar sílabas`;
- makes letter `A` due in persisted progress and reloads Home;
- confirms the review card and the adaptive primary `Revisar agora` CTA coexist;
- identifies the primary CTA by its actual primary button treatment so the secondary review-card action cannot produce a false positive;
- clicks the primary CTA and proves navigation to `/play?review=1&reviewTarget=A`;
- confirms the exact review screen remains on letter `A`;
- clears the review debt in persisted state and proves Home restores `Continuar sílabas` as the primary action;
- captures three screenshots plus `adaptive-home.json` evidence.

### Workflow

`Lexia Adaptive Home Browser` runs on main, pull requests and integration branches with dependency audit and real Chrome. Evidence is retained as the `lexia-m29c-adaptive-home-browser` artifact.

### Guardrails

- the production platform module is restored immediately after the disposable E2E build;
- no test alias or E2E hook enters the production Vite configuration;
- browser proof verifies the exact primary CTA, not merely the presence of review text;
- route mode/target parameters must be evaluated when `PlayGame` mounts, never at module load, so SPA navigation cannot reuse stale query parameters;
- horizontal overflow remains blocked on the mobile proof viewport.

— Tehkné Solutions
