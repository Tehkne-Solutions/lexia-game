import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const vite = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
const smoke = await readFile(new URL('./run-live-deployed-supabase-preview-smoke.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/live-deployed-supabase-preview-smoke.yml', import.meta.url), 'utf8');

for (const fallback of [
  'process.env.VITE_LEXIA_RELEASE_SHA',
  'process.env.VERCEL_GIT_COMMIT_SHA',
  'process.env.GITHUB_SHA',
]) {
  assert.ok(vite.includes(fallback), `deployed build identity must support ${fallback}`);
}
assert.ok(vite.includes("process.env.VITE_LEXIA_PLATFORM_PROVIDER || 'base44'"));
assert.ok(vite.includes("'import.meta.env.VITE_LEXIA_RELEASE_SHA'"));
assert.ok(vite.includes("'import.meta.env.VITE_LEXIA_BUILD_PROVIDER_MARKER'"));
assert.ok(main.includes('document.documentElement.dataset.lexiaReleaseSha'));
assert.ok(main.includes('document.documentElement.dataset.lexiaBuildProvider'));

assert.ok(workflow.includes('name: Lexia Live Deployed Supabase Preview'));
assert.ok(workflow.includes('workflow_dispatch:'));
assert.ok(workflow.includes('environment: lexia-live-smoke'));
assert.ok(workflow.includes('LEXIA_LIVE_PREVIEW_URL: ${{ secrets.LEXIA_LIVE_PREVIEW_URL }}'));
assert.equal(workflow.includes('inputs:'), false, 'credential-receiving preview origin must not come from workflow input');
assert.ok(workflow.includes('if: success()'));
assert.ok(workflow.includes('lexia-m10b-deployed-supabase-preview'));
assert.equal(workflow.includes('VITE_LEXIA_PLATFORM_PROVIDER'), false, 'deployed proof must inspect an existing deployment, not build/switch one itself');

for (const invariant of [
  "assert.equal(process.env.GITHUB_REF_NAME, 'main'",
  "assert.equal(preview.protocol, 'https:'",
  "assert.equal(preview.username, ''",
  "assert.equal(preview.password, ''",
  "assert.equal(preview.pathname, '/'",
  "assert.equal(preview.search, ''",
  "assert.equal(preview.hash, ''",
  'assert.equal(buildIdentity.sha, expectedSha',
  "assert.equal(buildIdentity.provider, 'supabase'",
  "location.pathname === '/login'",
  'fillLogin()',
  'Expedição das Letras',
  'Desenhe a letra I',
  "localStorage.getItem('lexia_supabase_session')",
  "['/world', 'Mapa do Mundo'",
  "['/profile', 'Meu Perfil'",
  "['/parent', 'Área dos Pais'",
  "['/settings', 'Acessibilidade'",
  "clickButton('Sair da conta')",
  'await cleanupUser()',
]) {
  assert.ok(smoke.includes(invariant), `M10-B deployed preview must enforce ${invariant}`);
}

const identityCheck = smoke.indexOf("assert.equal(buildIdentity.provider, 'supabase'");
const createUser = smoke.indexOf('await createDisposableUser()');
const fillCredentials = smoke.indexOf('await fillLogin()');
assert.ok(identityCheck >= 0 && createUser > identityCheck, 'build identity must be verified before disposable Auth user creation');
assert.ok(fillCredentials > createUser, 'credentials may only be typed after approved deployment identity and disposable user creation');
assert.ok(smoke.includes("assert.equal(await cdp.evaluate('location.origin'), previewOrigin"), 'all route navigation must stay on the approved origin');
assert.ok(smoke.includes('finally {'), 'deployed preview proof must clean up on failure');
assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(smoke + workflow + vite), false, 'no publishable-key literal may be committed');
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(smoke + workflow + vite), false, 'no service-role credential literal may be committed');

console.log('Lexia M10-B Deployed Preview contract: PASS (secret HTTPS origin, exact SHA/provider marker, credentials after identity, cleanup enforced)');
