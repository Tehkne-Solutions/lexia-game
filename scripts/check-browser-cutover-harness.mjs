import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const browserSmoke = await readFile(new URL('./run-live-supabase-browser-smoke.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/live-supabase-browser-smoke.yml', import.meta.url), 'utf8');
const settings = await readFile(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const authContext = await readFile(new URL('../src/lib/AuthContext.jsx', import.meta.url), 'utf8');
const adapter = await readFile(new URL('../src/platform/adapters/supabaseAdapter.js', import.meta.url), 'utf8');

assert.ok(workflow.includes('workflow_dispatch:'), 'browser cutover proof must remain explicit/manual');
assert.ok(workflow.includes('environment: lexia-live-smoke'), 'browser cutover must use the protected live-smoke environment');

for (const secret of [
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
]) {
  assert.ok(workflow.includes(`secrets.${secret}`), `browser cutover workflow must inject ${secret} from GitHub secrets`);
}

for (const buildFlag of [
  'VITE_LEXIA_PLATFORM_PROVIDER: supabase',
  "VITE_LEXIA_SUPABASE_AUTH_READY: 'true'",
  "VITE_LEXIA_SUPABASE_EDGE_READY: 'true'",
]) {
  assert.ok(workflow.includes(buildFlag), `Supabase browser build must include ${buildFlag}`);
}

assert.equal(workflow.includes('VITE_SUPABASE_SERVICE_ROLE'), false, 'service-role secret must never enter the Vite client build');
assert.ok(workflow.includes('node scripts/run-live-supabase-browser-smoke.mjs'));
assert.ok(workflow.includes('artifacts/m09e/*.png'), 'browser proof must upload screenshots as evidence');

for (const proof of [
  "supabaseAdmin('/auth/v1/admin/users'",
  "location.pathname === '/login'",
  "new URLSearchParams(location.search).get('returnTo')",
  'fillLogin(cdp)',
  "location.pathname === '/play'",
  'Expedição das Letras',
  'Desenhe a letra I',
  "localStorage.getItem('lexia_supabase_session')",
  "Page.reload",
  "['/world', 'Mapa do Mundo'",
  "['/profile', 'Meu Perfil'",
  "['/parent', 'Área dos Pais'",
  "['/settings', 'Acessibilidade'",
  "clickButtonByText(cdp, 'Sair da conta')",
  "localStorage.getItem('lexia_supabase_session')",
  'await cleanupUser()',
]) {
  assert.ok(browserSmoke.includes(proof), `browser cutover harness must prove ${proof}`);
}

assert.ok(browserSmoke.includes('finally {'), 'browser proof must clean up even when an assertion fails');
assert.ok(browserSmoke.includes("user_metadata: { lexia_test: 'm09e-browser-cutover'"), 'disposable account must be identifiable as test-only');
assert.ok(browserSmoke.includes("width: 390, height: 844"), 'live browser proof must exercise a mobile viewport');
assert.equal(/sb_publishable_[A-Za-z0-9_-]{10,}/.test(browserSmoke + workflow), false, 'no publishable-key literal may be committed');
assert.equal(/service_role[^\n]{0,40}[A-Za-z0-9_-]{40,}/i.test(browserSmoke + workflow), false, 'no service-role credential literal may be committed');

assert.ok(settings.includes("activePlatformProvider === 'supabase'"), 'logout account UI must only render for Supabase runtime');
assert.ok(settings.includes('Sair da conta'));
assert.ok(settings.includes('logout(true)'));
assert.ok(authContext.includes('lexiaPlatform.auth.logout(window.location.href)'));
assert.ok(adapter.includes("await request('/auth/v1/logout', { method: 'POST' })"));
assert.ok(adapter.includes('writeSession(null)'));

console.log('Lexia M09-E browser cutover harness contract: PASS (Supabase build + protected UI login/reload/logout + disposable cleanup)');
