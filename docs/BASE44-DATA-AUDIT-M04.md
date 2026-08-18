# Lexia M04-E — Base44 Data Audit & Ownership Reconciliation

**Tehkné Solutions**

## Audit scope

Read-only audit of the original Lexia Base44 application before independent-provider migration. No learner e-mail, authentication token or provider user identifier is recorded in this document.

Audit date: 2026-08-18.

## Source inventory

The original app currently exposes two entity schemas:

- `ChildProgress`
- `User`

Current progress inventory:

- **70 total progress records**
- **26 letter records** — complete A–Z coverage
- **44 syllable records** — `SYL_*`
- **0 persisted word records** — `WORD_*`

The User entity currently contains one registered account with the admin role.

## Ownership split

`ChildProgress` records are not under one single source owner bucket:

- **52 records** have source ownership `anonymous`
- **18 records** are associated with the registered Base44 account

All audited progress records use the same current `child_name` display value (`Jogador`), but that fact alone is not sufficient evidence to silently reassign anonymous records to the registered account.

## Migration decision

Ownership reconciliation must therefore be explicit.

`src/migration/ownershipReconciliation.js` requires the migration operator to select which source owner buckets belong to the same destination learner. It then:

1. filters only explicitly selected source owners;
2. normalizes records to the provider-neutral Lexia schema;
3. resolves duplicate progress keys by keeping the stronger learner history;
4. strips `created_by_id`, record IDs and other provider identity metadata;
5. produces a normal `lexia-progress-snapshot` for import into the authenticated destination account.

The module does **not** automatically merge anonymous and registered histories merely because there is currently one registered user.

## Operational implication

For the current Lexia dataset, a migration can preserve all 70 records only after the operator intentionally confirms that the 52 anonymous records and the 18 registered-account records belong to the same destination learner/account. If that is not confirmed, they must remain separate migration cohorts.

## Data quality observation

The game contains a Word mode in code, but the original Base44 dataset currently has no `WORD_*` persistence history. This is not treated as data loss; it is recorded as the current source state.

— Tehkné Solutions
