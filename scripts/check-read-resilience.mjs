import assert from 'node:assert/strict';
import {
  decoratePlatformWithReadResilience,
  isTransientReadError,
  readResiliencePolicy,
  runResilientRead,
} from '../src/platform/decorators/readResilienceDecorator.js';

assert.equal(isTransientReadError({ status: 503 }), true, '503 must be retryable');
assert.equal(isTransientReadError({ status: 429 }), true, '429 must be retryable');
assert.equal(isTransientReadError({ status: 401 }), false, '401 must not be retried');
assert.equal(isTransientReadError(new Error('validation failed')), false, 'domain failures must not be retried');

let transientAttempts = 0;
const transientResult = await runResilientRead(async () => {
  transientAttempts += 1;
  if (transientAttempts === 1) {
    const error = new Error('temporary upstream outage');
    error.status = 503;
    throw error;
  }
  return 'recovered';
}, { maxAttempts: 2, timeoutMs: 100, baseDelayMs: 0 });
assert.equal(transientResult, 'recovered');
assert.equal(transientAttempts, 2, 'one transient read failure must retry exactly once');

let permanentAttempts = 0;
await assert.rejects(
  runResilientRead(async () => {
    permanentAttempts += 1;
    const error = new Error('unauthorized');
    error.status = 401;
    throw error;
  }, { maxAttempts: 3, timeoutMs: 100, baseDelayMs: 0 }),
  /unauthorized/,
);
assert.equal(permanentAttempts, 1, 'non-transient failures must fail fast');

let timedOutAttempts = 0;
await assert.rejects(
  runResilientRead(async () => {
    timedOutAttempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 30));
    return 'too late';
  }, { maxAttempts: 2, timeoutMs: 5, baseDelayMs: 0 }),
  (error) => error?.code === 'READ_TIMEOUT',
);
assert.equal(timedOutAttempts, 2, 'read timeouts must get one safe retry');

const calls = {
  list: 0,
  create: 0,
  update: 0,
  remove: 0,
  clearAll: 0,
  me: 0,
  publicSettings: 0,
  upload: 0,
  ai: 0,
  email: 0,
};

const fakePlatform = {
  provider: 'test',
  progress: {
    async list() {
      calls.list += 1;
      if (calls.list === 1) {
        const error = new Error('network error');
        error.code = 'ERR_NETWORK';
        throw error;
      }
      return ['ok'];
    },
    async create(data) { calls.create += 1; throw Object.assign(new Error('write failed'), { status: 503, data }); },
    async update() { calls.update += 1; },
    async remove() { calls.remove += 1; },
    async clearAll() { calls.clearAll += 1; },
  },
  auth: {
    async me() { calls.me += 1; return { id: 'reader' }; },
    async logout() {},
    async redirectToLogin() {},
    async getPublicSettings() { calls.publicSettings += 1; return {}; },
    async hasAccessToken() { return true; },
    async signInWithPassword() {},
    async signUp() {},
    async requestPasswordReset() {},
  },
  storage: { async uploadFile() { calls.upload += 1; } },
  ai: { async invoke() { calls.ai += 1; } },
  email: { async send() { calls.email += 1; } },
};

const resilient = decoratePlatformWithReadResilience(fakePlatform, {
  maxAttempts: 2,
  timeoutMs: 100,
  baseDelayMs: 0,
});

assert.deepEqual(await resilient.progress.list(), ['ok']);
assert.equal(calls.list, 2, 'decorated progress.list must recover one transient read failure');

await assert.rejects(resilient.progress.create({ letter: 'A' }), /write failed/);
assert.equal(calls.create, 1, 'progress.create must never be auto-retried');
assert.equal(resilient.progress.update, fakePlatform.progress.update, 'progress.update must stay undecorated');
assert.equal(resilient.progress.remove, fakePlatform.progress.remove, 'progress.remove must stay undecorated');
assert.equal(resilient.storage.uploadFile, fakePlatform.storage.uploadFile, 'upload must stay undecorated');
assert.equal(resilient.ai.invoke, fakePlatform.ai.invoke, 'AI calls must stay undecorated');
assert.equal(resilient.email.send, fakePlatform.email.send, 'email sends must stay undecorated');

assert.deepEqual(readResiliencePolicy.retriedMethods, [
  'progress.list',
  'auth.me',
  'auth.getPublicSettings',
]);
assert.ok(readResiliencePolicy.nonRetriedSideEffects.includes('progress.create'));
assert.ok(readResiliencePolicy.nonRetriedSideEffects.includes('ai.invoke'));

console.log('Lexia M28-B Read Resilience: PASS (transient reads retry; auth/domain failures fail fast; writes never auto-retry)');
