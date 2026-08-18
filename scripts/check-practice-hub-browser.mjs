import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm17');
const previewPort = 4176;
const debugPort = 9225;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].filter(Boolean);
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
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 3000) || ""');
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
    bodyScrollHeight: document.body?.scrollHeight || 0,
  }))()`);
}

function assertSurface(value, name) {
  assert.ok(value.documentScrollWidth <= value.innerWidth + 1, `${name}: document horizontal overflow (${value.documentScrollWidth} > ${value.innerWidth})`);
  assert.ok(value.bodyScrollWidth <= value.innerWidth + 1, `${name}: body horizontal overflow (${value.bodyScrollWidth} > ${value.innerWidth})`);
  assert.ok(value.documentScrollHeight >= value.innerHeight, `${name}: document must cover viewport`);
  assert.ok(value.bodyScrollHeight > 0, `${name}: body must render`);
}

async function captureFailure(cdp, name, error) {
  try {
    await capture(cdp, `${name}-debug`);
    const diagnostic = {
      error: error?.message || String(error),
      metrics: await metrics(cdp),
      bodyText: await cdp.evaluate('document.body?.innerText?.slice(0, 6000) || ""'),
    };
    await writeFile(path.join(artifactsDir, `${name}-debug.json`), `${JSON.stringify(diagnostic, null, 2)}\n`);
  } catch (diagnosticError) {
    console.error(`Unable to capture ${name} diagnostic evidence:`, diagnosticError);
  }
}

const viewports = [
  { name: 'mobile-short', width: 360, height: 640, mobile: true },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
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
  const chromeBin = findChrome();
  const profileDir = path.join(root, '.tmp-m17-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(chromeBin, [
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

    const hubName = `${viewport.name}-practice-hub`;
    await navigate(cdp, `${baseUrl}/practice`);
    try {
      await waitForText(cdp, 'Prática Livre');
      await waitForText(cdp, '1/5 práticas disponíveis');
      await waitForText(cdp, 'Ateliê das Letras');
      await waitForText(cdp, 'Continue a jornada para liberar');
      const enabledButtons = await cdp.evaluate(`Array.from(document.querySelectorAll('button')).filter((button) => button.innerText?.includes('Treinar') && !button.disabled).length`);
      assert.equal(enabledButtons, 1, `${hubName}: Fresh Start must expose only letter practice`);
      assertSurface(await metrics(cdp), hubName);
      await capture(cdp, hubName);
    } catch (error) {
      await captureFailure(cdp, hubName, error);
      throw error;
    }

    const sentencesName = `${viewport.name}-practice-sentences`;
    await navigate(cdp, `${baseUrl}/play-sentences?practice=true`);
    try {
      await waitForText(cdp, 'Prática');
      await waitForText(cdp, 'Frases Mágicas');
      await waitForText(cdp, 'Toque nas palavras na ordem correta');
      const body = await cdp.evaluate('document.body?.innerText || ""');
      assert.ok(!body.includes('Desafio diário'), `${sentencesName}: practice must not present daily mission UI`);
      const practiceParam = await cdp.evaluate('new URLSearchParams(location.search).get("practice")');
      assert.equal(practiceParam, 'true', `${sentencesName}: practice route must preserve explicit mode`);
      assertSurface(await metrics(cdp), sentencesName);
      await capture(cdp, sentencesName);
    } catch (error) {
      await captureFailure(cdp, sentencesName, error);
      throw error;
    }
  }

  console.log('Lexia Journey Free Practice Browser M17: PASS (Practice Hub + sentence practice × mobile-short/mobile/desktop = 6 screenshots; combined release evidence = 54)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
