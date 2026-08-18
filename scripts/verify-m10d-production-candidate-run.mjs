import assert from 'node:assert/strict';

const required = [
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'GITHUB_REF_NAME',
  'GITHUB_TOKEN',
  'LEXIA_PRODUCTION_CANDIDATE_RUN_ID',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`M10-E candidate verification missing environment: ${missing.join(', ')}`);

const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const token = process.env.GITHUB_TOKEN;
const runId = String(process.env.LEXIA_PRODUCTION_CANDIDATE_RUN_ID);
const apiUrl = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');

assert.equal(process.env.GITHUB_REF_NAME, 'main', 'M10-E may only run from main');
assert.match(sha, /^[0-9a-f]{40}$/i, 'M10-E requires an exact commit SHA');
assert.match(runId, /^\d+$/, 'M10-E requires a numeric M10-D run ID');

async function github(pathname) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'lexia-m10e-production-post-switch',
    },
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) throw new Error(`GitHub evidence request failed ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

const run = await github(`/repos/${repository}/actions/runs/${runId}`);
assert.equal(run.status, 'completed', 'M10-D candidate run must be completed');
assert.equal(run.conclusion, 'success', 'M10-D candidate run must conclude success');
assert.equal(run.event, 'workflow_dispatch', 'M10-D candidate must be manually dispatched');
assert.equal(run.head_branch, 'main', 'M10-D candidate must come from main');
assert.equal(run.head_sha, sha, 'M10-D candidate SHA must match production post-switch SHA');
assert.equal(run.head_repository?.full_name, repository, 'M10-D candidate must belong to this repository');
assert.equal(run.name, 'Lexia Production Candidate Attestation');
assert.equal(run.path, '.github/workflows/production-candidate-attestation.yml');

const artifactResponse = await github(`/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`);
const artifacts = Array.isArray(artifactResponse?.artifacts) ? artifactResponse.artifacts : [];
const evidence = artifacts.find((item) => item.name === 'lexia-m10d-production-candidate-attestation' && !item.expired);
assert.ok(evidence, 'M10-E requires non-expired lexia-m10d-production-candidate-attestation evidence');

console.log(JSON.stringify({
  gate: 'M10-E-PRECHECK',
  status: 'PASS',
  release_sha: sha,
  production_candidate_run_id: Number(runId),
  production_candidate_artifact_id: evidence.id,
  secrets_printed: false,
}));
