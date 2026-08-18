import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const requiredEnv = [
  'LEXIA_LIVE_PREVIEW_URL',
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
  'GITHUB_SHA',
  'GITHUB_REF_NAME',
];
const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`M10-B deployed preview smoke missing environment: ${missing.join(', ')}`);

assert.equal(process.env.GITHUB_REF_NAME, 'main', 'M10-B deployed preview proof may only run from main');
const expectedSha = process.env.GITHUB_SHA;
assert.match(expectedSha, /^[0-9a-f]{40}$/i, 'M10-B requires an exact release SHA');

const preview = new URL(process.env.LEXIA_LIVE_PREVIEW_URL.trim());
assert.equal(preview.protocol, 'https:', 'deployed preview must use HTTPS before credentials can be entered');
assert.equal(preview.username, '', 'deployed preview URL must not contain embedded credentials');
assert.equal(preview.password, '', 'deployed preview URL must not contain embedded credentials');
assert.equal(preview.pathname, '/', 'LEXIA_LIVE_PREVIEW_URL must be an origin/root URL');
assert.equal(preview.search, '', 'LEXIA_LIVE_PREVIEW_URL must not contain query parameters');
assert.equal(preview.hash, '', 'LEXIA_LIVE_PREVIEW_URL must not contain a fragment');
const previewOrigin = preview.origin;

const supabaseUrl = process.env.LEXIA_LIVE_SUPABASE_URL.replace(/\/$/, '');
const serviceRoleKey = process.env.LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY;
const baseEmail = process.env.LEXIA_LIVE_TEST_EMAIL.trim().toLowerCase();
const password = process.env.LEXIA_LIVE_TEST_PASSWORD;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const at = baseEmail.lastIndexOf('@');
if (at <= 0) throw new Error('LEXIA_LIVE_TEST_EMAIL must be a valid e-mail address');
const email = `${baseEmail.slice(0, at)}+lexia-deployed-${runId}${baseEmail.slice(at)}`;

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm10b');
const debugPort = 9224;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let userId = null;
let chrome;
let cdp;

function findChrome() {
  for (const candidate of [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean)) {
    if (candidate.includes('/')) return candidate;
    const result = spawnSync('which', [candidate], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error('Chrome/Chromium executable not found');
}

async function waitForHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) { lastError = error; }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || 'unknown error'}`);
}

async function supabaseAdmin(pathname, { method = 'GET', json } = {}) {
  const response = await fetch(`${supabaseUrl}${pathname}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  return { response, payload };
}

async function createDisposableUser() {
  const { response, payload } = await supabaseAdmin('/auth/v1/admin/users', {
    method: 'POST',
    json: {
      email,
      password,
      email_confirm: true,
      user_metadata: { lexia_test: 'm10b-deployed-preview', run_id: runId, release_sha: expectedSha },
    },
  });
  if (!response.ok) throw new Error(`M10-B disposable user creation failed HTTP ${response.status}: ${JSON.stringify(payload)}`);
  assert.ok(payload?.id, 'M10-B disposable Auth user must have an id');
  userId = payload.id;
}

async function cleanupUser() {
  if (!userId) return;
  const { response } = await supabaseAdmin(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error(`M10-B cleanup failed HTTP ${response.status}`);
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.sequence = 0;
    this.pending = new Map();
  }
  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connect timeout')), 8000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP WebSocket error')); });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    return result.result?.value;
  }
  close() { this.socket?.close(); }
}

async function getPageTarget() {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
  const targets = await response.json();
  const page = targets.find((target) => target.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('No Chrome page target found');
  return page;
}

async function waitUntil(expression, label, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(200);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 800)');
  throw new Error(`M10-B timeout waiting for ${label} at ${href}. Body: ${body}`);
}

async function navigate(pathname) {
  await cdp.send('Page.navigate', { url: `${previewOrigin}${pathname}` });
  await waitUntil("document.readyState === 'complete'", `${pathname} document complete`);
  await sleep(500);
  assert.equal(await cdp.evaluate('location.origin'), previewOrigin, `navigation for ${pathname} must remain on the approved preview origin`);
}

