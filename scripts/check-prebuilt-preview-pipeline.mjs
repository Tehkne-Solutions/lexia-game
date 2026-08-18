import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/vercel-prebuilt-supabase-preview.yml', import.meta.url), 'utf8');
const deployedProof = await readFile(new URL('./run-live-deployed-supabase-preview-smoke.mjs', import.meta.url), 'utf8');

assert.ok(workflow.includes('name: Lexia Vercel Prebuilt Supabase Preview'));
assert.ok(workflow.includes('workflow_dispatch:'));
assert.ok(workflow.includes('environment: lexia-live-smoke'));
assert.ok(workflow.includes('contents: read'));

for (const secret of [
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
]) {
  assert.ok(workflow.includes(`secrets.${secret}`), `prebuilt preview must receive ${secret} from protected environment`);
}

assert.ok(workflow.includes('vercel pull --yes --environment=preview'));
assert.ok(workflow.includes('VITE_LEXIA_PLATFORM_PROVIDER: supabase'));
assert.ok(workflow.includes("VITE_LEXIA_SUPABASE_AUTH_READY: 'true'"));
assert.ok(workflow.includes("VITE_LEXIA_SUPABASE_EDGE_READY: 'true'"));
assert.ok(workflow.includes('VITE_LEXIA_RELEASE_SHA: ${{ github.sha }}'));
assert.ok(workflow.includes('vercel build --token="$VERCEL_TOKEN"'));
assert.ok(workflow.includes('vercel deploy --prebuilt --yes'));
assert.equal(workflow.includes('--prod'), false, 'M10-C must create a preview, never a production deployment');

assert.ok(workflow.includes("grep -Eo 'https://[A-Za-z0-9._-]+\\.vercel\\.app'"), 'generated deployment must be parsed as a Vercel preview URL');
assert.ok(workflow.includes('LEXIA_LIVE_PREVIEW_URL: ${{ steps.deploy.outputs.url }}'), 'deployed proof must receive URL created by the trusted deployment step');
assert.equal(workflow.includes('LEXIA_LIVE_PREVIEW_URL: ${{ inputs.'), false, 'deployment proof URL must never be arbitrary dispatch input');
assert.equal(workflow.includes('LEXIA_LIVE_PREVIEW_URL: ${{ secrets.LEXIA_LIVE_PREVIEW_URL }}'), false, 'M10-C must prove the URL it just created, not an unrelated stored preview');
assert.ok(workflow.includes('node scripts/run-live-deployed-supabase-preview-smoke.mjs'));
assert.ok(workflow.includes('if: success()'));
assert.ok(workflow.includes('lexia-m10c-prebuilt-vercel-supabase-preview'));

const buildStep = workflow.indexOf('Build Supabase preview locally in GitHub Actions');
const prebuiltDeploy = workflow.indexOf('vercel deploy --prebuilt --yes');
const browserProof = workflow.indexOf('node scripts/run-live-deployed-supabase-preview-smoke.mjs');
assert.ok(buildStep >= 0 && prebuiltDeploy > buildStep, 'local GitHub build must happen before prebuilt deployment');
assert.ok(browserProof > prebuiltDeploy, 'deployed browser proof must run after the trusted prebuilt deployment');

assert.ok(deployedProof.includes("assert.equal(buildIdentity.sha, expectedSha"));
assert.ok(deployedProof.includes("assert.equal(buildIdentity.provider, 'supabase'"));
assert.ok(deployedProof.includes("assert.equal(preview.protocol, 'https:'"));
assert.ok(deployedProof.includes('await cleanupUser()'));

assert.equal(/vcp_[A-Za-z0-9_-]{20,}/.test(workflow), false, 'Vercel token literal must never be committed');
assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(workflow), false, 'Supabase publishable key literal must never be committed');
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(workflow), false, 'Supabase service-role credential literal must never be committed');

console.log('Lexia M10-C Prebuilt Preview contract: PASS (GitHub local build -> Vercel prebuilt preview -> trusted deployed browser proof)');
