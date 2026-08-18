import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const requiredEnv = [
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
];
const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) throw new Error(`M09-E browser smoke missing secret environment: ${missing.join(', ')}`);

const supabaseUrl = process.env.LEXIA_LIVE_SUPABASE_URL.replace(/\/$/, '');
const serviceRoleKey = process.env.LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY;
const baseEmail = process.env.LEXIA_LIVE_TEST_EMAIL.trim().toLowerCase();
const password = process.env.LEXIA_LIVE_TEST_PASSWORD;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const at = baseEmail.lastIndexOf('@');
if (at <= 0) throw new Error('LEXIA_LIVE_TEST_EMAIL must be a valid e-mail address');
const email = `${baseEmail.slice(0, at)}+lexia-browser-${runId}${baseEmail.slice(at)}`;

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm09e');
const previewPort = 4173;
const debugPort = 9223;
const appUrl = `http://127.0.0.1:${previewPort}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let userId = null;

function findChrome() {
  for (const candidate of [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean)) {
    if (candidate.includes('/')) return candidate;
    const result = spawnSync('which', [candidate], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error('Chrome/Chromium executable not found');
}

async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) { lastError = error; }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || 'unknown'}`);
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
      user_metadata: { lexia_test: 'm09e-browser-cutover', run_id: runId },
    },
  });
  if (!response.ok) throw new Error(`M09-E disposable user creation failed HTTP ${response.status}: ${JSON.stringify(payload)}`);
  assert.ok(payload?.id);
  userId = payload.id;
}

async function cleanupUser() {
  if (!userId) return;
  const { response } = await supabaseAdmin(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error(`M09-E cleanup failed HTTP ${response.status}`);
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

async function waitUntil(cdp, expression, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(150);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 800)');
  throw new Error(`M09-E timeout waiting for ${label} at ${href}. Body: ${body}`);
}

async function navigate(cdp, pathname) {
  await cdp.send('Page.navigate', { url: `${appUrl}${pathname}` });
  await waitUntil(cdp, "document.readyState === 'complete'", `${pathname} document complete`);
  await sleep(300);
}

async function waitForText(cdp, text) {
  await waitUntil(cdp, `document.body?.innerText?.includes(${JSON.stringify(text)})`, `text ${text}`);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function fillLogin(cdp) {
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
  assert.equal(filled, true, 'login inputs must render');
  await sleep(100);
  const clicked = await cdp.evaluate(`(() => {
    const button = document.querySelector('form button[type="submit"]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, 'login submit must render');
}

async function clickButtonByText(cdp, text) {
  const clicked = await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `button ${text} must render`);
}

await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });
await createDisposableUser();

const preview = spawn(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort',
], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });

let chrome;
let cdp;
try {
  await waitForHttp(appUrl);
  const profileDir = path.join(root, '.tmp-m09e-chrome');
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

  await navigate(cdp, '/');
  await waitForText(cdp, 'Lexia Game');
  assert.equal(await cdp.evaluate("location.pathname === '/'"), true, 'Supabase Welcome must remain public');
  await capture(cdp, '01-public-welcome');

  await navigate(cdp, '/play');
  await waitUntil(cdp, "location.pathname === '/login'", 'protected route redirect to login');
  await waitForText(cdp, 'Entrar no Lexia');
  const returnTo = await cdp.evaluate("new URLSearchParams(location.search).get('returnTo') || ''");
  assert.ok(String(returnTo).includes('/play'), 'login redirect must preserve protected returnTo');
  await capture(cdp, '02-login');

  await fillLogin(cdp);
  await waitUntil(cdp, "location.pathname === '/play'", 'login return to protected play', 20000);
  await waitForText(cdp, 'Missão atual');
  await waitForText(cdp, 'Expedição das Letras');
  await waitForText(cdp, 'Desenhe a letra I');
  const storedSession = await cdp.evaluate(`(() => {
    const value = localStorage.getItem('lexia_supabase_session');
    if (!value) return null;
    try { const parsed = JSON.parse(value); return { hasAccess: Boolean(parsed.access_token), hasRefresh: Boolean(parsed.refresh_token) }; } catch { return null; }
  })()`);
  assert.deepEqual(storedSession, { hasAccess: true, hasRefresh: true }, 'browser must persist Supabase session tokens');
  await capture(cdp, '03-first-guided-mission');

  await cdp.send('Page.reload');
  await waitUntil(cdp, "document.readyState === 'complete' && location.pathname === '/play'", 'reload protected play');
  await waitForText(cdp, 'Missão atual');
  assert.equal(await cdp.evaluate("location.pathname === '/play'"), true, 'reload must retain authenticated route');

  for (const [pathname, text, shot] of [
    ['/world', 'Mapa do Mundo', '04-world'],
    ['/profile', 'Meu Perfil', '05-profile'],
    ['/parent', 'Área dos Pais', '06-parent'],
    ['/settings', 'Acessibilidade', '07-settings'],
  ]) {
    await navigate(cdp, pathname);
    await waitForText(cdp, text);
    assert.notEqual(await cdp.evaluate('location.pathname'), '/login', `${pathname} must remain authenticated`);
    await capture(cdp, shot);
  }

  await waitForText(cdp, 'Sair da conta');
  await clickButtonByText(cdp, 'Sair da conta');
  await waitUntil(cdp, "location.pathname === '/login'", 'logout return to login', 20000);
  const sessionAfterLogout = await cdp.evaluate("localStorage.getItem('lexia_supabase_session')");
  assert.equal(sessionAfterLogout, null, 'UI logout must remove local Supabase session');
  await capture(cdp, '08-logged-out');

  console.log(JSON.stringify({
    gate: 'M09-E',
    status: 'PASS',
    publicWelcome: true,
    protectedRedirect: true,
    uiPasswordLogin: true,
    returnTo: true,
    freshMissionI: true,
    sessionPersistence: true,
    reloadPersistence: true,
    authenticatedWorld: true,
    authenticatedProfile: true,
    authenticatedParent: true,
    uiLogout: true,
    localSessionRemoved: true,
    secretsPrinted: false,
  }));
} finally {
  cdp?.close();
  if (chrome && !chrome.killed) chrome.kill('SIGTERM');
  if (preview && !preview.killed) preview.kill('SIGTERM');
  await cleanupUser();
}
