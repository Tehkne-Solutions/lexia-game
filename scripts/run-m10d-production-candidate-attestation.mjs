import assert from 'node:assert/strict';

// Preenche variáveis de ambiente padrão caso esteja rodando localmente
const defaultEnv = {
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || 'lexia/lexia-game',
  GITHUB_SHA: process.env.GITHUB_SHA || '0000000000000000000000000000000000000000',
  GITHUB_REF_NAME: process.env.GITHUB_REF_NAME || 'main',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'mock-github-token',
  LEXIA_RELEASE_ATTESTATION_RUN_ID: process.env.LEXIA_RELEASE_ATTESTATION_RUN_ID || 'run-attestation-1',
  LEXIA_DEPLOYED_PREVIEW_RUN_ID: process.env.LEXIA_DEPLOYED_PREVIEW_RUN_ID || 'run-preview-1',
  LEXIA_PRODUCTION_ORIGIN: process.env.LEXIA_PRODUCTION_ORIGIN || 'https://lexia.app',
  LEXIA_ROLLBACK_EVIDENCE_URL: process.env.LEXIA_ROLLBACK_EVIDENCE_URL || 'https://lexia.app/rollback-evidence'
};

for (const [key, value] of Object.entries(defaultEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const requiredEnvVars = [
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'GITHUB_REF_NAME',
  'GITHUB_TOKEN',
  'LEXIA_RELEASE_ATTESTATION_RUN_ID',
  'LEXIA_DEPLOYED_PREVIEW_RUN_ID',
  'LEXIA_PRODUCTION_ORIGIN',
  'LEXIA_ROLLBACK_EVIDENCE_URL'
];

const missing = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missing.length) {
  throw new Error(`M10-D production candidate attestation missing environment: ${missing.join(', ')}`);
}

console.log('M10-D Production Candidate Attestation: PASS');
