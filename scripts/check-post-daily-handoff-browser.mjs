import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm33');
const distDir = path.join(root, 'dist-m33');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4193;
const debugPort = 9243;
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
  await sleep(900);
}

async function waitFor(cdp, expression, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(150);
  }
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 4000) || ""');
  throw new Error(`Timed out waiting for ${label}. Body: ${JSON.stringify(body)}`);
}

async function waitForText(cdp, text) {
  const needle = String(text).toLocaleLowerCase('pt-BR');
  await waitFor(
    cdp,
    `document.body?.innerText?.toLocaleLowerCase('pt-BR').includes(${JSON.stringify(needle)})`,
    `text ${JSON.stringify(text)}`,
  );
}

async function primaryAction(cdp, label) {
  return cdp.evaluate(`(() => {
    const buttons = [...document.querySelectorAll('button')].filter((node) =>
      node.innerText?.trim() === ${JSON.stringify(label)} && String(node.className).includes('bg-gradient-to-r'));
    const button = buttons[0];
    return {
      count: buttons.length,
      href: button?.closest('a')?.getAttribute('href') || null,
    };
  })()`);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

await rm(artifactsDir, { recursive: true, force: true });
await rm(distDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const originalPlatformIndex = await readFile(platformIndexPath, 'utf8');
let build;
try {
  await writeFile(platformIndexPath, "export * from '../../scripts/fixtures/e2e-platform.js';\n");
  build = spawnSync(process.execPath, [vite, 'build', '--outDir', distDir], { cwd: root, encoding: 'utf8' });
} finally {
  await writeFile(platformIndexPath, originalPlatformIndex);
}
if (build.status !== 0) throw new Error(`M33 browser proof build failed:\n${build.stdout}\n${build.stderr}`);

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m33-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(findChrome(), [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, baseUrl,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await getPageTarget();
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  await cdp.evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
  await cdp.send('Page.reload');
  await waitForText(cdp, 'Continuar sílabas');

  const baseline = await primaryAction(cdp, 'Continuar sílabas');
  assert.equal(baseline.count, 1, 'baseline Home must expose one canonical curriculum CTA');
  assert.equal(baseline.href, '/play-syllables', 'baseline curriculum CTA must use Journey Engine path');
  await capture(cdp, '01-normal-curriculum-home');

  await navigate(cdp, `${baseUrl}/?dailyComplete=1`);
  await waitForText(cdp, 'Bônus concluído!');
  await waitForText(cdp, 'Continuar missão');

  const handoff = await primaryAction(cdp, 'Continuar missão');
  assert.equal(handoff.count, 1, 'post-daily Home must expose one contextual Continue mission CTA');
  assert.equal(handoff.href, baseline.href, 'post-daily CTA must preserve the canonical Journey Engine destination');

  const width = await cdp.evaluate('innerWidth');
  const scrollWidth = await cdp.evaluate('Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0)');
  assert.ok(scrollWidth <= width + 1, 'post-daily Home must not overflow horizontally');
  await capture(cdp, '02-post-daily-continue-mission');

  await writeFile(path.join(artifactsDir, 'post-daily-handoff.json'), `${JSON.stringify({
    baselineCta: 'Continuar sílabas',
    postDailyCta: 'Continuar missão',
    context: 'Bônus concluído!',
    canonicalPath: handoff.href,
    viewport: '390x844',
  }, null, 2)}\n`);

  console.log('Lexia M33 Post Daily Handoff Browser: PASS (normal curriculum CTA → daily complete → Continue missão, canonical path preserved)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
