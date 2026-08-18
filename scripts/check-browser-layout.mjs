import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm12');
const previewPort = 4173;
const debugPort = 9222;
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
      this.socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.socket.addEventListener('error', (event) => {
        clearTimeout(timer);
        reject(new Error(`CDP WebSocket error: ${event?.message || 'unknown'}`));
      });
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
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    }
    return result.result?.value;
  }

  close() {
    this.socket?.close();
  }
}

async function getPageTarget() {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
  const targets = await response.json();
  const page = targets.find((target) => target.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('No Chrome page target found');
  return page;
}

async function waitForSelector(cdp, selector, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    if (found) return;
    await sleep(150);
  }
  const url = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 500)');
  throw new Error(`Timed out waiting for ${selector} at ${url}. Body: ${body}`);
}

async function waitForText(cdp, text, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate(`document.body?.innerText?.includes(${JSON.stringify(text)})`);
    if (found) return;
    await sleep(150);
  }
  const url = await cdp.evaluate('location.href');
  throw new Error(`Timed out waiting for text ${JSON.stringify(text)} at ${url}`);
}

async function navigate(cdp, url, selector) {
  await cdp.send('Page.navigate', { url });
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const ready = await cdp.evaluate("document.readyState === 'complete'");
    if (ready) break;
    await sleep(100);
  }
  await waitForSelector(cdp, selector);
  await sleep(1500);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function getLayoutMetrics(cdp, shellSelector, scrollSelector = null) {
  return cdp.evaluate(`(() => {
    const shell = document.querySelector(${JSON.stringify(shellSelector)});
    const scroll = ${scrollSelector ? `document.querySelector(${JSON.stringify(scrollSelector)})` : 'null'};
    const board = document.querySelector('.game-drawing-board');
    const shellRect = shell?.getBoundingClientRect();
    const boardRect = board?.getBoundingClientRect();
    return {
      href: location.href,
      innerWidth,
      innerHeight,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth || 0,
      shellHeight: shellRect?.height || 0,
      shellWidth: shellRect?.width || 0,
      shellScrollHeight: shell?.scrollHeight || 0,
      shellClientHeight: shell?.clientHeight || 0,
      scrollClientHeight: scroll?.clientHeight || 0,
      scrollScrollHeight: scroll?.scrollHeight || 0,
      boardWidth: boardRect?.width || 0,
      boardHeight: boardRect?.height || 0,
    };
  })()`);
}

