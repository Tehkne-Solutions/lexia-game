export const PROGRESS_SNAPSHOT_SCHEMA = 'lexia-progress-snapshot';
export const PROGRESS_SNAPSHOT_VERSION = 1;

const MAX_KEY_LENGTH = 64;
const SNAPSHOT_FIELDS = Object.freeze([
  'child_name',
  'letter',
  'stability',
  'difficulty',
  'interval',
  'repetitions',
  'next_review',
  'total_attempts',
  'correct_attempts',
  'streak',
  'last_grade',
  'stars_earned',
  'level',
]);

const NUMBER_DEFAULTS = Object.freeze({
  stability: 0,
  difficulty: 0,
  interval: 0,
  repetitions: 0,
  total_attempts: 0,
  correct_attempts: 0,
  streak: 0,
  last_grade: 0,
  stars_earned: 0,
  level: 1,
});

function asFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asNonNegativeInteger(value, fallback = 0) {
  return Math.max(0, Math.trunc(asFiniteNumber(value, fallback)));
}

function normalizeKey(value) {
  const key = String(value || '').trim().toUpperCase();
  if (!key || key.length > MAX_KEY_LENGTH) {
    throw new Error(`Invalid Lexia progress key: ${String(value || '')}`);
  }
  return key;
}

function normalizeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid next_review date: ${String(value)}`);
  }
  return parsed.toISOString();
}

export function normalizeProgressRecord(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Progress record must be an object');
  }

  const normalized = {
    child_name: String(record.child_name || 'Jogador').trim().slice(0, 120) || 'Jogador',
    letter: normalizeKey(record.letter),
    stability: Math.max(0, asFiniteNumber(record.stability, NUMBER_DEFAULTS.stability)),
    difficulty: Math.max(0, asFiniteNumber(record.difficulty, NUMBER_DEFAULTS.difficulty)),
    interval: asNonNegativeInteger(record.interval, NUMBER_DEFAULTS.interval),
    repetitions: asNonNegativeInteger(record.repetitions, NUMBER_DEFAULTS.repetitions),
    next_review: normalizeDate(record.next_review),
    total_attempts: asNonNegativeInteger(record.total_attempts, NUMBER_DEFAULTS.total_attempts),
    correct_attempts: asNonNegativeInteger(record.correct_attempts, NUMBER_DEFAULTS.correct_attempts),
    streak: asNonNegativeInteger(record.streak, NUMBER_DEFAULTS.streak),
    last_grade: Math.max(0, Math.min(4, Math.trunc(asFiniteNumber(record.last_grade, NUMBER_DEFAULTS.last_grade)))),
    stars_earned: asNonNegativeInteger(record.stars_earned, NUMBER_DEFAULTS.stars_earned),
    level: Math.max(1, Math.trunc(asFiniteNumber(record.level, NUMBER_DEFAULTS.level))),
  };

  if (normalized.correct_attempts > normalized.total_attempts) {
    normalized.correct_attempts = normalized.total_attempts;
  }

  return normalized;
}

export function createProgressSnapshot(records, { sourceProvider = 'unknown', exportedAt = new Date().toISOString() } = {}) {
  if (!Array.isArray(records)) throw new Error('Progress records must be an array');
  const exportedDate = new Date(exportedAt);
  if (Number.isNaN(exportedDate.getTime())) throw new Error('Invalid snapshot export date');

  const normalizedRecords = records.map(normalizeProgressRecord);
  const uniqueKeys = new Set(normalizedRecords.map((record) => record.letter));
  if (uniqueKeys.size !== normalizedRecords.length) {
    throw new Error('Snapshot cannot contain duplicate progress keys');
  }

  return {
    schema: PROGRESS_SNAPSHOT_SCHEMA,
    version: PROGRESS_SNAPSHOT_VERSION,
    sourceProvider: String(sourceProvider || 'unknown').trim().slice(0, 64) || 'unknown',
    exportedAt: exportedDate.toISOString(),
    records: normalizedRecords,
  };
}

export function validateProgressSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object') {
    return { valid: false, errors: ['snapshot must be an object'] };
  }
  if (snapshot.schema !== PROGRESS_SNAPSHOT_SCHEMA) errors.push('unsupported snapshot schema');
  if (snapshot.version !== PROGRESS_SNAPSHOT_VERSION) errors.push('unsupported snapshot version');
  if (!Array.isArray(snapshot.records)) errors.push('snapshot records must be an array');
  if (Number.isNaN(new Date(snapshot.exportedAt).getTime())) errors.push('invalid exportedAt');

  if (Array.isArray(snapshot.records)) {
    const keys = new Set();
    snapshot.records.forEach((record, index) => {
      try {
        const normalized = normalizeProgressRecord(record);
        if (keys.has(normalized.letter)) errors.push(`duplicate progress key at index ${index}: ${normalized.letter}`);
        keys.add(normalized.letter);
        const unexpected = Object.keys(record).filter((key) => !SNAPSHOT_FIELDS.includes(key));
        if (unexpected.length > 0) errors.push(`unexpected provider field(s) at index ${index}: ${unexpected.join(', ')}`);
      } catch (error) {
        errors.push(`invalid record at index ${index}: ${error.message}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function progressStrength(record) {
  const normalized = normalizeProgressRecord(record);
  return [
    normalized.total_attempts,
    normalized.repetitions,
    normalized.stars_earned,
    normalized.correct_attempts,
    normalized.streak,
    normalized.stability,
    normalized.level,
  ];
}

