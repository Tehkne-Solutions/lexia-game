import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getSupabaseProviderConfig,
  getSupabaseReadiness,
  resolvePlatformProvider,
} from '../src/platform/providerConfig.js';

const safe = resolvePlatformProvider({});
assert.equal(safe, 'supabase', 'production provider must default to Supabase');

const incomplete = getSupabaseProviderConfig({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_contract',
});
assert.equal(getSupabaseReadiness(incomplete).ready, false, 'Supabase cannot become ready without explicit Auth and Edge gates');
assert.ok(getSupabaseReadiness(incomplete).missing.includes('VITE_LEXIA_SUPABASE_AUTH_READY=true'));
assert.ok(getSupabaseReadiness(incomplete).missing.includes('VITE_LEXIA_SUPABASE_EDGE_READY=true'));

const ready = getSupabaseProviderConfig({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_contract',
  VITE_LEXIA_SUPABASE_AUTH_READY: 'true',
  VITE_LEXIA_SUPABASE_EDGE_READY: 'true',
});
assert.equal(getSupabaseReadiness(ready).ready, true);
assert.equal(ready.aiFunction, 'lexia-ai');
assert.equal(ready.emailFunction, 'lexia-email');
assert.equal(ready.uploadFunction, 'lexia-upload');

const adapter = await readFile(new URL('../src/platform/adapters/supabaseAdapter.js', import.meta.url), 'utf8');
for (const required of [
  '/auth/v1/token?grant_type=password',
  '/auth/v1/signup',
  '/auth/v1/recover',
  '/auth/v1/logout',
  'refresh_token',
  '/rest/v1/lexia_progress',
  '/functions/v1/',
]) {
  assert.ok(adapter.includes(required), `Supabase adapter must retain runtime path: ${required}`);
}
assert.ok(adapter.includes("headers.set('Authorization', `Bearer ${accessToken}`)"));
assert.ok(adapter.includes('ensureFreshSession'));

const login = await readFile(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
assert.ok(login.includes("parsed.origin !== window.location.origin"), 'returnTo must remain same-origin only');
assert.ok(login.includes('requestPasswordReset'));
assert.ok(login.includes('signInWithPassword'));
assert.ok(login.includes('signUp'));

const freshStart = await readFile(new URL('../scripts/check-fresh-start.mjs', import.meta.url), 'utf8');
assert.ok(freshStart.includes('No historical user/progress history will be migrated'));

const edgeContract = await readFile(new URL('../scripts/check-edge-functions.mjs', import.meta.url), 'utf8');
for (const fn of ['lexia-ai', 'lexia-email', 'lexia-upload']) {
  assert.ok(edgeContract.includes(fn), `Edge contract must retain ${fn}`);
}

const runbook = await readFile(new URL('../docs/M09-PRODUCTION-RUNTIME-READINESS.md', import.meta.url), 'utf8');
for (const proven of [
  'Supabase Auth users: **0**',
  'cross-user UPDATEs: **0**',
  'cross-user DELETEs: **0**',
  '300-second',
  'recipient that does not match the authenticated user',
]) {
  assert.ok(runbook.includes(proven), `M09 live evidence missing: ${proven}`);
}

assert.ok(runbook.includes('Prepared live proof harnesses — not yet a PASS'));
assert.ok(runbook.includes('their presence is not evidence that the live workflows have run successfully'));
for (const harness of [
  'live-supabase-auth-smoke.yml',
  'live-supabase-services-smoke.yml',
  'live-supabase-browser-smoke.yml',
]) {
  assert.ok(runbook.includes(harness), `M09 must document prepared harness without overclaiming: ${harness}`);
}

for (const remaining of [
  'real GoTrue password sign-up',
  'token refresh after reload',
  'password recovery/redirect behavior',
  'authenticated browser CRUD',
  'exact Auth site URL / redirect allow-list configuration',
  'Supabase provider-switch browser execution',
  'production provider cutover',
]) {
  assert.ok(runbook.includes(remaining), `M09 must keep unresolved gate explicit: ${remaining}`);
}
assert.ok(runbook.includes('remain unproven until those secret-backed workflows themselves produce green evidence'));
assert.ok(runbook.includes('does **not** authorize skipping Auth/browser E2E'));
assert.ok(runbook.includes('does not reopen legacy data migration'));

console.log('Lexia Production Runtime Readiness M09 contract: PASS (live proof recorded, prepared harnesses do not authorize cutover)');
