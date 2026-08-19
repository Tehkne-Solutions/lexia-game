import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm35b');
const distDir = path.join(root, 'dist-m35b');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4195;
const debugPort = 9245;
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
  await sleep(800);
}

async function waitFor(cdp, expression, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function capture(cdp, name) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(shot.data, 'base64'));
}

async function setViewport(cdp, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
  await sleep(250);
}

async function visualSnapshot(cdp) {
  return cdp.evaluate(`(() => {
    const root = document.documentElement;
    const plan = document.querySelector('[aria-label="Plano de aventura"]');
    const cta = [...document.querySelectorAll('button')].find((button) => String(button.className).includes('lexia-primary-action'));
    const rootStyle = getComputedStyle(root);
    const planStyle = plan ? getComputedStyle(plan) : null;
    const ctaStyle = cta ? getComputedStyle(cta) : null;
    return {
      width: innerWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
      rootClasses: root.className,
      backgroundToken: rootStyle.getPropertyValue('--background').trim(),
      primaryToken: rootStyle.getPropertyValue('--primary').trim(),
      planFound: !!plan,
      planBackground: planStyle?.backgroundColor || '',
      planShadow: planStyle?.boxShadow || '',
      ctaFound: !!cta,
      ctaBackgroundImage: ctaStyle?.backgroundImage || '',
      ctaBackgroundColor: ctaStyle?.backgroundColor || '',
      ctaBoxShadow: ctaStyle?.boxShadow || '',
      body: document.body?.innerText || '',
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
if (build.status !== 0) throw new Error(`M35-B build failed:\n${build.stdout}\n${build.stderr}`);

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m35b-chrome');
  await rm(profileDir, { recursive: true, force: true });
  chrome = spawn(findChrome(), ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await getPageTarget();
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const proofs = [];
  for (const viewport of [{ width: 360, height: 640, name: '360x640' }, { width: 390, height: 844, name: '390x844' }]) {
    await setViewport(cdp, viewport.width, viewport.height);
    await navigate(cdp, baseUrl);
    await cdp.evaluate(`localStorage.setItem('lexia_accessibility', JSON.stringify({ dyslexiaFont: false, highContrast: false, textSize: 'md' }))`);
    await cdp.send('Page.reload');
    await waitFor(cdp, `document.querySelector('[aria-label="Plano de aventura"]') && [...document.querySelectorAll('button')].some((button) => String(button.className).includes('lexia-primary-action'))`, 'premium Home surface');
    const normal = await visualSnapshot(cdp);
    assert.equal(normal.planFound, true, `${viewport.name}: adventure plan must exist`);
    assert.equal(normal.ctaFound, true, `${viewport.name}: primary CTA must exist`);
    assert.equal(normal.ctaBackgroundImage, 'none', `${viewport.name}: primary CTA gradient must be removed by premium theme`);
    assert.notEqual(normal.ctaBoxShadow, 'none', `${viewport.name}: primary CTA must have material depth`);
    assert.notEqual(normal.planShadow, 'none', `${viewport.name}: adventure plan must have authored material depth`);
    assert.ok(normal.scrollWidth <= normal.width + 1, `${viewport.name}: Home must not overflow horizontally`);
    assert.equal(normal.backgroundToken, '43 44% 96%', `${viewport.name}: premium warm-paper background token must be active`);
    await capture(cdp, `01-premium-home-${viewport.name}`);

    await cdp.evaluate(`localStorage.setItem('lexia_accessibility', JSON.stringify({ dyslexiaFont: false, highContrast: true, textSize: 'md' }))`);
    await cdp.send('Page.reload');
    await waitFor(cdp, `document.documentElement.classList.contains('high-contrast')`, 'high contrast mode');
    const highContrast = await visualSnapshot(cdp);
    assert.ok(highContrast.rootClasses.includes('high-contrast'), `${viewport.name}: high contrast class must be active`);
    assert.equal(highContrast.backgroundToken, '0 0% 100%', `${viewport.name}: high contrast background must override premium palette`);
    assert.equal(highContrast.primaryToken, '240 100% 30%', `${viewport.name}: high contrast primary must override premium palette`);
    assert.ok(highContrast.scrollWidth <= highContrast.width + 1, `${viewport.name}: high contrast Home must not overflow horizontally`);
    await capture(cdp, `02-high-contrast-home-${viewport.name}`);
    proofs.push({ viewport: viewport.name, normal, highContrast });
  }

  await writeFile(path.join(artifactsDir, 'premium-ui-proof.json'), `${JSON.stringify({ pass: true, proofs }, null, 2)}\n`);
  console.log('Lexia M35-B Premium UI Browser Proof: PASS (360x640 + 390x844, no gradient CTA, material surfaces, high contrast preserved)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await sleep(250);
}
