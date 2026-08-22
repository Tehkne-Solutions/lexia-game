import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolvePlatformProvider } from '../src/platform/providerConfig.js';

const workflow = await readFile(new URL('../.github/workflows/live-production-supabase-post-switch.yml', import.meta.url), 'utf8');
const precheck = await readFile(new URL('./verify-m10d-production-candidate-run.mjs', import.meta.url), 'utf8');
const browserProof = await readFile(new URL('./run-live-deployed-supabase-preview-smoke.mjs', import.meta.url), 'utf8');

assert.equal(resolvePlatformProvider({}), 'supabase', 'M10-E harness must preserve the Supabase provider');
assert.ok(workflow.includes('name: Lexia Live Production Supabase Post-Switch'));
assert.ok(workflow.includes('workflow_dispatch:'));
assert.ok(workflow.includes('environment: lexia-production-release'));
assert.ok(workflow.includes('contents: read'));
assert.ok(workflow.includes('actions: read'));
assert.ok(workflow.includes('production_candidate_run_id:'));
assert.ok(workflow.includes('LEXIA_PRODUCTION_URL }}'));
assert.ok(workflow.includes('LEXIA_LIVE_PREVIEW_URL: ${{ secrets.LEXIA_PRODUCTION_URL }}'));
assert.equal(workflow.includes('LEXIA_LIVE_PREVIEW_URL: ${{ inputs.'), false, 'production origin must never be arbitrary workflow input');
assert.equal(workflow.includes('LEXIA_PRODUCTION_URL: ${{ inputs.'), false, 'production origin must remain protected secret configuration');
assert.ok(workflow.includes('node scripts/verify-m10d-production-candidate-run.mjs'));
assert.ok(workflow.includes('node scripts/run-live-deployed-supabase-preview-smoke.mjs'));
assert.ok(workflow.includes('if: success()'));
assert.ok(workflow.includes('lexia-m10e-production-post-switch'));
assert.equal(/\bvercel\b/i.test(workflow), false, 'M10-E must not deploy or modify Vercel');
assert.equal(workflow.includes('VITE_LEXIA_PLATFORM_PROVIDER'), false, 'M10-E must inspect the public production build rather than switching it');

for (const invariant of [
  "assert.equal(process.env.GITHUB_REF_NAME, 'main'",
  "assert.equal(run.status, 'completed'",
  "assert.equal(run.conclusion, 'success'",
  "assert.equal(run.event, 'workflow_dispatch'",
  "assert.equal(run.head_branch, 'main'",
  'assert.equal(run.head_sha, sha',
  "assert.equal(run.name, 'Lexia Production Candidate Attestation'",
  "assert.equal(run.path, '.github/workflows/production-candidate-attestation.yml'",
  "item.name === 'lexia-m10d-production-candidate-attestation' && !item.expired",
]) {
  assert.ok(precheck.includes(invariant), `M10-E precheck must enforce ${invariant}`);
}

const candidateCheck = workflow.indexOf('node scripts/verify-m10d-production-candidate-run.mjs');
const publicBrowserProof = workflow.indexOf('node scripts/run-live-deployed-supabase-preview-smoke.mjs');
assert.ok(candidateCheck >= 0 && publicBrowserProof > candidateCheck, 'production candidate evidence must pass before public-origin browser credentials are used');

assert.ok(browserProof.includes("assert.equal(preview.protocol, 'https:'"));
assert.ok(browserProof.includes('assert.equal(buildIdentity.sha, expectedSha'));
assert.ok(browserProof.includes("assert.equal(buildIdentity.provider, 'supabase'"));
assert.ok(browserProof.includes('await createDisposableUser()'));
assert.ok(browserProof.includes('await fillLogin()'));
assert.ok(browserProof.indexOf("assert.equal(buildIdentity.provider, 'supabase'") < browserProof.indexOf('await createDisposableUser()'));
assert.ok(browserProof.includes("clickButton('Sair da conta')"));
assert.ok(browserProof.includes('await cleanupUser()'));

assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(workflow + precheck), false, 'M10-E must not commit Supabase keys');
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(workflow + precheck), false, 'M10-E must not commit service-role credentials');

console.log('Lexia M10-E Production Post-Switch contract: PASS (M10-D same-SHA precheck + secret production origin + identity-before-credentials browser proof)');
