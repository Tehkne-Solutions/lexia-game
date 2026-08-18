import assert from 'node:assert/strict';
import {
  createProgressSnapshot,
  importProgressSnapshot,
  normalizeProgressRecord,
  validateProgressSnapshot,
} from '../src/migration/progressSnapshot.js';

const source = [
  {
    id: 'base44-internal-id',
    created_by: 'provider-user-id',
    child_name: 'Jogador',
    letter: 'a',
    stability: 4.2,
    difficulty: 3,
    interval: 10,
    repetitions: 3,
    next_review: '2026-08-20T12:00:00Z',
    total_attempts: 8,
    correct_attempts: 7,
    streak: 4,
    last_grade: 4,
    stars_earned: 12,
    level: 3,
  },
  {
    id: 'syllable-provider-id',
    letter: 'SYL_BA',
    total_attempts: 2,
    correct_attempts: 2,
    stars_earned: 2,
  },
  {
    id: 'word-provider-id',
    letter: 'WORD_CASA',
    total_attempts: 1,
    correct_attempts: 1,
    stars_earned: 1,
  },
];

const snapshot = createProgressSnapshot(source, {
  sourceProvider: 'base44',
  exportedAt: '2026-08-18T12:00:00Z',
});

assert.equal(snapshot.schema, 'lexia-progress-snapshot');
assert.equal(snapshot.version, 1);
assert.equal(snapshot.records.length, 3);
assert.equal(snapshot.records[0].letter, 'A');
assert.equal(snapshot.records[1].letter, 'SYL_BA');
assert.equal(snapshot.records[2].letter, 'WORD_CASA');
assert.equal('id' in snapshot.records[0], false, 'provider id must be stripped');
assert.equal('created_by' in snapshot.records[0], false, 'provider metadata must be stripped');
assert.equal(validateProgressSnapshot(snapshot).valid, true);

const tampered = structuredClone(snapshot);
tampered.records[0].id = 'must-not-pass';
assert.equal(validateProgressSnapshot(tampered).valid, false, 'snapshot must reject provider fields');
assert.throws(() => normalizeProgressRecord({ letter: '', total_attempts: 1 }));

const destination = [
  {
    id: 'dest-a', letter: 'A', total_attempts: 3, correct_attempts: 2, repetitions: 1,
    stars_earned: 2, streak: 1, stability: 1, difficulty: 3, interval: 1, last_grade: 3, level: 1,
  },
  {
    id: 'dest-syl', letter: 'SYL_BA', total_attempts: 10, correct_attempts: 9, repetitions: 0,
    stars_earned: 10, streak: 5, stability: 0, difficulty: 0, interval: 0, last_grade: 3, level: 1,
  },
];

const calls = [];
const fakePlatform = {
  provider: 'supabase',
  progress: {
    list: async () => destination,
    create: async (record) => {
      calls.push(['create', record.letter]);
      return { id: `created-${record.letter}`, ...record };
    },
    update: async (id, record) => {
      calls.push(['update', id, record.letter]);
      return { id, ...record };
    },
  },
};

const result = await importProgressSnapshot(snapshot, fakePlatform);
assert.deepEqual(
  { created: result.created, updated: result.updated, skipped: result.skipped },
  { created: 1, updated: 1, skipped: 1 }
);
assert.deepEqual(calls, [
  ['update', 'dest-a', 'A'],
  ['create', 'WORD_CASA'],
]);

const forceCalls = [];
const forcePlatform = {
  provider: 'supabase',
  progress: {
    list: async () => destination,
    create: async (record) => ({ id: `created-${record.letter}`, ...record }),
    update: async (id, record) => {
      forceCalls.push([id, record.letter]);
      return { id, ...record };
    },
  },
};
const forceResult = await importProgressSnapshot(snapshot, forcePlatform, { force: true });
assert.equal(forceResult.updated, 2);
assert.ok(forceCalls.some(([id]) => id === 'dest-syl'));

console.log('Lexia progress snapshot M04-D contract: PASS (portable, provider IDs stripped, conservative merge)');