async function waitForText(text) {
  await waitUntil(`document.body?.innerText?.includes(${JSON.stringify(text)})`, `text ${text}`);
}

async function capture(name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function fillLogin() {
  const filled = await cdp.evaluate(`(() => {
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    if (!emailInput || !passwordInput) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(emailInput, ${JSON.stringify(email)});
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    setter.call(passwordInput, ${JSON.stringify(password)});
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  assert.equal(filled, true, 'deployed login inputs must render before credentials are submitted');
  const clicked = await cdp.evaluate(`(() => {
    const button = document.querySelector('form button[type="submit"]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, 'deployed login submit must render');
}

async function clickButton(text) {
  const clicked = await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `deployed button ${text} must render`);
}

await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

try {
  await waitForHttp(previewOrigin);
  const profileDir = path.join(root, '.tmp-m10b-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(findChrome(), [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await getPageTarget();
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  // Verify the approved origin and build identity BEFORE disposable credentials are created or typed.
  await navigate('/');
  await waitForText('Lexia Game');
  const buildIdentity = await cdp.evaluate(`({
    sha: document.documentElement.dataset.lexiaReleaseSha || '',
    provider: document.documentElement.dataset.lexiaBuildProvider || ''
  })`);
  assert.equal(buildIdentity.sha, expectedSha, 'deployed preview must expose the exact expected release SHA');
  assert.equal(buildIdentity.provider, 'supabase', 'deployed preview must be compiled with the Supabase provider');
  await capture('01-deployed-identity');

  await createDisposableUser();

  await navigate('/play');
  await waitUntil("location.pathname === '/login'", 'deployed protected route redirect');
  await waitForText('Entrar no Lexia');
  assert.ok(String(await cdp.evaluate("new URLSearchParams(location.search).get('returnTo') || ''")).includes('/play'), 'deployed login must preserve returnTo');
  await capture('02-deployed-login');

  await fillLogin();
  await waitUntil("location.pathname === '/play'", 'deployed login return to play');
  await waitForText('Missão atual');
  await waitForText('Expedição das Letras');
  await waitForText('Desenhe a letra I');
  const session = await cdp.evaluate(`(() => {
    const value = localStorage.getItem('lexia_supabase_session');
    if (!value) return null;
    try { const parsed = JSON.parse(value); return { access: Boolean(parsed.access_token), refresh: Boolean(parsed.refresh_token) }; } catch { return null; }
  })()`);
  assert.deepEqual(session, { access: true, refresh: true }, 'deployed Supabase session must persist access and refresh tokens');
  await capture('03-deployed-first-mission');

  await cdp.send('Page.reload');
  await waitUntil("document.readyState === 'complete' && location.pathname === '/play'", 'deployed reload persistence');
  await waitForText('Missão atual');

  for (const [pathname, text, shot] of [
    ['/world', 'Mapa do Mundo', '04-deployed-world'],
    ['/profile', 'Meu Perfil', '05-deployed-profile'],
    ['/parent', 'Área dos Pais', '06-deployed-parent'],
    ['/settings', 'Acessibilidade', '07-deployed-settings'],
  ]) {
    await navigate(pathname);
    await waitForText(text);
    assert.notEqual(await cdp.evaluate('location.pathname'), '/login', `${pathname} must remain authenticated on deployed preview`);
    await capture(shot);
  }

  await waitForText('Sair da conta');
  await clickButton('Sair da conta');
  await waitUntil("location.pathname === '/login'", 'deployed UI logout');
  assert.equal(await cdp.evaluate("localStorage.getItem('lexia_supabase_session')"), null, 'deployed logout must remove local Supabase session');
  await capture('08-deployed-logged-out');

  console.log(JSON.stringify({
    gate: 'M10-B',
    status: 'PASS',
    preview_origin: previewOrigin,
    release_sha: expectedSha,
    provider: 'supabase',
    protected_login: true,
    fresh_start_mission: true,
    reload_persistence: true,
    authenticated_navigation: true,
    ui_logout: true,
    secrets_printed: false,
  }));
} finally {
  cdp?.close();
  if (chrome && !chrome.killed) chrome.kill('SIGTERM');
  await cleanupUser();
}
