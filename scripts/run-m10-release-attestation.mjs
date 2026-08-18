import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const requiredEnv = [
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'GITHUB_REF_NAME',
  'GITHUB_TOKEN',
  'LEXIA_AUTH_RUN_ID',
  'LEXIA_SERVICES_RUN_ID',
  'LEXIA_BROWSER_RUN_ID',
  'LEXIA_AUTH_REDIRECT_EVIDENCE_URL',
];

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`M10 release attestation is fail-closed; missing environment: ${missing.join(', ')}`);
}

const repository = process.env.GITHUB_REPOSITORY;
const releaseSha = process.env.GITHUB_SHA;
const refName = process.env.GITHUB_REF_NAME;
const token = process.env.GITHUB_TOKEN;
const apiUrl = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
const redirectEvidenceUrl = process.env.LEXIA_AUTH_REDIRECT_EVIDENCE_URL.trim();

assert.equal(refName, 'main', 'M10 release attestation may only run from main');
assert.match(releaseSha, /^[0-9a-f]{40}$/i, 'M10 requires an exact commit SHA');
assert.ok(redirectEvidenceUrl.startsWith('https://'), 'Auth redirect evidence must be an HTTPS evidence reference');

const proofSpecs = [
  {
    key: 'auth',
    runId: process.env.LEXIA_AUTH_RUN_ID,
    workflowName: 'Lexia Live Supabase Auth Smoke',
    workflowPath: '.github/workflows/live-supabase-auth-smoke.yml',
    artifactName: 'lexia-m09b-auth-rest-storage-recovery-true',
  },
  {
    key: 'services',
    runId: process.env.LEXIA_SERVICES_RUN_ID,
    workflowName: 'Lexia Live Supabase Services Smoke',
    workflowPath: '.github/workflows/live-supabase-services-smoke.yml',
    artifactName: 'lexia-m09d-services-both',
  },
  {
    key: 'browser',
    runId: process.env.LEXIA_BROWSER_RUN_ID,
    workflowName: 'Lexia Live Supabase Browser Cutover',
    workflowPath: '.github/workflows/live-supabase-browser-smoke.yml',
    artifactName: 'lexia-m09e-supabase-browser-cutover',
  },
];

const ids = proofSpecs.map((spec) => String(spec.runId));
assert.equal(new Set(ids).size, ids.length, 'M10 requires three distinct workflow-run IDs');
for (const id of ids) assert.match(id, /^\d+$/, `Invalid workflow-run ID: ${id}`);

async function github(pathname) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'lexia-m10-release-attestation',
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

async function attestProof(spec) {
  const run = await github(`/repos/${repository}/actions/runs/${spec.runId}`);

  assert.equal(run.status, 'completed', `${spec.key}: workflow run must be completed`);
  assert.equal(run.conclusion, 'success', `${spec.key}: workflow run must conclude success`);
  assert.equal(run.event, 'workflow_dispatch', `${spec.key}: proof must come from explicit workflow_dispatch`);
  assert.equal(run.head_branch, 'main', `${spec.key}: proof must have executed from main`);
  assert.equal(run.head_sha, releaseSha, `${spec.key}: proof SHA must equal the attested release SHA`);
  assert.equal(run.name, spec.workflowName, `${spec.key}: unexpected workflow name`);
  assert.equal(run.path, spec.workflowPath, `${spec.key}: unexpected workflow path`);
  assert.equal(run.head_repository?.full_name, repository, `${spec.key}: proof must belong to the attested repository`);

  const artifactResponse = await github(`/repos/${repository}/actions/runs/${spec.runId}/artifacts?per_page=100`);
  const artifacts = Array.isArray(artifactResponse?.artifacts) ? artifactResponse.artifacts : [];
  const artifact = artifacts.find((item) => item.name === spec.artifactName && !item.expired);
  assert.ok(artifact, `${spec.key}: required non-expired evidence artifact not found: ${spec.artifactName}`);

  return {
    run_id: Number(spec.runId),
    workflow: run.name,
    workflow_path: run.path,
    head_sha: run.head_sha,
    head_branch: run.head_branch,
    event: run.event,
    conclusion: run.conclusion,
    html_url: run.html_url,
    artifact: {
      id: artifact.id,
      name: artifact.name,
      created_at: artifact.created_at,
      expires_at: artifact.expires_at,
    },
  };
}

const proofs = {};
for (const spec of proofSpecs) proofs[spec.key] = await attestProof(spec);

const evidence = {
  schema: 'lexia.release-attestation.v1',
  authorized_for_controlled_preview: true,
  production_deploy_performed: false,
  repository,
  release_sha: releaseSha,
  ref: refName,
  auth_redirect_configuration_evidence: redirectEvidenceUrl,
  proofs,
  rules: {
    fresh_start: true,
    legacy_progress_migration: false,
    provider_switch_performed: false,
    deployed_supabase_preview_still_required: true,
  },
  attested_at: new Date().toISOString(),
};

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDir = path.join(root, 'artifacts', 'm10');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'release-attestation.json'), JSON.stringify(evidence, null, 2));

console.log(JSON.stringify({
  gate: 'M10',
  status: 'PASS',
  release_sha: releaseSha,
  auth_run_id: Number(proofSpecs[0].runId),
  services_run_id: Number(proofSpecs[1].runId),
  browser_run_id: Number(proofSpecs[2].runId),
  authorized_for_controlled_preview: true,
  production_deploy_performed: false,
  secrets_printed: false,
}));
