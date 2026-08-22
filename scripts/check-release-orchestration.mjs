import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolvePlatformProvider } from '../src/platform/providerConfig.js';

const cutover = await readFile(new URL('../docs/CUTOVER-M05.md', import.meta.url), 'utf8');
const authWorkflow = await readFile(new URL('../.github/workflows/live-supabase-auth-smoke.yml', import.meta.url), 'utf8');
const servicesWorkflow = await readFile(new URL('../.github/workflows/live-supabase-services-smoke.yml', import.meta.url), 'utf8');
const browserWorkflow = await readFile(new URL('../.github/workflows/live-supabase-browser-smoke.yml', import.meta.url), 'utf8');
const attestationWorkflow = await readFile(new URL('../.github/workflows/supabase-release-attestation.yml', import.meta.url), 'utf8');
const attestation = await readFile(new URL('./run-m10-release-attestation.mjs', import.meta.url), 'utf8');

assert.equal(resolvePlatformProvider({}), 'supabase', 'M10 must preserve Supabase as the runtime default');

for (const phrase of [
  'old ownership/import procedure was superseded by **M06 Fresh Start**',
  'No historical learner data may be migrated',
  'importing historical progress',
  'successful M10 attestation produces a release-evidence artifact. It **does not deploy**',
]) {
  assert.ok(cutover.includes(phrase), `M10 cutover runbook must preserve Fresh Start/release semantics: ${phrase}`);
}
for (const stale of [
  'Historical source audit has 70 progress records',
  'destination ownership is explicitly resolved',
  'select which historical ownership bucket(s) belong to that learner',
]) {
  assert.equal(cutover.includes(stale), false, `stale migration instruction must be retired: ${stale}`);
}

for (const workflow of [authWorkflow, servicesWorkflow, browserWorkflow]) {
  assert.ok(workflow.includes('workflow_dispatch:'), 'every M09 live proof must remain manual');
  assert.ok(workflow.includes('environment: lexia-live-smoke'), 'every M09 live proof must remain behind lexia-live-smoke');
}
assert.ok(authWorkflow.includes('lexia-m09b-auth-rest-storage-recovery-${{ inputs.recovery }}'));
assert.ok(authWorkflow.includes('if: success()'));
assert.ok(servicesWorkflow.includes('lexia-m09d-services-${{ inputs.service }}'));
assert.ok(servicesWorkflow.includes('if: success()'));
assert.ok(browserWorkflow.includes('lexia-m09e-supabase-browser-cutover'));

assert.ok(attestationWorkflow.includes('name: Lexia Supabase Release Attestation'));
assert.ok(attestationWorkflow.includes('workflow_dispatch:'));
assert.ok(attestationWorkflow.includes('contents: read'));
assert.ok(attestationWorkflow.includes('actions: read'));
assert.ok(attestationWorkflow.includes('environment: lexia-release-approval'));
for (const input of ['auth_run_id', 'services_run_id', 'browser_run_id', 'auth_redirect_evidence_url']) {
  assert.ok(attestationWorkflow.includes(`${input}:`), `M10 workflow must require ${input}`);
}
assert.ok(attestationWorkflow.includes('node scripts/run-m10-release-attestation.mjs'));
assert.ok(attestationWorkflow.includes('lexia-m10-release-attestation'));
assert.equal(/\bvercel\b/i.test(attestationWorkflow), false, 'M10 attestation must not deploy through Vercel');
assert.equal(attestationWorkflow.includes('VITE_LEXIA_PLATFORM_PROVIDER'), false, 'M10 attestation must not switch provider');
assert.equal(attestationWorkflow.includes('secrets.'), false, 'M10 attestation itself needs no application secret');

for (const invariant of [
  "assert.equal(refName, 'main'",
  "assert.equal(run.status, 'completed'",
  "assert.equal(run.conclusion, 'success'",
  "assert.equal(run.event, 'workflow_dispatch'",
  "assert.equal(run.head_branch, 'main'",
  'assert.equal(run.head_sha, releaseSha',
  'assert.equal(run.name, spec.workflowName',
  'assert.equal(run.path, spec.workflowPath',
  'assert.equal(run.head_repository?.full_name, repository',
  "artifactName: 'lexia-m09b-auth-rest-storage-recovery-true'",
  "artifactName: 'lexia-m09d-services-both'",
  "artifactName: 'lexia-m09e-supabase-browser-cutover'",
  "redirectEvidenceUrl.startsWith('https://')",
  'authorized_for_controlled_preview: true',
  'production_deploy_performed: false',
  'legacy_progress_migration: false',
  'deployed_supabase_preview_still_required: true',
]) {
  assert.ok(attestation.includes(invariant), `M10 attestation must enforce: ${invariant}`);
}

assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(attestation + attestationWorkflow), false, 'M10 must not commit a publishable key literal');
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(attestation + attestationWorkflow), false, 'M10 must not commit service-role credentials');

console.log('Lexia M10 Release Orchestration contract: PASS (same-SHA live evidence, Fresh Start, attestation-only, no deploy)');
