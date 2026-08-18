import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const smoke = await readFile(new URL('./run-live-supabase-auth-smoke.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/live-supabase-auth-smoke.yml', import.meta.url), 'utf8');

for (const secret of [
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
]) {
  assert.ok(smoke.includes(`'${secret}'`), `live smoke must fail closed on ${secret}`);
  assert.ok(workflow.includes(`secrets.${secret}`), `manual workflow must inject ${secret} from GitHub secrets`);
}

for (const endpoint of [
  '/auth/v1/signup',
  '/auth/v1/token?grant_type=password',
  '/auth/v1/token?grant_type=refresh_token',
  '/auth/v1/logout',
  '/rest/v1/lexia_progress',
  '/functions/v1/lexia-upload',
  '/storage/v1/object/lexia-drawings/',
]) {
  assert.ok(smoke.includes(endpoint), `live smoke must exercise ${endpoint}`);
}

assert.ok(smoke.includes("progressList(sessionA.access_token)).length, 0"), 'fresh account must prove zero progress');
assert.ok(smoke.includes("progressList(sessionB.access_token)).length, 0"), 'second fresh account must prove zero progress');
assert.ok(smoke.includes('A must see only A progress through real REST/JWT RLS'));
assert.ok(smoke.includes('A must not update B progress through REST/JWT RLS'));
assert.ok(smoke.includes('A must not delete B progress through REST/JWT RLS'));
assert.ok(smoke.includes('lexia-upload must reject missing user JWT'));
assert.ok(smoke.includes("payload.path.startsWith(`${expectedUserId}/`)"), 'drawing object must be scoped by authenticated user');
assert.ok(smoke.includes("payload?.expires_in, 300"), 'signed URL lifetime must remain five minutes');
assert.ok(smoke.includes('signed drawing URL must be readable without client credentials'));
assert.ok(smoke.includes('logout must revoke the session refresh token'));
assert.ok(smoke.includes('finally {'), 'cleanup must run even after failed assertions');
assert.ok(smoke.includes('adminDeleteStorageObject(path)'), 'disposable Storage objects must be deleted');
assert.ok(smoke.includes('adminDeleteUser(id)'), 'disposable Auth users must be deleted');
assert.ok(smoke.includes('ON DELETE CASCADE') === false, 'smoke harness must not attempt schema mutation');
assert.ok(workflow.includes('workflow_dispatch:'), 'live proof must be explicit/manual');
assert.ok(workflow.includes('environment: lexia-live-smoke'), 'live proof must be isolated behind a GitHub environment');
assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(smoke + workflow), false, 'no publishable key literal may be committed');
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(smoke + workflow), false, 'no service-role credential literal may be committed');

console.log('Lexia M09-C live runtime smoke contract: PASS (Auth + REST/JWT RLS + private Storage + cleanup)');
