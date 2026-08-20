import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm38b-world');
const distDir = path.join(root, 'dist-m38b-world');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4199;
const debugPort = 9249;
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

async function waitForHttp(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(url) { this.url = url; this.socket = null; this.sequence = 0; this.pending = new Map(); }
  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection timeout')), 10000);
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

async function waitForText(cdp, text, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(`document.body?.innerText?.includes(${JSON.stringify(text)})`)) return;
    await sleep(150);
  }
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 2200) || ""');
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}. Body: ${JSON.stringify(body)}`);
}

async function capture(cdp, name) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(shot.data, 'base64'));
}

async function snapshot(cdp) {
  return cdp.evaluate(`(() => {
    const scroll = document.querySelector('.game-scroll-y');
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
      titleFound: document.body?.innerText?.includes('Mapa do Mundo') || false,
      gameplayHud: Boolean(document.querySelector('.lexia-gameplay-hud')),
      gamePanels: document.querySelectorAll('.lexia-game-panel').length,
      rewardPanels: document.querySelectorAll('.lexia-game-panel-reward').length,
      successPanels: document.querySelectorAll('.lexia-game-panel-success').length,
      primaryActions: document.querySelectorAll('button.lexia-primary-action').length,
      secondaryActions: document.querySelectorAll('button.lexia-secondary-action').length,
      neutralActions: document.querySelectorAll('button.lexia-neutral-action').length,
      gradientClasses: [...document.querySelectorAll('[class]')].filter((node) => String(node.className).includes('bg-gradient')).length,
      lockedHints: [...document.querySelectorAll('p')].filter((node) => node.innerText?.includes('🔒')).length,
      missionCurrent: document.body?.innerText?.includes('Missão atual') || false,
      scrollClientHeight: scroll?.clientHeight || 0,
      scrollHeight: scroll?.scrollHeight || 0,
    };
  })()`);
}

await rm(artifactsDir, { recursive: true, force: true });
await rm(distDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const originalPlatformIndex = await readFile(platformIndexPath, 'utf8');
let build;
try {
  await writeFile(platformIndexPath, "export * from '../../scripts/fixtures/e2e-platform.js';\n");
  build = spawnSync(process.execPath, [vite, 'build', '--outDir', distDir], { cwd: root, encoding: 'utf8', env: { ...process.env } });
} finally {
  await writeFile(platformIndexPath, originalPlatformIndex);
}
if (build.status !== 0) throw new Error(`M38-B build failed:\n${build.stdout}\n${build.stderr}`);

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m38b-world-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(findChrome(), ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await getPageTarget();
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const proofs = [];
  for (const viewport of [
    { name: 'mobile-short', width: 360, height: 640, mobile: true },
    { name: 'mobile', width: 390, height: 844, mobile: true },
    { name: 'desktop', width: 1440, height: 900, mobile: false },
  ]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    await navigate(cdp, `${baseUrl}/world`);
    await waitForText(cdp, 'Mapa do Mundo');
    await waitForText(cdp, 'Mundo das Letras');
    await waitForText(cdp, 'Sílabas Simples');
    await waitForText(cdp, 'Frases Mágicas');
    await waitForText(cdp, 'Missão atual');

    const proof = await snapshot(cdp);
    assert.equal(proof.titleFound, true, `${viewport.name}: world map title must render`);
    assert.equal(proof.gameplayHud, true, `${viewport.name}: gameplay HUD must render`);
    assert.ok(proof.gamePanels >= 6, `${viewport.name}: five world panels plus summary must use premium material panels`);
    assert.ok(proof.rewardPanels >= 1, `${viewport.name}: recommended world must use reward material`);
    assert.ok(proof.successPanels >= 1, `${viewport.name}: completed alphabet world must use success material`);
    assert.ok(proof.primaryActions >= 1, `${viewport.name}: recommended world must expose primary premium action`);
    assert.ok(proof.secondaryActions >= 1, `${viewport.name}: completed playable world must expose secondary premium action`);
    assert.ok(proof.neutralActions >= 1, `${viewport.name}: premium back action must render`);
    assert.equal(proof.gradientClasses, 0, `${viewport.name}: world map DOM must not use gradient utilities`);
    assert.ok(proof.lockedHints >= 1, `${viewport.name}: locked progression hints must remain visible`);
    assert.equal(proof.missionCurrent, true, `${viewport.name}: current mission marker must remain visible`);
    assert.ok(proof.scrollWidth <= proof.width + 1, `${viewport.name}: world map must not overflow horizontally`);
    assert.ok(proof.scrollClientHeight > 0 && proof.scrollHeight >= proof.scrollClientHeight, `${viewport.name}: bounded world scroll region must remain valid`);

    await capture(cdp, `${viewport.name}-world-map`);
    proofs.push({ viewport: viewport.name, proof });
  }

  await writeFile(path.join(artifactsDir, 'world-map-browser-proof.json'), `${JSON.stringify({ pass: true, proofs }, null, 2)}\n`);
  console.log('Lexia M38-B Premium World Map Browser QA: PASS (world map × mobile-short/mobile/desktop; premium panels/actions + progression + no gradients)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await sleep(250);
}
