const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_BASE_DELAY_MS = 250;

const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ERR_NETWORK',
  'NETWORK_ERROR',
  'READ_TIMEOUT',
]);

function readStatus(error) {
  return Number(error?.status || error?.statusCode || error?.response?.status || 0);
}

function readCode(error) {
  return String(error?.code || error?.name || '').toUpperCase();
}

export function isTransientReadError(error) {
  const status = readStatus(error);
  if (TRANSIENT_HTTP_STATUSES.has(status)) return true;

  const code = readCode(error);
  if (TRANSIENT_ERROR_CODES.has(code)) return true;

  const message = String(error?.message || '').toLowerCase();
  return message.includes('network error')
    || message.includes('failed to fetch')
    || message.includes('load failed')
    || message.includes('timed out');
}

function createReadTimeoutError(timeoutMs) {
  const error = new Error(`Read operation timed out after ${timeoutMs}ms`);
  error.name = 'ReadTimeoutError';
  error.code = 'READ_TIMEOUT';
  error.status = 408;
  return error;
}

async function runAttempt(operation, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(createReadTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function runResilientRead(operation, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts || DEFAULT_MAX_ATTEMPTS));
  const timeoutMs = Math.max(1, Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  const baseDelayMs = Math.max(0, Number(options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS));
  const sleep = options.sleep || ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await runAttempt(operation, timeoutMs);
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxAttempts && isTransientReadError(error);
      if (!shouldRetry) throw error;
      if (baseDelayMs > 0) await sleep(baseDelayMs * (2 ** (attempt - 1)));
    }
  }

  throw lastError;
}

export function decoratePlatformWithReadResilience(platform, options = {}) {
  return {
    ...platform,
    progress: {
      ...platform.progress,
      list: (...args) => runResilientRead(() => platform.progress.list(...args), options),
    },
    auth: {
      ...platform.auth,
      me: (...args) => runResilientRead(() => platform.auth.me(...args), options),
      getPublicSettings: (...args) => runResilientRead(() => platform.auth.getPublicSettings(...args), options),
    },
  };
}

export const readResiliencePolicy = Object.freeze({
  maxAttempts: DEFAULT_MAX_ATTEMPTS,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  baseDelayMs: DEFAULT_BASE_DELAY_MS,
  retriedMethods: ['progress.list', 'auth.me', 'auth.getPublicSettings'],
  nonRetriedSideEffects: [
    'progress.create',
    'progress.update',
    'progress.remove',
    'progress.clearAll',
    'storage.uploadFile',
    'ai.invoke',
    'email.send',
  ],
});
