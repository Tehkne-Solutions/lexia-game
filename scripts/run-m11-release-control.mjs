import { mkdir, writeFile } from 'node:fs/promises';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const releaseSha = process.env.GITHUB_SHA;
const refName = process.env.GITHUB_REF_NAME;
const orchestratorRunId = Number(process.env.GITHUB_RUN_ID || 0);
const authRedirectEvidenceUrl = process.env.LEXIA_AUTH_REDIRECT_EVIDENCE_URL;
const productionOrigin = process.env.LEXIA_PRODUCTION_ORIGIN;
const rollbackEvidenceUrl = process.env.LEXIA_ROLLBACK_EVIDENCE_URL;
const previewStrategy = process.env.LEXIA_PREVIEW_STRATEGY || 'prebuilt';

if (!token || !repository || !releaseSha) throw new Error('GitHub release-control context is incomplete');
if (refName !== 'main') throw new Error(`Release Control must run from main, received ${refName || '<empty>'}`);
if (!['prebuilt', 'existing-secret'].includes(previewStrategy)) throw new Error(`Unsupported preview strategy: ${previewStrategy}`);

function requireHttps(value, label, { rootOnly = false } = {}) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be an absolute HTTPS URL`); }
  if (url.protocol !== 'https:') throw new Error(`${label} must use HTTPS`);
  if (url.username || url.password) throw new Error(`${label} must not contain credentials`);
  if (rootOnly && (url.pathname !== '/' || url.search || url.hash)) throw new Error(`${label} must be a root origin without path/query/fragment`);
  return rootOnly ? url.origin : url.href;
}

const normalizedProductionOrigin = requireHttps(productionOrigin, 'Production origin', { rootOnly: true });
const normalizedRedirectEvidence = requireHttps(authRedirectEvidenceUrl, 'Auth redirect evidence URL');
const normalizedRollbackEvidence = requireHttps(rollbackEvidenceUrl, 'Rollback evidence URL');

const apiBase = `https://api.github.com/repos/${repository}`;
const apiVersion = '2026-03-10';
const usedRunIds = new Set();

async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': apiVersion,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) throw new Error(`GitHub API ${method} ${path} failed (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return { response, data };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function assertMainStillPinned() {
  const { data } = await api('/branches/main');
  const current = data?.commit?.sha;
  if (current !== releaseSha) {
    throw new Error(`main advanced during release control: expected ${releaseSha}, current ${current || '<unknown>'}. Restart on the new main SHA.`);
  }
}

async function discoverDispatchedRun(workflowFile, dispatchedAfter) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const { data } = await api(`/actions/workflows/${encodeURIComponent(workflowFile)}/runs?event=workflow_dispatch&branch=main&per_page=20`);
    const run = (data?.workflow_runs || []).find(candidate => {
      if (usedRunIds.has(candidate.id)) return false;
      if (candidate.head_sha !== releaseSha || candidate.head_branch !== 'main') return false;
      return new Date(candidate.created_at).getTime() >= dispatchedAfter - 5_000;
    });
    if (run) return run.id;
    await sleep(3_000);
  }
  throw new Error(`Unable to discover dispatched run for ${workflowFile}`);
}

async function dispatchWorkflow(workflowFile, inputs = {}) {
  await assertMainStillPinned();
  const dispatchedAfter = Date.now();
  const { response, data } = await api(`/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`, {
    method: 'POST',
    body: { ref: 'main', inputs },
  });
  const directRunId = Number(data?.workflow_run_id || 0);
  const runId = directRunId || await discoverDispatchedRun(workflowFile, dispatchedAfter);
  usedRunIds.add(runId);
  console.log(`Dispatched ${workflowFile}: run ${runId} (HTTP ${response.status})`);
  return runId;
}

async function waitForRun(runId, expectedName, timeoutMinutes = 70) {
  const deadline = Date.now() + timeoutMinutes * 60_000;
  let previousStatus = '';
  while (Date.now() < deadline) {
    const { data: run } = await api(`/actions/runs/${runId}`);
    if (run.head_sha !== releaseSha) throw new Error(`${expectedName} run ${runId} uses ${run.head_sha}, expected ${releaseSha}`);
    if (run.head_branch !== 'main') throw new Error(`${expectedName} run ${runId} did not run on main`);
    if (run.event !== 'workflow_dispatch') throw new Error(`${expectedName} run ${runId} was not workflow_dispatch`);
    const statusLine = `${run.status}/${run.conclusion || '-'}`;
    if (statusLine !== previousStatus) {
      console.log(`${expectedName} run ${runId}: ${statusLine}`);
      previousStatus = statusLine;
    }
    if (run.status === 'completed') {
      if (run.conclusion !== 'success') throw new Error(`${expectedName} run ${runId} completed with ${run.conclusion}`);
      return run;
    }
    await sleep(10_000);
  }
  throw new Error(`${expectedName} run ${runId} exceeded ${timeoutMinutes} minutes`);
}

