import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const smoke = await readFile(new URL('./run-live-supabase-services-smoke.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/live-supabase-services-smoke.yml', import.meta.url), 'utf8');

for (const secret of [
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
]) {
  assert.ok(smoke.includes(`'${secret}'`));
  assert.ok(workflow.includes(`secrets.${secret}`));
}

for (const path of [
  '/auth/v1/admin/users',
  '/auth/v1/token?grant_type=password',
  '/functions/v1/lexia-upload',
  '/functions/v1/lexia-ai',
  '/functions/v1/lexia-email',
  '/storage/v1/object/lexia-drawings/',
]) {
  assert.ok(smoke.includes(path), `M09-D must exercise ${path}`);
}

assert.ok(smoke.includes("['ai', 'email', 'both']"), 'services smoke must support isolated AI/email proofs');
assert.ok(smoke.includes("blocked.response.status, 403"), 'e-mail smoke must prove third-party recipient denial');
assert.ok(smoke.includes("recipient_must_match_authenticated_user"));
assert.ok(smoke.includes('AI score must be normalized to 0..100'));
assert.ok(smoke.includes('AI grade must be normalized to 1..4'));
assert.ok(smoke.includes('payload?.ok, true'));
assert.ok(smoke.includes('finally {'));
assert.ok(smoke.includes('cleanupStorage(path)'));
assert.ok(smoke.includes('cleanupUser()'));
assert.ok(workflow.includes('workflow_dispatch:'));
assert.ok(workflow.includes('environment: lexia-live-smoke'));
assert.ok(workflow.includes('type: choice'));
assert.ok(workflow.includes('- ai'));
assert.ok(workflow.includes('- email'));
assert.ok(workflow.includes('- both'));
assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(smoke + workflow), false);
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(smoke + workflow), false);

console.log('Lexia M09-D live services smoke contract: PASS (AI/e-mail isolated, authenticated, cleanup-enforced)');