export function compareProgressStrength(incoming, existing) {
  const incomingStrength = progressStrength(incoming);
  const existingStrength = progressStrength(existing);
  for (let index = 0; index < incomingStrength.length; index += 1) {
    if (incomingStrength[index] > existingStrength[index]) return 1;
    if (incomingStrength[index] < existingStrength[index]) return -1;
  }
  return 0;
}

export async function exportProgressSnapshot(platform, options = {}) {
  if (!platform?.progress || typeof platform.progress.list !== 'function') {
    throw new Error('Platform does not support progress export');
  }
  const records = await platform.progress.list();
  return createProgressSnapshot(records, {
    sourceProvider: options.sourceProvider || platform.provider || 'unknown',
    exportedAt: options.exportedAt,
  });
}

export async function importProgressSnapshot(snapshot, platform, { force = false } = {}) {
  const validation = validateProgressSnapshot(snapshot);
  if (!validation.valid) {
    throw new Error(`Invalid Lexia progress snapshot: ${validation.errors.join('; ')}`);
  }
  if (!platform?.progress || ['list', 'create', 'update'].some((method) => typeof platform.progress[method] !== 'function')) {
    throw new Error('Platform does not support progress import');
  }

  const existingRecords = await platform.progress.list();
  const existingByKey = new Map(
    (existingRecords || [])
      .filter((record) => record?.letter)
      .map((record) => [String(record.letter).toUpperCase(), record])
  );

  const result = { created: 0, updated: 0, skipped: 0, records: [] };

  for (const rawRecord of snapshot.records) {
    const incoming = normalizeProgressRecord(rawRecord);
    const existing = existingByKey.get(incoming.letter);

    if (!existing) {
      const created = await platform.progress.create(incoming);
      existingByKey.set(incoming.letter, created || incoming);
      result.created += 1;
      result.records.push({ letter: incoming.letter, action: 'created' });
      continue;
    }

    const shouldUpdate = force || compareProgressStrength(incoming, existing) > 0;
    if (!shouldUpdate) {
      result.skipped += 1;
      result.records.push({ letter: incoming.letter, action: 'skipped' });
      continue;
    }

    if (!existing.id) {
      throw new Error(`Destination record for ${incoming.letter} has no id`);
    }
    const updated = await platform.progress.update(existing.id, incoming);
    existingByKey.set(incoming.letter, updated || { ...existing, ...incoming });
    result.updated += 1;
    result.records.push({ letter: incoming.letter, action: 'updated' });
  }

  return result;
}
