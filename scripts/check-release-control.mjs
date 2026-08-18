import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-release-control.yml', import.meta.url), 'utf8');
const orchestrator = await readFile(new URL('./run-m11-release-control.mjs', import.meta.url), 'utf8');
const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

for (const required of [
  'name: Lexia Supabase Release Control',
  'workflow_dispatch:',
  'actions: write',
  'contents: read',
  'environment: lexia-release-approval',
  'cancel-in-progress: false',
  'node scripts/run-m11-release-control.mjs',
  'lexia-m11-release-control-candidate',
]) {
  assert.ok(workflow.includes(required), `M11 workflow missing: ${required}`);
}

for (const forbidden of [
  'contents: write',
  'secrets.LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'secrets.VERCEL_TOKEN',
  '--prod',
  'VITE_LEXIA_PLATFORM_PROVIDER=supabase',
]) {
  assert.ok(!workflow.includes(forbidden), `M11 control workflow must not contain: ${forbidden}`);
}

const ordered = [
  "file: 'live-supabase-auth-smoke.yml'",
  "inputs: { recovery: 'true' }",
  "artifact: 'lexia-m09b-auth-rest-storage-recovery-true'",
  "file: 'live-supabase-services-smoke.yml'",
  "inputs: { service: 'both' }",
  "artifact: 'lexia-m09d-services-both'",
  "file: 'live-supabase-browser-smoke.yml'",
  "artifact: 'lexia-m09e-supabase-browser-cutover'",
  "file: 'supabase-release-attestation.yml'",
  "artifact: 'lexia-m10-release-attestation'",
  "file: 'production-candidate-attestation.yml'",
  "artifact: 'lexia-m10d-production-candidate-attestation'",
];
let previous = -1;
for (const token of ordered) {
  const index = orchestrator.indexOf(token);
  assert.ok(index > previous, `M11 release order missing or out of order: ${token}`);
  previous = index;
}

for (const previewToken of [
  "file: 'vercel-prebuilt-supabase-preview.yml'",
  "artifact: 'lexia-m10c-prebuilt-vercel-supabase-preview'",
  "file: 'live-deployed-supabase-preview-smoke.yml'",
  "artifact: 'lexia-m10b-deployed-supabase-preview'",
]) {
  assert.ok(orchestrator.includes(previewToken), `M11 must retain both preview paths: ${previewToken}`);
}

for (const guardrail of [
  "if (refName !== 'main')",
  "const { data } = await api('/branches/main')",
  'current !== releaseSha',
  "body: { ref: 'main', inputs }",
  "run.head_sha !== releaseSha",
  "run.head_branch !== 'main'",
  "run.event !== 'workflow_dispatch'",
  '!item.expired',
  "production_deploy_performed: false",
  "production_provider_switch_performed: false",
  "next_required_gate:",
]) {
  assert.ok(orchestrator.includes(guardrail), `M11 same-SHA/fail-closed guard missing: ${guardrail}`);
}

assert.ok(orchestrator.includes("requireHttps(productionOrigin, 'Production origin', { rootOnly: true })"));
assert.ok(orchestrator.includes("requireHttps(authRedirectEvidenceUrl, 'Auth redirect evidence URL')"));
assert.ok(orchestrator.includes("requireHttps(rollbackEvidenceUrl, 'Rollback evidence URL')"));
assert.ok(orchestrator.includes("previewStrategy === 'prebuilt'"));
assert.ok(!orchestrator.includes('live-production-supabase-post-switch.yml'), 'M11 candidate control must not dispatch post-switch production proof');
assert.ok(!orchestrator.includes('/deployments'), 'M11 orchestrator itself must not deploy');
assert.ok(!orchestrator.includes('VITE_LEXIA_PLATFORM_PROVIDER'), 'M11 orchestrator must not change provider configuration');

for (const literal of ['sb_secret_', 'service_role=', 'SUPABASE_SERVICE_ROLE_KEY=']) {
  assert.ok(!workflow.includes(literal) && !orchestrator.includes(literal), `credential-like literal forbidden in M11: ${literal}`);
}

assert.ok(ci.includes('Release control contract'));
assert.ok(ci.includes('node scripts/check-release-control.mjs'));

console.log('Lexia M11 Release Control contract: PASS (same-SHA child dispatch, fail-closed evidence chain, no production switch)');
