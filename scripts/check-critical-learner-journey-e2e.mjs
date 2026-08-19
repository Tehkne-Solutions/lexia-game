import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm28c');
const distDir = path.join(root, 'dist-m28c');
const previewPort = 4186;
const debugPort = 9236;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const storageKey = 'lexia_m28c_progress_v1';
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
  return waitFor(
    cdp,
    `document.body?.innerText?.includes(${JSON.stringify(text)})`,
    `text ${JSON.stringify(text)}`,
    timeoutMs,
  );
}

async function clickButton(cdp, text, exact = false) {
  const clicked = await cdp.evaluate(`(() => {
    const text = ${JSON.stringify(text)};
    const exact = ${JSON.stringify(exact)};
    const button = [...document.querySelectorAll('button')].find((item) => {
      const value = item.innerText?.trim() || '';
      return exact ? value === text : value.includes(text);
    });
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `button ${JSON.stringify(text)} must be clickable`);
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
const build = spawnSync(process.execPath, [vite, 'build', '--outDir', distDir], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, LEXIA_E2E_MEMORY_PLATFORM: 'true' },
});
if (build.status !== 0) {
  throw new Error(`M28-C E2E build failed:\n${build.stdout}\n${build.stderr}`);
}

const preview = spawn(process.execPath, [
  vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir,
], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });

let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m28c-chrome');
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
  await waitForText(cdp, 'Missão: Sílabas Simples');
  await waitForText(cdp, 'Continuar sílabas');

  const home = await snapshot(cdp);
  assert.equal(home.progress.length, 26, 'E2E fixture must begin with the mastered alphabet only');
  assert.ok(home.scrollWidth <= home.width + 1, 'home must not overflow horizontally on mobile');
  await capture(cdp, '01-home-syllables-mission');

  await clickButton(cdp, 'Continuar sílabas');
  await waitFor(cdp, "location.pathname === '/play-syllables'", 'syllable route');
  await waitForText(cdp, 'Sílabas Simples');
  await waitForText(cdp, 'Digite:');

  const targetSyllable = await cdp.evaluate(`(() => {
    const match = (document.body?.innerText || '').match(/Digite:\\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ]+)/);
    return match?.[1] || null;
  })()`);
  assert.ok(targetSyllable && targetSyllable.length >= 2, `expected a visible syllable target, got ${targetSyllable}`);

  for (const character of [...targetSyllable]) {
    await clickButton(cdp, character, true);
  }
  await clickButton(cdp, 'Verificar');
  await waitForText(cdp, 'Correto!');
  await waitFor(
    cdp,
    `(() => {
      const rows = JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || '[]');
      const row = rows.find((item) => item.letter === ${JSON.stringify(`SYL_${'${targetSyllable}'}`)}.replace('\${targetSyllable}', ${JSON.stringify('')}));
      return Boolean(row);
    })()`,
    'persisted syllable record',
    3000,
  ).catch(() => {});

  const afterAnswer = await snapshot(cdp);
  const persisted = afterAnswer.progress.find((record) => record.letter === `SYL_${targetSyllable}`);
  assert.ok(persisted, `correct gameplay must persist SYL_${targetSyllable}`);
  assert.equal(persisted.total_attempts, 1, 'first E2E syllable attempt must be persisted exactly once');
  assert.equal(persisted.correct_attempts, 1, 'correct E2E syllable attempt must be persisted');
  assert.equal(persisted.stars_earned, 1, 'correct E2E syllable attempt must earn one base star');
  assert.ok(afterAnswer.scrollWidth <= afterAnswer.width + 1, 'gameplay result must not overflow horizontally');
  await capture(cdp, '02-syllable-correct-persisted');

  await cdp.send('Page.reload');
  await waitForText(cdp, 'Sílabas Simples');
  await waitFor(cdp, `(() => [...document.querySelectorAll('span')].some((span) => span.innerText?.trim() === '53'))()`, 'restored total stars');

  const afterReload = await snapshot(cdp);
  const restored = afterReload.progress.find((record) => record.letter === `SYL_${targetSyllable}`);
  assert.deepEqual(restored, persisted, 'browser reload must restore the exact persisted gameplay record');
  assert.ok(afterReload.scrollWidth <= afterReload.width + 1, 'reloaded gameplay must not overflow horizontally');
  await capture(cdp, '03-reload-restores-progress');

  await navigate(cdp, baseUrl);
  await waitForText(cdp, 'Missão: Sílabas Simples');
  const resumedHome = await snapshot(cdp);
  assert.ok(resumedHome.progress.some((record) => record.letter === `SYL_${targetSyllable}`), 'returning home must preserve learner progress');
  assert.equal(resumedHome.progress.length, 27, 'journey resume must keep the new record alongside the 26 seeded letters');
  await capture(cdp, '04-home-resumes-persisted-journey');

  await writeFile(path.join(artifactsDir, 'critical-journey.json'), `${JSON.stringify({
    targetSyllable,
    persistedRecord: restored,
    recordCount: resumedHome.progress.length,
    totalStars: resumedHome.progress.reduce((sum, row) => sum + Number(row.stars_earned || 0), 0),
    finalHref: resumedHome.href,
  }, null, 2)}\n`);

  console.log(`Lexia M28-C Critical Learner Journey E2E: PASS (home → ${targetSyllable} gameplay → persistence → reload → home resume)`);
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
