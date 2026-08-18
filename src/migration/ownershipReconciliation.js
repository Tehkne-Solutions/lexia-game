import {
  compareProgressStrength,
  createProgressSnapshot,
  normalizeProgressRecord,
} from './progressSnapshot.js';

export const ANONYMOUS_OWNER = 'anonymous';
export const UNKNOWN_OWNER = 'unknown';

export function getSourceOwnerRef(record) {
  const raw = record?.created_by_id;
  if (raw === ANONYMOUS_OWNER) return ANONYMOUS_OWNER;
  if (raw === null || raw === undefined || raw === '') return UNKNOWN_OWNER;
  return String(raw);
}

export function getProgressKind(letter) {
  const key = String(letter || '').toUpperCase();
  if (/^[A-Z]$/.test(key)) return 'letter';
  if (key.startsWith('SYL_')) return 'syllable';
  if (key.startsWith('WORD_')) return 'word';
  return 'other';
}

export function auditProgressOwnership(records) {
  if (!Array.isArray(records)) throw new Error('Progress ownership audit requires an array');

  const owners = new Map();
  const kinds = { letter: 0, syllable: 0, word: 0, other: 0 };

  for (const record of records) {
    const ownerRef = getSourceOwnerRef(record);
    const kind = getProgressKind(record?.letter);
    kinds[kind] += 1;

    const current = owners.get(ownerRef) || {
      ownerRef,
      records: 0,
      kinds: { letter: 0, syllable: 0, word: 0, other: 0 },
    };
    current.records += 1;
    current.kinds[kind] += 1;
    owners.set(ownerRef, current);
  }

  return {
    totalRecords: records.length,
    kinds,
    owners: [...owners.values()].sort((a, b) => b.records - a.records),
  };
}

export function reconcileProgressOwnership(
  records,
  {
    selectedOwnerRefs,
    sourceProvider = 'base44',
    exportedAt = new Date().toISOString(),
  } = {}
) {
  if (!Array.isArray(records)) throw new Error('Progress reconciliation requires an array');
  if (!Array.isArray(selectedOwnerRefs) || selectedOwnerRefs.length === 0) {
    throw new Error('Progress reconciliation requires explicit selectedOwnerRefs');
  }

  const selected = new Set(selectedOwnerRefs.map(String));
  const filtered = records.filter((record) => selected.has(getSourceOwnerRef(record)));
  const bestByKey = new Map();
  let duplicateKeysResolved = 0;

  for (const record of filtered) {
    const normalized = normalizeProgressRecord(record);
    const existing = bestByKey.get(normalized.letter);
    if (!existing) {
      bestByKey.set(normalized.letter, normalized);
      continue;
    }

    duplicateKeysResolved += 1;
    if (compareProgressStrength(normalized, existing) > 0) {
      bestByKey.set(normalized.letter, normalized);
    }
  }

  const portableRecords = [...bestByKey.values()].sort((a, b) => a.letter.localeCompare(b.letter));
  const snapshot = createProgressSnapshot(portableRecords, { sourceProvider, exportedAt });
  const kinds = portableRecords.reduce(
    (result, record) => {
      result[getProgressKind(record.letter)] += 1;
      return result;
    },
    { letter: 0, syllable: 0, word: 0, other: 0 }
  );

  return {
    snapshot,
    report: {
      selectedOwnerRefs: [...selected],
      selectedRecords: filtered.length,
      uniqueRecords: portableRecords.length,
      duplicateKeysResolved,
      kinds,
    },
  };
}
