import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolvePlatformProvider } from '../src/platform/providerConfig.js';

const workflow = await readFile(new URL('../.github/workflows/production-candidate-attestation.yml', import.meta.url), 'utf8');
const attestation = await readFile(new URL('./run-m10d-production-candidate-attestation.mjs', import.meta.url), 'utf8');

assert.equal(resolvePlatformProvider({}), 'base44', 'M10-D must not change the safe runtime default');
assert.ok(workflow.includes('name: Lexia Production Candidate Attestation'));
assert.ok(workflow.includes('workflow_dispatch:'));
assert.ok(workflow.includes('environment: lexia-release-approval'));
assert.ok(workflow.includes('contents: read'));
assert.ok(workflow.includes('actions: read'));
for (const input of [
  'release_attestation_run_id',
  'deployed_preview_run_id',
  'production_origin',
  'rollback_evidence_url',
]) {
  assert.ok(workflow.includes(`${input}:`), `M10-D workflow must require ${input}`);
}
assert.ok(workflow.includes('node scripts/run-m10d-production-candidate-attestation.mjs'));
assert.ok(workflow.includes('lexia-m10d-production-candidate-attestation'));
assert.equal(workflow.includes('secrets.'), false, 'M10-D attestation requires no application secrets');
assert.equal(/\bvercel\b/i.test(workflow), false, 'M10-D must not deploy to Vercel');
assert.equal(workflow.includes('VITE_LEXIA_PLATFORM_PROVIDER'), false, 'M10-D must not switch provider');

for (const invariant of [
  "assert.equal(refName, 'main'",
  "assert.equal(run.status, 'completed'",
  "assert.equal(run.conclusion, 'success'",
  "assert.equal(run.event, 'workflow_dispatch'",
  "assert.equal(run.head_branch, 'main'",
  'assert.equal(run.head_sha, releaseSha',
  'assert.equal(run.head_repository?.full_name, repository',
  "names: ['Lexia Supabase Release Attestation']",
  "paths: ['.github/workflows/supabase-release-attestation.yml']",
  "artifacts: ['lexia-m10-release-attestation']",
  "'Lexia Live Deployed Supabase Preview'",
  "'Lexia Vercel Prebuilt Supabase Preview'",
  "'.github/workflows/live-deployed-supabase-preview-smoke.yml'",
  "'.github/workflows/vercel-prebuilt-supabase-preview.yml'",
  "'lexia-m10b-deployed-supabase-preview'",
  "'lexia-m10c-prebuilt-vercel-supabase-preview'",
  "assert.equal(url.protocol, 'https:'",
  "rollbackEvidenceUrl.startsWith('https://')",
  'authorized_for_production_configuration: true',
  'production_deploy_performed: false',
  'production_provider_switch_performed: false',
  'post_switch_production_smoke_required: true',
  'legacy_progress_migration: false',
]) {
  assert.ok(attestation.includes(invariant), `M10-D must enforce ${invariant}`);
}

assert.ok(attestation.includes('assert.notEqual(releaseAttestationRunId, deployedPreviewRunId'));
assert.ok(attestation.includes('!item.expired'), 'M10-D must reject expired release evidence');
assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(attestation + workflow), false, 'M10-D must not commit Supabase keys');
assert.equal(/vcp_[A-Za-z0-9_-]{20,}/.test(attestation + workflow), false, 'M10-D must not commit Vercel tokens');

console.log('Lexia M10-D Production Candidate contract: PASS (same-SHA release attestation + deployed preview + rollback evidence, no deploy/provider switch)');
