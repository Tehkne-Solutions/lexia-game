# Lexia M29 — Independent Runtime Developer Baseline

**Tehkné Solutions**

## M29-A — Repository entrypoint alignment

The repository entrypoint must describe the runtime that actually exists.

### Completed

- replaced the stale Base44-generated README;
- documented the independent platform boundary;
- documented Supabase as the controlled production cutover target;
- documented Base44 only as temporary rollback/reference;
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

— Tehkné Solutions
