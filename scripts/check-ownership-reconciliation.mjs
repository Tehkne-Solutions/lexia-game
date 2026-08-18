import assert from 'node:assert/strict';
import {
  ANONYMOUS_OWNER,
  auditProgressOwnership,
  reconcileProgressOwnership,
} from '../src/migration/ownershipReconciliation.js';

const registeredOwner = 'provider-user-123';
const source = [
  {
    id: 'anon-a', created_by_id: ANONYMOUS_OWNER, letter: 'A',
    total_attempts: 2, correct_attempts: 1, repetitions: 1, stars_earned: 1,
  },
  {
    id: 'user-a', created_by_id: registeredOwner, letter: 'A',
    total_attempts: 9, correct_attempts: 8, repetitions: 5, stars_earned: 8, streak: 4,
  },
  {
    id: 'anon-syl', created_by_id: ANONYMOUS_OWNER, letter: 'SYL_BA',
    total_attempts: 3, correct_attempts: 3, stars_earned: 3,
  },
  {
    id: 'user-word', created_by_id: registeredOwner, letter: 'WORD_CASA',
    total_attempts: 1, correct_attempts: 1, stars_earned: 1,
  },
];

const audit = auditProgressOwnership(source);
assert.equal(audit.totalRecords, 4);
assert.equal(audit.kinds.letter, 2);
assert.equal(audit.kinds.syllable, 1);
assert.equal(audit.kinds.word, 1);
assert.equal(audit.owners.length, 2);
assert.equal(audit.owners.reduce((sum, owner) => sum + owner.records, 0), 4);

assert.throws(() => reconcileProgressOwnership(source), /explicit selectedOwnerRefs/);

const reconciled = reconcileProgressOwnership(source, {
  selectedOwnerRefs: [ANONYMOUS_OWNER, registeredOwner],
  sourceProvider: 'base44',
  exportedAt: '2026-08-18T12:30:00Z',
});

assert.equal(reconciled.report.selectedRecords, 4);
assert.equal(reconciled.report.uniqueRecords, 3);
assert.equal(reconciled.report.duplicateKeysResolved, 1);
assert.deepEqual(reconciled.report.kinds, { letter: 1, syllable: 1, word: 1, other: 0 });
assert.equal(reconciled.snapshot.records.find((record) => record.letter === 'A').total_attempts, 9);
for (const record of reconciled.snapshot.records) {
  assert.equal('id' in record, false);
  assert.equal('created_by_id' in record, false);
  assert.equal('user_id' in record, false);
}

const registeredOnly = reconcileProgressOwnership(source, {
  selectedOwnerRefs: [registeredOwner],
});
assert.equal(registeredOnly.report.selectedRecords, 2);
assert.deepEqual(registeredOnly.snapshot.records.map((record) => record.letter), ['A', 'WORD_CASA']);

console.log('Lexia ownership reconciliation M04-E contract: PASS (explicit owners, strongest duplicate wins, provider IDs stripped)');