async function requireArtifact(runId, artifactName) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const { data } = await api(`/actions/runs/${runId}/artifacts?per_page=100`);
    const artifact = (data?.artifacts || []).find(item => item.name === artifactName && !item.expired);
    if (artifact) {
      console.log(`Evidence ${artifactName}: artifact ${artifact.id}`);
      return artifact;
    }
    await sleep(3_000);
  }
  throw new Error(`Required non-expired artifact ${artifactName} not found on run ${runId}`);
}

async function dispatchWaitProve({ file, name, inputs, artifact, timeoutMinutes }) {
  const runId = await dispatchWorkflow(file, inputs);
  await waitForRun(runId, name, timeoutMinutes);
  const evidence = await requireArtifact(runId, artifact);
  return { run_id: runId, artifact_id: evidence.id, artifact_name: artifact };
}

await assertMainStillPinned();

const auth = await dispatchWaitProve({
  file: 'live-supabase-auth-smoke.yml',
  name: 'M09-B Auth/REST/Storage',
  inputs: { recovery: 'true' },
  artifact: 'lexia-m09b-auth-rest-storage-recovery-true',
});

const services = await dispatchWaitProve({
  file: 'live-supabase-services-smoke.yml',
  name: 'M09-D private services',
  inputs: { service: 'both' },
  artifact: 'lexia-m09d-services-both',
});

const browser = await dispatchWaitProve({
  file: 'live-supabase-browser-smoke.yml',
  name: 'M09-E local Supabase browser',
  artifact: 'lexia-m09e-supabase-browser-cutover',
});

const releaseAttestation = await dispatchWaitProve({
  file: 'supabase-release-attestation.yml',
  name: 'M10-A release attestation',
  inputs: {
    auth_run_id: String(auth.run_id),
    services_run_id: String(services.run_id),
    browser_run_id: String(browser.run_id),
    auth_redirect_evidence_url: normalizedRedirectEvidence,
  },
  artifact: 'lexia-m10-release-attestation',
});

const preview = previewStrategy === 'prebuilt'
  ? await dispatchWaitProve({
      file: 'vercel-prebuilt-supabase-preview.yml',
      name: 'M10-C prebuilt deployed preview',
      artifact: 'lexia-m10c-prebuilt-vercel-supabase-preview',
      timeoutMinutes: 90,
    })
  : await dispatchWaitProve({
      file: 'live-deployed-supabase-preview-smoke.yml',
      name: 'M10-B existing deployed preview',
      artifact: 'lexia-m10b-deployed-supabase-preview',
      timeoutMinutes: 60,
    });

const candidate = await dispatchWaitProve({
  file: 'production-candidate-attestation.yml',
  name: 'M10-D production candidate attestation',
  inputs: {
    release_attestation_run_id: String(releaseAttestation.run_id),
    deployed_preview_run_id: String(preview.run_id),
    production_origin: normalizedProductionOrigin,
    rollback_evidence_url: normalizedRollbackEvidence,
  },
  artifact: 'lexia-m10d-production-candidate-attestation',
});

await assertMainStillPinned();
await mkdir('artifacts/m11', { recursive: true });
const report = {
  schema: 'lexia.m11.release-control.v1',
  repository,
  release_sha: releaseSha,
  orchestrator_run_id: orchestratorRunId,
  preview_strategy: previewStrategy,
  evidence_references: {
    auth_redirect: normalizedRedirectEvidence,
    rollback: normalizedRollbackEvidence,
    intended_production_origin: normalizedProductionOrigin,
  },
  runs: { auth, services, browser, release_attestation: releaseAttestation, deployed_preview: preview, production_candidate: candidate },
  fresh_start_invariant: 'No historical learner history is migrated.',
  authorized_for_production_configuration: true,
  production_deploy_performed: false,
  production_provider_switch_performed: false,
  next_required_gate: 'After an explicitly approved production switch, run Lexia Live Production Supabase Post-Switch using this M10-D run ID.',
};
await writeFile('artifacts/m11/release-control.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