async function getDocumentMetrics(cdp) {
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

function assertViewportMetrics(metrics, { name, allowShellScroll = false, expectBoard = false }) {
  assert.ok(metrics.shellHeight > 0, `${name}: shell must render`);
  assert.ok(Math.abs(metrics.shellHeight - metrics.innerHeight) <= 2, `${name}: shell height ${metrics.shellHeight} must match viewport ${metrics.innerHeight}`);
  assert.ok(metrics.documentScrollWidth <= metrics.innerWidth + 1, `${name}: document horizontal overflow detected`);
  assert.ok(metrics.bodyScrollWidth <= metrics.innerWidth + 1, `${name}: body horizontal overflow detected`);
  if (!allowShellScroll) {
    assert.ok(metrics.shellScrollHeight <= metrics.shellClientHeight + 2, `${name}: outer shell must not document-scroll`);
  }
  if (expectBoard) {
    assert.ok(metrics.boardWidth > 0 && metrics.boardHeight > 0, `${name}: drawing board must render`);
    assert.ok(Math.abs(metrics.boardWidth - metrics.boardHeight) <= 2, `${name}: drawing board must remain square`);
    assert.ok(metrics.boardWidth <= 262, `${name}: drawing board exceeds desktop cap`);
    assert.ok(metrics.boardWidth <= metrics.innerHeight * 0.42 + 2, `${name}: drawing board exceeds 42dvh cap`);
  }
}

function assertDocumentSurface(metrics, name) {
  assert.ok(metrics.documentScrollWidth <= metrics.innerWidth + 1, `${name}: document horizontal overflow detected`);
  assert.ok(metrics.bodyScrollWidth <= metrics.innerWidth + 1, `${name}: body horizontal overflow detected`);
  assert.ok(metrics.documentScrollHeight >= metrics.innerHeight, `${name}: document must cover viewport height`);
  assert.ok(metrics.bodyScrollHeight > 0, `${name}: body must render content`);
}

async function assertBoundedGameSurface(cdp, viewportName, surfaceName) {
  const metrics = await getLayoutMetrics(cdp, '.game-viewport', '.game-scroll-y');
  assertViewportMetrics(metrics, { name: `${viewportName}/${surfaceName}` });
  assert.ok(metrics.scrollClientHeight > 0, `${viewportName}/${surfaceName}: bounded content region must render`);
  assert.ok(metrics.scrollScrollHeight >= metrics.scrollClientHeight, `${viewportName}/${surfaceName}: scroll metrics invalid`);
  return metrics;
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
  'preview',
  '--host', '127.0.0.1',
  '--port', String(previewPort),
  '--strictPort',
], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const chromeBin = findChrome();
  const profileDir = path.join(root, '.tmp-m12-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(chromeBin, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--mute-audio',
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

  for (const viewport of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });

    await navigate(cdp, `${baseUrl}/`, '.game-viewport-scroll');
    const welcomeMetrics = await getLayoutMetrics(cdp, '.game-viewport-scroll');
    assertViewportMetrics(welcomeMetrics, { name: `${viewport.name}/welcome`, allowShellScroll: true });
    await capture(cdp, `${viewport.name}-welcome`);

    await navigate(cdp, `${baseUrl}/play`, '.game-viewport');
    await waitForSelector(cdp, '.game-drawing-board');
    const playMetrics = await getLayoutMetrics(cdp, '.game-viewport', '.game-scroll-y');
    assertViewportMetrics(playMetrics, { name: `${viewport.name}/play`, expectBoard: true });
    assert.ok(playMetrics.scrollClientHeight > 0, `${viewport.name}/play: bounded activity scroll region must render`);
    await capture(cdp, `${viewport.name}-play`);

    await navigate(cdp, `${baseUrl}/world`, '.game-viewport');
    await assertBoundedGameSurface(cdp, viewport.name, 'world');
    await waitForText(cdp, 'Sílabas Complexas');
    await waitForText(cdp, 'Frases Mágicas');
    await capture(cdp, `${viewport.name}-world`);

    await navigate(cdp, `${baseUrl}/play-syllables?mode=complex`, '.game-viewport');
    await waitForText(cdp, 'Sílabas Complexas');
    await waitForText(cdp, 'Expedição dos Encontros');
    await assertBoundedGameSurface(cdp, viewport.name, 'complex-syllables');
    await capture(cdp, `${viewport.name}-complex-syllables`);

    await navigate(cdp, `${baseUrl}/play-sentences`, '.game-viewport');
    await waitForText(cdp, 'Frases Mágicas');
    await waitForText(cdp, 'Expedição das Histórias');
    await assertBoundedGameSurface(cdp, viewport.name, 'sentences');
    await capture(cdp, `${viewport.name}-sentences`);

    await navigate(cdp, `${baseUrl}/parent`, 'body');
    await waitForText(cdp, 'Jornada de Alfabetização');
    await waitForText(cdp, 'Precisão geral');
    await waitForText(cdp, 'Sílabas Complexas');
    await waitForText(cdp, 'Frases Mágicas');
    const parentMetrics = await getDocumentMetrics(cdp);
    assertDocumentSurface(parentMetrics, `${viewport.name}/parent`);
    await capture(cdp, `${viewport.name}-parent`);
  }

  console.log('Lexia Browser Layout M12: PASS (Chrome mobile-short/mobile/desktop; 6 journey/parent surfaces × 3 viewports = 18 screenshots)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
