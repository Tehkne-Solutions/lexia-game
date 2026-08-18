import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  DAILY_CHALLENGE_TYPES,
  buildDailyChallengeDefinition,
} from '../src/game/dailyChallengeEngine.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactsDir = path.join(root, 'artifacts', 'm16');
const previewPort = 4175;
const debugPort = 9224;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const challengeKey = 'lexia_daily_challenge_v2';
const today = new Date().toISOString().slice(0, 10);

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const masteredLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
  letter,
  stability: 10,
  difficulty: 3,
  interval: 30,
  repetitions: 5,
  next_review: futureDate,
  total_attempts: 5,
  correct_attempts: 5,
  streak: 5,
  last_grade: 4,
  stars_earned: 2,
}));
const syllables = Array.from({ length: 20 }, (_, index) => ({
  letter: `SYL_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
  stars_earned: 1,
}));
const complexSyllables = Array.from({ length: 20 }, (_, index) => ({
  letter: `SYLC_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
  stars_earned: 1,
}));
const words = Array.from({ length: 20 }, (_, index) => ({
  letter: `WORD_${index}`,
  total_attempts: 3,
  correct_attempts: 3,
  stars_earned: 1,
}));

const definitions = [
  buildDailyChallengeDefinition([], today),
  buildDailyChallengeDefinition(masteredLetters, today),
  buildDailyChallengeDefinition([...masteredLetters, ...syllables], today),
  buildDailyChallengeDefinition([...masteredLetters, ...syllables, ...complexSyllables], today),
  buildDailyChallengeDefinition([...masteredLetters, ...syllables, ...complexSyllables, ...words], today),
];

assert.deepEqual(
  definitions.map((definition) => definition.type),
  [
    DAILY_CHALLENGE_TYPES.LETTERS,
    DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES,
    DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES,
    DAILY_CHALLENGE_TYPES.WORDS,
    DAILY_CHALLENGE_TYPES.SENTENCES,
  ],
);

function persistedChallenge(definition) {
  return {
    ...definition,
    progress: Object.fromEntries(definition.targetKeys.map((key) => [key, false])),
    completed: false,
  };
}

function withTarget(playPath, targetKey) {
  const separator = playPath.includes('?') ? '&' : '?';
  return `${playPath}${separator}dailyTarget=${encodeURIComponent(targetKey)}`;
}

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
  const normalizedText = String(text).toLocaleLowerCase('pt-BR');
  while (Date.now() < deadline) {
    const found = await cdp.evaluate(`document.body?.innerText?.toLocaleLowerCase('pt-BR').includes(${JSON.stringify(normalizedText)})`);
    if (found) return;
    await sleep(150);
  }
  const href = await cdp.evaluate('location.href');
  const body = await cdp.evaluate('document.body?.innerText?.slice(0, 2400) || ""');
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

async function seedChallenge(cdp, definition) {
  const value = JSON.stringify(persistedChallenge(definition));
  await cdp.evaluate(`localStorage.setItem(${JSON.stringify(challengeKey)}, ${JSON.stringify(value)})`);
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
      bodyText: await cdp.evaluate('document.body?.innerText?.slice(0, 6000) || ""'),
      bodyHtml: await cdp.evaluate('document.body?.innerHTML?.slice(0, 10000) || ""'),
      savedChallenge: await cdp.evaluate(`localStorage.getItem(${JSON.stringify(challengeKey)})`),
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

const modeNames = {
  [DAILY_CHALLENGE_TYPES.LETTERS]: 'letters',
  [DAILY_CHALLENGE_TYPES.SIMPLE_SYLLABLES]: 'simple',
  [DAILY_CHALLENGE_TYPES.COMPLEX_SYLLABLES]: 'complex',
  [DAILY_CHALLENGE_TYPES.WORDS]: 'words',
  [DAILY_CHALLENGE_TYPES.SENTENCES]: 'sentences',
};

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
  const profileDir = path.join(root, '.tmp-m16-chrome');
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

  await navigate(cdp, baseUrl);

  for (const viewport of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });

    const lettersDefinition = definitions[0];
    await seedChallenge(cdp, lettersDefinition);
    await navigate(cdp, baseUrl);
    try {
      await waitForText(cdp, 'Desafio diário · Letras');
      const clicked = await cdp.evaluate(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((node) => node.innerText?.toLocaleLowerCase('pt-BR').includes('desafio diário'));
        if (!button) return false;
        button.click();
        return true;
      })()`);
      assert.equal(clicked, true, `${viewport.name}/card: daily launcher must be clickable`);
      await waitForText(cdp, lettersDefinition.title);
      await waitForText(cdp, '0/3');
      await sleep(500);
      assertSurface(await metrics(cdp), `${viewport.name}/daily-card`);
      await capture(cdp, `${viewport.name}-daily-card`);
    } catch (error) {
      await captureFailureEvidence(cdp, `${viewport.name}-daily-card`, error);
      throw error;
    }

    for (const definition of definitions) {
      const targetItem = definition.targets[0];
      await seedChallenge(cdp, definition);
      const launchPath = withTarget(definition.playPath, targetItem.key);
      await navigate(cdp, `${baseUrl}${launchPath}`);
      const modeName = modeNames[definition.type];
      const evidenceName = `${viewport.name}-daily-${modeName}`;
      try {
        await waitForText(cdp, 'Desafio diário');
        if (definition.type === DAILY_CHALLENGE_TYPES.LETTERS) {
          await waitForText(cdp, `Desenhe a letra ${targetItem.display}!`);
        } else {
          await waitForText(cdp, targetItem.hint);
        }
        const activeTarget = await cdp.evaluate('new URLSearchParams(location.search).get("dailyTarget")');
        assert.equal(activeTarget, targetItem.key, `${evidenceName}: route must preserve exact daily target`);
        assertSurface(await metrics(cdp), evidenceName);
        await capture(cdp, evidenceName);
      } catch (error) {
        await captureFailureEvidence(cdp, evidenceName, error);
        throw error;
      }
    }
  }

  console.log('Lexia Journey Daily Challenge Browser M16: PASS (card + five mechanics × mobile-short/mobile/desktop = 18 screenshots; combined release evidence = 48)');
} finally {
  cdp?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
}
