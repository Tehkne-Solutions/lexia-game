import assert from 'node:assert/strict';

const requiredEnv = [
  'LEXIA_LIVE_SUPABASE_URL',
  'LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY',
  'LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY',
  'LEXIA_LIVE_TEST_EMAIL',
  'LEXIA_LIVE_TEST_PASSWORD',
];
const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`M09-D services smoke is fail-closed; missing secret environment: ${missing.join(', ')}`);
}

const baseUrl = process.env.LEXIA_LIVE_SUPABASE_URL.replace(/\/$/, '');
const publishableKey = process.env.LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY;
const baseEmail = process.env.LEXIA_LIVE_TEST_EMAIL.trim().toLowerCase();
const password = process.env.LEXIA_LIVE_TEST_PASSWORD;
const scope = String(process.env.LEXIA_LIVE_SERVICE_SCOPE || 'both').toLowerCase();
assert.ok(['ai', 'email', 'both'].includes(scope), 'LEXIA_LIVE_SERVICE_SCOPE must be ai, email or both');

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const at = baseEmail.lastIndexOf('@');
if (at <= 0) throw new Error('LEXIA_LIVE_TEST_EMAIL must be a valid e-mail address');
const email = `${baseEmail.slice(0, at)}+lexia-services-${runId}${baseEmail.slice(at)}`;

let userId = null;
const storagePaths = [];

function encodedStoragePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function api(path, { method = 'GET', key = publishableKey, token, json, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('apikey', key);
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
  if (json !== undefined) requestHeaders.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  return { response, payload };
}

async function requireOk(path, options, label) {
  const result = await api(path, options);
  if (!result.response.ok) {
    throw new Error(`${label} failed with HTTP ${result.response.status}: ${JSON.stringify(result.payload)}`);
  }
  return result.payload;
}

async function createConfirmedDisposableUser() {
  const payload = await requireOk('/auth/v1/admin/users', {
    method: 'POST',
    key: serviceRoleKey,
    token: serviceRoleKey,
    json: {
      email,
      password,
      email_confirm: true,
      user_metadata: { lexia_test: 'm09d-live-services-smoke', run_id: runId },
    },
  }, 'admin disposable user creation');
  assert.ok(payload?.id, 'admin user creation must return id');
  userId = payload.id;
}

async function signIn() {
  const payload = await requireOk('/auth/v1/token?grant_type=password', {
    method: 'POST',
    json: { email, password },
  }, 'service-smoke password sign-in');
  assert.ok(payload?.access_token, 'services smoke needs authenticated access token');
  return payload;
}

async function uploadDrawing(token) {
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'm09d-smoke.png');

  const response = await fetch(`${baseUrl}/functions/v1/lexia-upload`, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`services smoke upload failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }
  assert.equal(payload?.expires_in, 300);
  assert.ok(payload?.path?.startsWith(`${userId}/`));
  assert.ok(payload?.file_url);
  storagePaths.push(payload.path);
  return payload;
}

async function invokeAi(token, fileUrl) {
  const payload = await requireOk('/functions/v1/lexia-ai', {
    method: 'POST',
    token,
    json: {
      prompt: 'Evaluate this tiny test drawing for the uppercase letter I. Return only the requested structured evaluation.',
      file_urls: [fileUrl],
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          grade: { type: 'number' },
          feedback: { type: 'string' },
          recognized_as: { type: 'string' },
        },
      },
    },
  }, 'lexia-ai live upstream');

  assert.ok(Number.isFinite(Number(payload?.score)), 'AI must return numeric score');
  assert.ok(Number(payload.score) >= 0 && Number(payload.score) <= 100, 'AI score must be normalized to 0..100');
  assert.ok(Number.isInteger(payload?.grade) && payload.grade >= 1 && payload.grade <= 4, 'AI grade must be normalized to 1..4');
  assert.equal(typeof payload?.feedback, 'string');
  assert.equal(typeof payload?.recognized_as, 'string');
  return { score: payload.score, grade: payload.grade };
}

async function invokeEmail(token) {
  const blocked = await api('/functions/v1/lexia-email', {
    method: 'POST',
    token,
    json: {
      to: 'third-party@example.invalid',
      subject: 'Lexia M09-D forbidden recipient check',
      body: 'This message must never be relayed.',
    },
  });
  assert.equal(blocked.response.status, 403, 'authenticated user must not relay e-mail to another recipient');
  assert.equal(blocked.payload?.error, 'recipient_must_match_authenticated_user');

  const payload = await requireOk('/functions/v1/lexia-email', {
    method: 'POST',
    token,
    json: {
      to: email,
      subject: 'Lexia M09-D live service smoke',
      body: `Tehkné Solutions live services verification ${runId}`,
    },
  }, 'lexia-email live upstream');
  assert.equal(payload?.ok, true, 'parent e-mail upstream must acknowledge delivery request');
  return true;
}

async function cleanupStorage(path) {
  const result = await api(`/storage/v1/object/lexia-drawings/${encodedStoragePath(path)}`, {
    method: 'DELETE',
    key: serviceRoleKey,
    token: serviceRoleKey,
  });
  if (!result.response.ok && result.response.status !== 404) {
    throw new Error(`M09-D Storage cleanup failed HTTP ${result.response.status}`);
  }
}

async function cleanupUser() {
  if (!userId) return;
  const result = await api(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    key: serviceRoleKey,
    token: serviceRoleKey,
  });
  if (!result.response.ok && result.response.status !== 404) {
    throw new Error(`M09-D Auth cleanup failed HTTP ${result.response.status}`);
  }
}

try {
  await createConfirmedDisposableUser();
  const session = await signIn();
  const drawing = await uploadDrawing(session.access_token);

  let ai = 'skipped';
  let emailResult = 'skipped';
  if (scope === 'ai' || scope === 'both') ai = await invokeAi(session.access_token, drawing.file_url);
  if (scope === 'email' || scope === 'both') emailResult = await invokeEmail(session.access_token);

  console.log(JSON.stringify({
    gate: 'M09-D',
    status: 'PASS',
    scope,
    authenticated: true,
    privateUpload: true,
    ai,
    email: emailResult,
    secretsPrinted: false,
  }));
} finally {
  for (const path of [...storagePaths].reverse()) await cleanupStorage(path);
  await cleanupUser();
}
