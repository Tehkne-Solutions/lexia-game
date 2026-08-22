import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm32');
const harnessPath = path.join(root, 'm32-daily-handoff-harness.html');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4191;
const debugPort = 9241;
const baseUrl = `http://127.0.0.1:${previewPort}`;
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

async function waitFor(cdp, expression, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(150);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 4000) || ""');
  throw new Error(`Timed out waiting for ${label} at ${href}. Body: ${JSON.stringify(body)}`);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });
await writeFile(harnessPath, `<!doctype html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>M32 Daily Handoff Harness</title></head>
<body>
  <main><h1>M32 Daily Handoff Harness</h1><button id="handoff">Concluir bônus</button></main>
  <script type="module">
    import { getNextChallengeTarget } from '/src/lib/dailyChallenge.js';
    const complete = {
      completed: true,
      targets: [{ key: 'A' }, { key: 'B' }, { key: 'C' }],
      targetKeys: ['A', 'B', 'C'],
      progress: { A: true, B: true, C: true },
    };
    window.runDailyHandoff = () => getNextChallengeTarget(complete);
    document.getElementById('handoff').addEventListener('click', window.runDailyHandoff);
  </script>
</body>
</html>`);

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const originalPlatformIndex = await readFile(platformIndexPath, 'utf8');
await writeFile(platformIndexPath, "export * from '../../scripts/fixtures/e2e-platform.js';\n");
const preview = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m32-chrome');
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

  await cdp.send('Page.navigate', { url: `${baseUrl}/m32-daily-handoff-harness.html?daily=1&dailyTarget=C` });
  await waitFor(cdp, `typeof window.runDailyHandoff === 'function'`, 'M32 harness module');
  await capture(cdp, '01-daily-complete-before-handoff');

  const before = await cdp.evaluate(`({ pathname: location.pathname, search: location.search })`);
  assert.equal(before.search.includes('daily=1'), true, 'proof must start inside daily mode');

  await cdp.evaluate('window.runDailyHandoff()');
  await waitFor(cdp, `location.pathname === '/' && new URLSearchParams(location.search).get('dailyComplete') === '1'`, 'daily completion Home handoff');
  await waitFor(cdp, `document.body?.innerText?.toLocaleLowerCase('pt-BR').includes('lexia')`, 'Lexia Home after handoff');
  await capture(cdp, '02-home-after-daily-handoff');

  const after = await cdp.evaluate(`({
    href: location.href,
    pathname: location.pathname,
    search: location.search,
    width: innerWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
  })`);
  assert.equal(after.pathname, '/');
  assert.equal(new URLSearchParams(after.search).get('dailyComplete'), '1');
  assert.ok(after.scrollWidth <= after.width + 1, 'handoff Home must not overflow horizontally');

  await writeFile(path.join(artifactsDir, 'daily-handoff.json'), `${JSON.stringify({ before, after }, null, 2)}\n`);
  console.log('Lexia M32 Daily Challenge Handoff Browser: PASS (daily complete → Home, 390x844, no horizontal overflow)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await rm(harnessPath, { force: true });
  await writeFile(platformIndexPath, originalPlatformIndex);
}
