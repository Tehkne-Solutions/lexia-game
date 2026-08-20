import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm38e-drawing');
const distDir = path.join(root, 'dist-m38e-drawing');
const platformIndexPath = path.join(root, 'src', 'platform', 'index.js');
const previewPort = 4201;
const debugPort = 9251;
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

async function waitFor(cdp, expression, label, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await sleep(150);
  }
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 1800) || ""');
  throw new Error(`Timed out waiting for ${label}. Body: ${JSON.stringify(body)}`);
}

async function capture(cdp, name) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(artifactsDir, `${name}.png`), Buffer.from(shot.data, 'base64'));
}

async function buttonState(cdp) {
  return cdp.evaluate(`(() => {
    const buttons = [...document.querySelectorAll('.game-drawing-actions button')];
    const clear = buttons.find((button) => button.innerText.includes('Limpar'));
    const verify = buttons.find((button) => button.innerText.includes('Verificar'));
    return {
      count: buttons.length,
      clearFound: !!clear,
      verifyFound: !!verify,
      clearDisabled: clear?.disabled ?? null,
      verifyDisabled: verify?.disabled ?? null,
      clearSecondary: String(clear?.className || '').includes('lexia-secondary-action'),
      verifyPrimary: String(verify?.className || '').includes('lexia-primary-action'),
      gradientClasses: [...document.querySelectorAll('.game-drawing-actions [class]')]
        .filter((node) => String(node.className).includes('bg-gradient')).length,
    };
  })()`);
}

async function drawStroke(cdp) {
  const rect = await cdp.evaluate(`(() => {
    const canvas = document.querySelector('.game-drawing-board canvas');
    const r = canvas?.getBoundingClientRect();
    return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
  })()`);
  assert.ok(rect?.width > 20 && rect?.height > 20, 'drawing canvas must have measurable bounds');

  const x1 = rect.x + rect.width * 0.35;
  const y1 = rect.y + rect.height * 0.30;
  const x2 = rect.x + rect.width * 0.62;
  const y2 = rect.y + rect.height * 0.70;
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1, y: y1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    const t = step / 6;
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
      button: 'left',
      buttons: 1,
    });
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 });
  await sleep(250);
}

async function clickButton(cdp, label) {
  const clicked = await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('.game-drawing-actions button')]
      .find((node) => node.innerText.includes(${JSON.stringify(label)}));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `${label} must be clickable`);
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
if (build.status !== 0) throw new Error(`M38-E build failed:\n${build.stdout}\n${build.stderr}`);

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort', '--outDir', distDir], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let chrome;
let cdp;
try {
  await waitForHttp(baseUrl);
  const profileDir = path.join(root, '.tmp-m38e-drawing-chrome');
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
    { name: 'desktop', width: 1440, height: 900, mobile: false },
  ]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    await navigate(cdp, `${baseUrl}/play`);
    await waitFor(cdp, `document.querySelector('.game-drawing-board canvas') && document.querySelectorAll('.game-drawing-actions button').length === 2`, 'drawing surface and two actions');

    const initial = await buttonState(cdp);
    assert.equal(initial.count, 2, `${viewport.name}: exactly two drawing actions must render`);
    assert.equal(initial.clearFound, true, `${viewport.name}: Limpar must render`);
    assert.equal(initial.verifyFound, true, `${viewport.name}: Verificar must render`);
    assert.equal(initial.clearSecondary, true, `${viewport.name}: Limpar must use secondary premium action`);
    assert.equal(initial.verifyPrimary, true, `${viewport.name}: Verificar must use primary premium action`);
    assert.equal(initial.clearDisabled, true, `${viewport.name}: Limpar must start disabled on an empty canvas`);
    assert.equal(initial.verifyDisabled, true, `${viewport.name}: Verificar must start disabled on an empty canvas`);
    assert.equal(initial.gradientClasses, 0, `${viewport.name}: drawing actions must remain gradient-free`);
    await capture(cdp, `${viewport.name}-01-empty`);

    await drawStroke(cdp);
    const drawn = await buttonState(cdp);
    assert.equal(drawn.clearDisabled, false, `${viewport.name}: Limpar must enable after drawing`);
    assert.equal(drawn.verifyDisabled, false, `${viewport.name}: Verificar must enable after drawing`);
    await capture(cdp, `${viewport.name}-02-drawn`);

    await clickButton(cdp, 'Limpar');
    await sleep(200);
    const cleared = await buttonState(cdp);
    assert.equal(cleared.clearDisabled, true, `${viewport.name}: Limpar must disable after clearing`);
    assert.equal(cleared.verifyDisabled, true, `${viewport.name}: Verificar must disable after clearing`);

    await drawStroke(cdp);
    await clickButton(cdp, 'Verificar');
    await waitFor(cdp, `document.body?.innerText?.includes('Muito bem') || document.body?.innerText?.includes('Boa tentativa')`, 'evaluation result', 15000);
    await capture(cdp, `${viewport.name}-03-result`);

    proofs.push({ viewport: viewport.name, initial, drawn, cleared });
  }

  await writeFile(path.join(artifactsDir, 'drawing-actions-browser-proof.json'), `${JSON.stringify({ pass: true, proofs }, null, 2)}\n`);
  console.log('Lexia M38-E Premium Drawing Actions Browser QA: PASS (empty → draw → clear → draw → verify on mobile-short + desktop)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await sleep(250);
}
