import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm29');
const distDir = path.join(root, 'dist-m29c');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4187;
const debugPort = 9237;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const storageKey = 'lexia_m28c_progress_v1';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [process.env.CHROME_BIN, 'google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser'].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes('/')) return candidate;
    const result = spawnSync('which', [candidate], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error('Chrome/Chromium executable not found on runner');
}

async function waitForHttp(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || 'unknown error'}`);
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
      const timer = setTimeout(() => reject(new Error('CDP WebSocket connection timeout')), 10000);
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
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Runtime evaluation failed');
    return response.result?.value;
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

async function navigate(cdp, url) {
  await cdp.send('Page.navigate', { url });
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await cdp.evaluate("document.readyState === 'complete'")) break;
    await sleep(100);
  }
  await sleep(900);
}

async function waitFor(cdp, expression, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(150);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 5000) || ""');
  throw new Error(`Timed out waiting for ${label} at ${href}. Body: ${JSON.stringify(body)}`);
}

async function waitForText(cdp, text, timeoutMs = 12000) {
  const needle = String(text).toLocaleLowerCase('pt-BR');
  return waitFor(
    cdp,
    `document.body?.innerText?.toLocaleLowerCase('pt-BR').includes(${JSON.stringify(needle)})`,
    `text ${JSON.stringify(text)}`,
    timeoutMs,
  );
}

async function clickAdaptivePrimary(cdp) {
  const clicked = await cdp.evaluate(`(() => {
    const buttons = [...document.querySelectorAll('button')].filter((button) => button.innerText?.trim() === 'Revisar agora');
    const primary = buttons.find((button) => String(button.className).includes('lexia-primary-action'));
    if (!primary) return false;
    primary.click();
    return true;
  })()`);
  assert.equal(clicked, true, 'adaptive primary Revisar agora CTA must be clickable');
  await sleep(500);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function snapshot(cdp) {
  return cdp.evaluate(`(() => ({
    href: location.href,
    body: document.body?.innerText || '',
    width: innerWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
    progress: JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || '[]'),
  }))()`);
}

await rm(artifactsDir, { recursive: true, force: true });
await rm(distDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const originalPlatformIndex = await readFile(platformIndexPath, 'utf8');
let build;
try {
  await writeFile(platformIndexPath, "export * from '../../scripts/fixtures/e2e-platform.js';\n");
  build = spawnSync(process.execPath, [vite, 'build', '--outDir', distDir], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env },
  });
} finally {
  await writeFile(platformIndexPath, originalPlatformIndex);
}
if (build.status !== 0) throw new Error(`M29-C browser proof build failed:\n${build.stdout}\n${build.stderr}`);

const preview = spawn(process.execPath, [
  vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir,
], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });

let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m29c-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(findChrome(), [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await getPageTarget();
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  await navigate(cdp, baseUrl);
  await cdp.evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
  await cdp.send('Page.reload');
  await waitForText(cdp, 'Continuar sílabas');

  const seeded = await snapshot(cdp);
  assert.equal(seeded.progress.length, 26, 'fixture must seed the mastered alphabet');
  assert.ok(seeded.scrollWidth <= seeded.width + 1, 'baseline Home must not overflow horizontally');

  const dueAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dueEntity = await cdp.evaluate(`(() => {
    const key = ${JSON.stringify(storageKey)};
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    const record = records.find((row) => row.letter === 'A');
    if (!record) return null;
    record.next_review = ${JSON.stringify(dueAt)};
    localStorage.setItem(key, JSON.stringify(records));
    return record.letter;
  })()`);
  assert.equal(dueEntity, 'A', 'fixture must make letter A due');

  await cdp.send('Page.reload');
  await waitForText(cdp, 'Revisão inteligente');
  await waitFor(cdp, `(() => [...document.querySelectorAll('button')].some((button) => button.innerText?.trim() === 'Revisar agora'))()`, 'adaptive review CTA');

  const reviewHome = await snapshot(cdp);
  const reviewButtons = await cdp.evaluate(`[...document.querySelectorAll('button')].filter((button) => button.innerText?.trim() === 'Revisar agora').length`);
  const primaryReviewButtons = await cdp.evaluate(`[...document.querySelectorAll('button')].filter((button) => button.innerText?.trim() === 'Revisar agora' && String(button.className).includes('lexia-primary-action')).length`);
  assert.ok(reviewButtons >= 2, 'due-review Home must expose both review card action and adaptive primary CTA');
  assert.equal(primaryReviewButtons, 1, 'due-review Home must expose exactly one primary review CTA');
  assert.ok(reviewHome.body.toLocaleLowerCase('pt-BR').includes('1 revisão pronta'), 'Home must explain the due review count');
  assert.ok(reviewHome.scrollWidth <= reviewHome.width + 1, 'due-review Home must not overflow horizontally');
  await capture(cdp, '01-home-review-primary');

  await clickAdaptivePrimary(cdp);
  await waitFor(cdp, `location.pathname === '/play' && new URLSearchParams(location.search).get('review') === '1'`, 'exact review route');
  const reviewTarget = await cdp.evaluate(`new URLSearchParams(location.search).get('reviewTarget')`);
  assert.equal(reviewTarget, 'A', 'adaptive primary CTA must preserve the exact oldest-due target');
  await waitForText(cdp, 'Revisão inteligente');
  await waitForText(cdp, 'Desenhe a letra A!');
  await capture(cdp, '02-exact-review-a');

  const futureAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await cdp.evaluate(`(() => {
    const key = ${JSON.stringify(storageKey)};
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    const record = records.find((row) => row.letter === 'A');
    if (!record) throw new Error('A progress record missing');
    record.next_review = ${JSON.stringify(futureAt)};
    localStorage.setItem(key, JSON.stringify(records));
  })()`);

  await navigate(cdp, baseUrl);
  await waitForText(cdp, 'Continuar sílabas');
  const resumed = await snapshot(cdp);
  const primaryCurriculumButtons = await cdp.evaluate(`[...document.querySelectorAll('button')].filter((button) => button.innerText?.trim() === 'Continuar sílabas' && String(button.className).includes('lexia-primary-action')).length`);
  assert.equal(primaryCurriculumButtons, 1, 'when review debt is cleared, curriculum must resume as the primary action');
  assert.ok(!resumed.body.toLocaleLowerCase('pt-BR').includes('1 revisão pronta'), 'cleared review debt must disappear from Home');
  assert.ok(resumed.scrollWidth <= resumed.width + 1, 'resumed Home must not overflow horizontally');
  await capture(cdp, '03-home-curriculum-restored');

  await writeFile(path.join(artifactsDir, 'adaptive-home.json'), `${JSON.stringify({
    dueEntity,
    exactReviewTarget: reviewTarget,
    reviewPrimaryVisible: true,
    curriculumRestored: true,
    finalHref: resumed.href,
  }, null, 2)}\n`);

  console.log('Lexia M29-C Adaptive Home Browser: PASS (due review → primary CTA → exact target A → review cleared → curriculum restored)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
