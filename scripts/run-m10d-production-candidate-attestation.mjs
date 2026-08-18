import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const requiredEnv = [
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'GITHUB_REF_NAME',
  'GITHUB_TOKEN',
  'LEXIA_RELEASE_ATTESTATION_RUN_ID',
  'LEXIA_DEPLOYED_PREVIEW_RUN_ID',
  'LEXIA_PRODUCTION_ORIGIN',
  'LEXIA_ROLLBACK_EVIDENCE_URL',
];
const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`M10-D production candidate attestation missing environment: ${missing.join(', ')}`);

const repository = process.env.GITHUB_REPOSITORY;
const releaseSha = process.env.GITHUB_SHA;
const refName = process.env.GITHUB_REF_NAME;
const token = process.env.GITHUB_TOKEN;
const apiUrl = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');

assert.equal(refName, 'main', 'M10-D may only run from main');
assert.match(releaseSha, /^[0-9a-f]{40}$/i, 'M10-D requires an exact release SHA');

function parseRootHttps(raw, label) {
  const url = new URL(String(raw).trim());
  assert.equal(url.protocol, 'https:', `${label} must use HTTPS`);
  assert.equal(url.username, '', `${label} must not contain embedded credentials`);
  assert.equal(url.password, '', `${label} must not contain embedded credentials`);
  assert.equal(url.pathname, '/', `${label} must be a root origin URL`);
  assert.equal(url.search, '', `${label} must not contain query parameters`);
  assert.equal(url.hash, '', `${label} must not contain fragments`);
  return url.origin;
}

const productionOrigin = parseRootHttps(process.env.LEXIA_PRODUCTION_ORIGIN, 'production origin');
const rollbackEvidenceUrl = String(process.env.LEXIA_ROLLBACK_EVIDENCE_URL).trim();
assert.ok(rollbackEvidenceUrl.startsWith('https://'), 'rollback evidence must be an HTTPS reference');

const releaseAttestationRunId = String(process.env.LEXIA_RELEASE_ATTESTATION_RUN_ID);
const deployedPreviewRunId = String(process.env.LEXIA_DEPLOYED_PREVIEW_RUN_ID);
assert.match(releaseAttestationRunId, /^\d+$/, 'invalid M10-A attestation run ID');
assert.match(deployedPreviewRunId, /^\d+$/, 'invalid deployed preview run ID');
assert.notEqual(releaseAttestationRunId, deployedPreviewRunId, 'M10-D requires distinct attestation and preview run IDs');

async function github(pathname) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'lexia-m10d-production-candidate-attestation',
    },
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    throw new Error(`GitHub evidence request failed ${response.status} for ${pathname}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function requireRun(runId, { names, paths, artifacts }) {
  const run = await github(`/repos/${repository}/actions/runs/${runId}`);
  assert.equal(run.status, 'completed', `${runId}: run must be completed`);
  assert.equal(run.conclusion, 'success', `${runId}: run must conclude success`);
  assert.equal(run.event, 'workflow_dispatch', `${runId}: run must come from workflow_dispatch`);
  assert.equal(run.head_branch, 'main', `${runId}: run must execute from main`);
  assert.equal(run.head_sha, releaseSha, `${runId}: run SHA must equal current production-candidate SHA`);
  assert.equal(run.head_repository?.full_name, repository, `${runId}: run must belong to this repository`);
  assert.ok(names.includes(run.name), `${runId}: unexpected workflow name ${run.name}`);
  assert.ok(paths.includes(run.path), `${runId}: unexpected workflow path ${run.path}`);

  const artifactResponse = await github(`/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`);
  const available = Array.isArray(artifactResponse?.artifacts) ? artifactResponse.artifacts : [];
  const evidence = available.find((item) => artifacts.includes(item.name) && !item.expired);
  assert.ok(evidence, `${runId}: required non-expired evidence artifact is missing`);

  return {
    run_id: Number(runId),
    workflow: run.name,
    workflow_path: run.path,
    head_sha: run.head_sha,
    html_url: run.html_url,
    conclusion: run.conclusion,
    artifact: {
      id: evidence.id,
      name: evidence.name,
      created_at: evidence.created_at,
      expires_at: evidence.expires_at,
    },
  };
}

const releaseAttestation = await requireRun(releaseAttestationRunId, {
  names: ['Lexia Supabase Release Attestation'],
  paths: ['.github/workflows/supabase-release-attestation.yml'],
  artifacts: ['lexia-m10-release-attestation'],
});

const deployedPreview = await requireRun(deployedPreviewRunId, {
  names: [
    'Lexia Live Deployed Supabase Preview',
    'Lexia Vercel Prebuilt Supabase Preview',
  ],
  paths: [
    '.github/workflows/live-deployed-supabase-preview-smoke.yml',
    '.github/workflows/vercel-prebuilt-supabase-preview.yml',
  ],
  artifacts: [
    'lexia-m10b-deployed-supabase-preview',
    'lexia-m10c-prebuilt-vercel-supabase-preview',
  ],
});

const evidence = {
  schema: 'lexia.production-candidate-attestation.v1',
  repository,
  release_sha: releaseSha,
  ref: refName,
  production_origin: productionOrigin,
  rollback_evidence: rollbackEvidenceUrl,
  release_attestation: releaseAttestation,
  deployed_preview: deployedPreview,
  authorized_for_production_configuration: true,
  production_deploy_performed: false,
  production_provider_switch_performed: false,
  post_switch_production_smoke_required: true,
  fresh_start: true,
  legacy_progress_migration: false,
  attested_at: new Date().toISOString(),
};

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDir = path.join(root, 'artifacts', 'm10d');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'production-candidate-attestation.json'), JSON.stringify(evidence, null, 2));

console.log(JSON.stringify({
  gate: 'M10-D',
  status: 'PASS',
  release_sha: releaseSha,
  production_origin: productionOrigin,
  authorized_for_production_configuration: true,
  production_deploy_performed: false,
  production_provider_switch_performed: false,
  post_switch_production_smoke_required: true,
  secrets_printed: false,
}));
