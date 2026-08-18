import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm20');
const previewPort = 4178;
const debugPort = 9227;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes('/')) return candidate;
    const result = spawnSync('which', [candidate], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error('Chrome/Chromium executable not found on runner');
}

async function waitForHttp(url, timeoutMs = 15000) {
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
      const timer = setTimeout(() => reject(new Error('CDP WebSocket connection timeout')), 8000);
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

async function navigate(cdp, url) {
  await cdp.send('Page.navigate', { url });
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await cdp.evaluate("document.readyState === 'complete'")) break;
    await sleep(100);
  }
  await sleep(1200);
}

async function waitForText(cdp, text, timeoutMs = 10000) {
  const needle = String(text).toLocaleLowerCase('pt-BR');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate(`document.body?.innerText?.toLocaleLowerCase('pt-BR').includes(${JSON.stringify(needle)})`);
    if (found) return;
    await sleep(150);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 5000) || ""');
  throw new Error(`Timed out waiting for ${JSON.stringify(text)} at ${href}. Visible body: ${JSON.stringify(body)}`);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function metrics(cdp) {
  return cdp.evaluate(`(() => ({
    href: location.href,
    innerWidth,
    innerHeight,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body?.scrollWidth || 0,
    documentScrollHeight: document.documentElement.scrollHeight,
  }))()`);
}

function assertSurface(value, name) {
  assert.ok(value.documentScrollWidth <= value.innerWidth + 1, `${name}: document horizontal overflow`);
  assert.ok(value.bodyScrollWidth <= value.innerWidth + 1, `${name}: body horizontal overflow`);
  assert.ok(value.documentScrollHeight >= value.innerHeight, `${name}: document must cover viewport`);
}

async function captureFailure(cdp, name, error) {
  try {
    await capture(cdp, `${name}-debug`);
    await writeFile(path.join(artifactsDir, `${name}-debug.json`), `${JSON.stringify({
      error: error?.message || String(error),
      metrics: await metrics(cdp),
      bodyText: await cdp.evaluate('document.body?.innerText?.slice(0, 6000) || ""'),
    }, null, 2)}\n`);
  } catch (diagnosticError) {
    console.error(`Unable to capture ${name} diagnostics:`, diagnosticError);
  }
}

const viewports = [
  { name: 'mobile-short', width: 360, height: 640, mobile: true },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

const surfaces = [
  { id: 'letters-review', path: '/play?review=1', expected: 'Desenhe a letra' },
  { id: 'syllables-review', path: '/play-syllables?review=1', expected: 'Sílabas Simples' },
  { id: 'sentences-review', path: '/play-sentences?review=1', expected: 'Frases Mágicas' },
];

await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

const preview = spawn(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort',
], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });

let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m20-chrome');
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

  for (const viewport of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });

    for (const surface of surfaces) {
      const evidenceName = `${viewport.name}-${surface.id}`;
      await navigate(cdp, `${baseUrl}${surface.path}`);
      try {
        await waitForText(cdp, 'Revisão inteligente');
        await waitForText(cdp, 'sem avançar a expedição principal');
        await waitForText(cdp, surface.expected);
        const reviewParam = await cdp.evaluate('new URLSearchParams(location.search).get("review")');
        assert.equal(reviewParam, '1', `${evidenceName}: review route must preserve explicit mode`);
        const body = await cdp.evaluate('document.body?.innerText || ""');
        assert.ok(!body.includes('Expedição atual'), `${evidenceName}: learner review must not expose Session Quest progression`);
        assertSurface(await metrics(cdp), evidenceName);
        await capture(cdp, evidenceName);
      } catch (error) {
        await captureFailure(cdp, evidenceName, error);
        throw error;
      }
    }
  }

  console.log('Lexia Learner Review Quest Browser M20: PASS (letters + syllables + sentences review × mobile-short/mobile/desktop = 9 screenshots; combined release evidence = 66)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
