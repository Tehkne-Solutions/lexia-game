import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm15');
const previewPort = 4174;
const debugPort = 9223;
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
      if (response.ok) return response;
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

async function waitForText(cdp, text, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate(`document.body?.innerText?.includes(${JSON.stringify(text)})`);
    if (found) return;
    await sleep(150);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 1800) || ""');
  throw new Error(`Timed out waiting for text ${JSON.stringify(text)} at ${href}. Visible body: ${JSON.stringify(body)}`);
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

async function captureFailureEvidence(cdp, name, error) {
  try {
    await capture(cdp, `${name}-debug`);
    const diagnostic = {
      error: error?.message || String(error),
      metrics: await metrics(cdp),
      bodyText: await cdp.evaluate('document.body?.innerText?.slice(0, 5000) || ""'),
      bodyHtml: await cdp.evaluate('document.body?.innerHTML?.slice(0, 8000) || ""'),
    };
    await writeFile(
      path.join(artifactsDir, `${name}-debug.json`),
      `${JSON.stringify(diagnostic, null, 2)}\n`,
    );
  } catch (diagnosticError) {
    console.error(`Unable to capture ${name} diagnostic evidence:`, diagnosticError);
  }
}

function assertSurface(value, name) {
  assert.ok(value.documentScrollWidth <= value.innerWidth + 1, `${name}: document horizontal overflow (${value.documentScrollWidth} > ${value.innerWidth})`);
  assert.ok(value.bodyScrollWidth <= value.innerWidth + 1, `${name}: body horizontal overflow (${value.bodyScrollWidth} > ${value.innerWidth})`);
  assert.ok(value.documentScrollHeight >= value.innerHeight, `${name}: document must cover viewport (${value.documentScrollHeight} < ${value.innerHeight})`);
  assert.ok(value.bodyScrollHeight > 0, `${name}: body must render`);
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
  const profileDir = path.join(root, '.tmp-m15-chrome');
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

    await navigate(cdp, `${baseUrl}/story`);
    try {
      await waitForText(cdp, 'Biblioteca da Jornada');
      await waitForText(cdp, 'Histórias que acompanham seus mundos');
      await waitForText(cdp, '1/6 livros');
      await waitForText(cdp, 'Pena das 26 Vozes');
      assertSurface(await metrics(cdp), `${viewport.name}/story`);
      await capture(cdp, `${viewport.name}-story`);
    } catch (error) {
      await captureFailureEvidence(cdp, `${viewport.name}-story`, error);
      throw error;
    }

    await navigate(cdp, `${baseUrl}/speed-challenge`);
    try {
      await waitForText(cdp, 'Desafio Relâmpago!');
      // CSS text-transform renders this source label in uppercase; innerText reflects rendered text.
      await waitForText(cdp, 'TREINO ATUAL');
      await waitForText(cdp, 'Até Letras');
      await waitForText(cdp, '1/4');
      await waitForText(cdp, 'Frases continuam no modo próprio de composição');
      assertSurface(await metrics(cdp), `${viewport.name}/speed`);
      await capture(cdp, `${viewport.name}-speed`);
    } catch (error) {
      await captureFailureEvidence(cdp, `${viewport.name}-speed`, error);
      throw error;
    }
  }

  console.log('Lexia Side Modes Browser M15: PASS (Story + Speed × mobile-short/mobile/desktop = 6 screenshots; combined release evidence = 30)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
