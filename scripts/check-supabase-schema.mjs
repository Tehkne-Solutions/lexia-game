import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), 'utf8');
}

const types = await text('src/platform/supabase.types.ts');
const migration001 = await text('supabase/migrations/202608180001_lexia_progress.sql');
const migration002 = await text('supabase/migrations/202608180002_lexia_drawings_bucket.sql');
const migration003 = await text('supabase/migrations/202608180003_reconcile_legacy_lexia_progress_schema.sql');
const migration004 = await text('supabase/migrations/202608180004_remove_empty_legacy_progress.sql');

assert.match(types, /lexia_progress:/, 'generated live types must expose lexia_progress');

for (const field of [
  'user_id',
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
]) {
  assert.match(types, new RegExp(`\\b${field}:`), `live schema types must include ${field}`);
}

assert.match(migration001, /user_id uuid not null default auth\.uid\(\)/, 'canonical schema must be owned by auth.uid()');
assert.match(migration001, /unique \(user_id, letter\)/i, 'canonical schema must prevent duplicate learner keys');
assert.match(migration001, /enable row level security/i, 'canonical schema must enable RLS');
assert.match(migration001, /Incompatible legacy public\.lexia_progress detected/, 'canonical migration must fail closed on incompatible legacy schema');

assert.match(migration002, /'lexia-drawings'/, 'drawing bucket migration must target lexia-drawings');
assert.match(migration002, /false,\s*2097152/s, 'drawing bucket must remain private with 2 MiB limit');

assert.match(migration003, /Refusing to replace non-empty legacy public\.lexia_progress/, 'legacy lexia_progress reconciliation must fail closed on data');
assert.match(migration003, /drop table public\.lexia_progress/, 'legacy reconciliation must explicitly replace only the incompatible empty table');

assert.match(migration004, /Refusing to remove non-empty legacy public\.progress/, 'old progress cleanup must fail closed on data');
assert.match(migration004, /drop table public\.progress/, 'old empty progress table cleanup must be explicit');

console.log('Supabase schema contract PASS');
