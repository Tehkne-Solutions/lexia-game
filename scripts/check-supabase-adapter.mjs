import assert from 'node:assert/strict';
import { createSupabaseAdapter } from '../src/platform/adapters/supabaseAdapter.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const calls = [];
const queue = [];

globalThis.fetch = async (url, options = {}) => {
  calls.push({ url, options });
  const next = queue.shift();
  assert.ok(next, `unexpected fetch call: ${url}`);
  return new Response(JSON.stringify(next.body), {
    status: next.status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const adapter = createSupabaseAdapter({
  url: 'https://lexia-contract.supabase.co',
  publishableKey: 'sb_publishable_contract_only',
  authReady: true,
  edgeReady: true,
  aiFunction: 'lexia-ai',
  emailFunction: 'lexia-email',
  uploadFunction: 'lexia-upload',
});

assert.equal(adapter.provider, 'supabase');
assert.equal(adapter.readiness.ready, true);

queue.push({
  body: {
    access_token: 'access-1',
    refresh_token: 'refresh-1',
    expires_in: 3600,
    user: { id: 'user-1', email: 'learner@example.invalid' },
  },
});

await adapter.auth.signInWithPassword({
  email: 'learner@example.invalid',
  password: 'contract-only',
});

assert.equal(adapter.auth.hasAccessToken(), true);
assert.equal(adapter.session.read().access_token, 'access-1');
assert.match(calls[0].url, /\/auth\/v1\/token\?grant_type=password$/);
assert.equal(calls[0].options.method, 'POST');
assert.equal(calls[0].options.headers.get('apikey'), 'sb_publishable_contract_only');
assert.equal(calls[0].options.headers.get('Authorization'), null, 'password sign-in must not send stale bearer token');

queue.push({ body: [{ id: 'progress-1', user_id: 'user-1', letter: 'I' }] });
const progress = await adapter.progress.list();
assert.equal(progress.length, 1);
assert.equal(progress[0].letter, 'I');
assert.match(calls[1].url, /\/rest\/v1\/lexia_progress\?select=\*&order=letter\.asc$/);
assert.equal(calls[1].options.headers.get('Authorization'), 'Bearer access-1');

queue.push({ body: [{ id: 'progress-2', user_id: 'user-1', letter: 'U' }] });
const created = await adapter.progress.create({ letter: 'U' });
assert.equal(created.id, 'progress-2');
assert.equal(calls[2].options.method, 'POST');
assert.equal(calls[2].options.headers.get('Prefer'), 'return=representation');
assert.deepEqual(JSON.parse(calls[2].options.body), { letter: 'U' });

adapter.session.write({
  access_token: 'expired-access',
  refresh_token: 'refresh-2',
  expires_at: Math.floor(Date.now() / 1000) - 1,
});
queue.push({
  body: {
    access_token: 'access-2',
    refresh_token: 'refresh-3',
    expires_in: 3600,
  },
});
queue.push({ body: [{ id: 'progress-3', user_id: 'user-1', letter: 'E' }] });
const refreshedProgress = await adapter.progress.list();
assert.equal(refreshedProgress[0].letter, 'E');
assert.match(calls[3].url, /\/auth\/v1\/token\?grant_type=refresh_token$/);
assert.equal(calls[3].options.headers.get('Authorization'), null, 'refresh must not use expired access token');
assert.equal(calls[4].options.headers.get('Authorization'), 'Bearer access-2');

const incomplete = createSupabaseAdapter({
  url: '',
  publishableKey: '',
  authReady: false,
  edgeReady: false,
});
assert.equal(incomplete.readiness.ready, false);
assert.ok(incomplete.readiness.missing.includes('VITE_SUPABASE_URL'));
await assert.rejects(
  () => incomplete.auth.signInWithPassword({ email: 'x@example.invalid', password: 'x' }),
  /not release-ready/i,
);

console.log('Supabase adapter contract PASS');
