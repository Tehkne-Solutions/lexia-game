# M38-AL to M38-AP — Profile Composition

## Scope

The Profile page now keeps data loading, domain calculations, local persistence and callbacks in `Profile.jsx`. Presentation composition is delegated through these surfaces:

- `ProfileHeader`
- `ProfileContent`
- `ProfileTabContent`
- `ProfileAccountActions`

`ProfileContent` composes the hero, journey, stats, tabs, animated tab content and account actions. `DeleteAccountButton` remains responsible for the destructive account workflow.

## Contracts

The Premium Profile Browser workflow runs the fail-closed contracts for the extracted surfaces and their historical dependencies. The browser harness covers all five Profile tabs across mobile-short, mobile and desktop viewports and asserts no horizontal overflow.

## Local validation

Passed:

- Profile surface contracts M38-AC through M38-AN;
- no-gradient learner chrome audit;
- editor diagnostics for the touched JSX and contract files;
- JavaScript parsing and `git diff --check`.

Blocked locally:

- build, lint, typecheck and browser execution require `node_modules`; repeated `npm ci` attempts did not complete in the local environment.
- the existing premium action primitive audit reports `GameActionButton.jsx` importing the base UI `Button`; this shared-component finding is outside M38-AL through M38-AP.
