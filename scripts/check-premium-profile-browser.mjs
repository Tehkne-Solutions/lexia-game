import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm38a-profile');
const distDir = path.join(root, 'dist-m38a-profile');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4198;
const debugPort = 9248;
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
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 2000) || ""');
  throw new Error(`Timed out waiting for ${JSON.stringify(text)}. Body: ${JSON.stringify(body)}`);
}

async function capture(cdp, name) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(shot.data, 'base64'));
}

async function snapshot(cdp) {
  return cdp.evaluate(`(() => ({
    width: innerWidth,
    height: innerHeight,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
    profileTitle: document.body?.innerText?.includes('Meu Perfil') || false,
    rewardPanel: Boolean(document.querySelector('.lexia-game-panel-reward')),
    neutralBack: Boolean(document.querySelector('button.lexia-neutral-action')),
    gradientClasses: [...document.querySelectorAll('[class]')].filter((node) => String(node.className).includes('bg-gradient')).length,
    primaryActions: [...document.querySelectorAll('button.lexia-primary-action')].length,
    body: document.body?.innerText || '',
  }))()`);
}

async function clickByText(cdp, text) {
  const clicked = await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.innerText?.includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `button containing ${JSON.stringify(text)} must exist`);
  await sleep(500);
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
if (build.status !== 0) throw new Error(`M38-A build failed:\n${build.stdout}\n${build.stderr}`);

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m38a-profile-chrome');
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
    await navigate(cdp, `${baseUrl}/profile`);
    await waitForText(cdp, 'Meu Perfil');
    await waitForText(cdp, 'Corujinha Guardiã');
    await waitForText(cdp, 'Escolha seu Avatar');

    const initial = await snapshot(cdp);
    assert.equal(initial.profileTitle, true, `${viewport.name}: profile title must render`);
    assert.equal(initial.rewardPanel, true, `${viewport.name}: reward hero panel must render`);
    assert.equal(initial.neutralBack, true, `${viewport.name}: premium neutral back action must render`);
    assert.equal(initial.gradientClasses, 0, `${viewport.name}: learner profile must not contain gradient utility classes`);
    assert.ok(initial.scrollWidth <= initial.width + 1, `${viewport.name}: profile must not overflow horizontally`);

    await clickByText(cdp, 'Corujinha');
    await waitForText(cdp, 'Personalize sua Corujinha');
    const mascotTab = await snapshot(cdp);
    assert.ok(mascotTab.scrollWidth <= mascotTab.width + 1, `${viewport.name}: mascot tab must not overflow horizontally`);

    const tabProofs = { mascot: mascotTab };
    for (const tab of [
      { label: 'Letras', text: 'Histórico de Letras' },
      { label: 'Adesivos', text: 'Álbum de Adesivos' },
      { label: 'Insígnias', text: 'Insígnias' },
      { label: 'Avatar', text: 'Escolha seu Avatar' },
    ]) {
      await clickByText(cdp, tab.label);
      await waitForText(cdp, tab.text);
      const proof = await snapshot(cdp);
      assert.ok(proof.scrollWidth <= proof.width + 1, `${viewport.name}: ${tab.label} tab must not overflow horizontally`);
      tabProofs[tab.label.toLowerCase()] = proof;
    }

    await capture(cdp, `${viewport.name}-profile`);
    proofs.push({ viewport: viewport.name, initial, ...tabProofs });
  }

  await writeFile(path.join(artifactsDir, 'profile-browser-proof.json'), `${JSON.stringify({ pass: true, proofs }, null, 2)}\n`);
  console.log('Lexia M38-A Premium Profile Browser QA: PASS (Profile × mobile-short/mobile/desktop; flat material UI + mascot tab + no overflow)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await sleep(250);
}
