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
  throw new Error(`M09 live smoke is fail-closed; missing secret environment: ${missing.join(', ')}`);
}

const baseUrl = process.env.LEXIA_LIVE_SUPABASE_URL.replace(/\/$/, '');
const publishableKey = process.env.LEXIA_LIVE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.LEXIA_LIVE_SUPABASE_SERVICE_ROLE_KEY;
const baseEmail = process.env.LEXIA_LIVE_TEST_EMAIL.trim().toLowerCase();
const password = process.env.LEXIA_LIVE_TEST_PASSWORD;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const users = [];
const storagePaths = [];

function taggedEmail(tag) {
  const at = baseEmail.lastIndexOf('@');
  if (at <= 0) throw new Error('LEXIA_LIVE_TEST_EMAIL must be a valid e-mail address');
  return `${baseEmail.slice(0, at)}+lexia-${tag}-${runId}${baseEmail.slice(at)}`;
}

function encodedStoragePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function request(path, { method = 'GET', key = publishableKey, token, json, headers = {} } = {}) {
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
  const result = await request(path, options);
  if (!result.response.ok) {
    throw new Error(`${label} failed with HTTP ${result.response.status}: ${JSON.stringify(result.payload)}`);
  }
  return result.payload;
}

async function adminDeleteUser(id) {
  if (!id) return;
  const { response } = await request(`/auth/v1/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    key: serviceRoleKey,
    token: serviceRoleKey,
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`cleanup failed for disposable Auth user ${id}: HTTP ${response.status}`);
  }
}

async function adminDeleteStorageObject(path) {
  if (!path) return;
  const { response } = await request(`/storage/v1/object/lexia-drawings/${encodedStoragePath(path)}`, {
    method: 'DELETE',
    key: serviceRoleKey,
    token: serviceRoleKey,
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`cleanup failed for disposable Storage object ${path}: HTTP ${response.status}`);
  }
}

async function adminConfirmUser(id) {
  await requireOk(`/auth/v1/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    key: serviceRoleKey,
    token: serviceRoleKey,
    json: { email_confirm: true },
  }, 'admin confirmation');
}

async function signUp(email, tag) {
  const payload = await requireOk('/auth/v1/signup', {
    method: 'POST',
    json: {
      email,
      password,
      data: { lexia_test: 'm09-live-smoke', run_id: runId, tag },
    },
  }, `GoTrue signup (${tag})`);

  const user = payload?.user || payload;
  assert.ok(user?.id, `${tag} signup must return a user id`);
  users.push(user.id);
  return { user, session: payload?.session || (payload?.access_token ? payload : null) };
}

async function signIn(email) {
  const payload = await requireOk('/auth/v1/token?grant_type=password', {
    method: 'POST',
    json: { email, password },
  }, 'password sign-in');
  assert.ok(payload?.access_token, 'password sign-in must return access_token');
  assert.ok(payload?.refresh_token, 'password sign-in must return refresh_token');
  return payload;
}

async function me(token) {
  const payload = await requireOk('/auth/v1/user', { token }, 'authenticated /user');
  assert.ok(payload?.id, '/user must return authenticated user id');
  return payload;
}

async function progressList(token) {
  const payload = await requireOk('/rest/v1/lexia_progress?select=*&order=letter.asc', {
    token,
    headers: { Accept: 'application/json' },
  }, 'progress list');
  assert.ok(Array.isArray(payload), 'progress list must return an array');
  return payload;
}

async function createProgress(token, letter) {
  const payload = await requireOk('/rest/v1/lexia_progress', {
    method: 'POST',
    token,
    headers: { Prefer: 'return=representation' },
    json: {
      child_name: 'M09 Smoke',
      letter,
      total_attempts: 1,
      correct_attempts: 1,
      stars_earned: 1,
      last_grade: 4,
      streak: 1,
    },
  }, `progress create ${letter}`);
  assert.ok(Array.isArray(payload) && payload[0]?.id, 'progress create must return representation');
  return payload[0];
}

async function patchProgress(token, id, stars) {
  return requireOk(`/rest/v1/lexia_progress?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'PATCH',
    token,
    headers: { Prefer: 'return=representation' },
    json: { stars_earned: stars },
  }, 'progress patch');
}

async function deleteProgress(token, id) {
  return requireOk(`/rest/v1/lexia_progress?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'DELETE',
    token,
    headers: { Prefer: 'return=representation' },
  }, 'progress delete');
}

async function refresh(refreshToken) {
  const payload = await requireOk('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    json: { refresh_token: refreshToken },
  }, 'token refresh');
  assert.ok(payload?.access_token, 'refresh must return a fresh access token');
  assert.ok(payload?.refresh_token, 'refresh must return a refresh token');
  return payload;
}

async function logout(accessToken) {
  await requireOk('/auth/v1/logout', { method: 'POST', token: accessToken }, 'logout');
}

async function optionalRecovery(email) {
  if (process.env.LEXIA_LIVE_TEST_RECOVERY !== 'true') return 'skipped';
  await requireOk('/auth/v1/recover', {
    method: 'POST',
    json: { email },
  }, 'password recovery');
  return 'requested';
}

async function uploadDrawing(accessToken, expectedUserId) {
  const unauthenticated = await fetch(`${baseUrl}/functions/v1/lexia-upload`, {
    method: 'POST',
    headers: { apikey: publishableKey },
    body: new FormData(),
  });
  assert.ok([401, 403].includes(unauthenticated.status), 'lexia-upload must reject missing user JWT');

  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'm09-smoke.png');

  const response = await fetch(`${baseUrl}/functions/v1/lexia-upload`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`authenticated lexia-upload failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  assert.equal(payload?.expires_in, 300, 'drawing signed URL must expire in 300 seconds');
  assert.ok(typeof payload?.path === 'string' && payload.path.startsWith(`${expectedUserId}/`), 'drawing path must be scoped under authenticated user id');
  assert.ok(typeof payload?.file_url === 'string' && payload.file_url.startsWith('http'), 'upload must return a signed URL');
  storagePaths.push(payload.path);

  const signedRead = await fetch(payload.file_url, { cache: 'no-store' });
  assert.equal(signedRead.status, 200, 'signed drawing URL must be readable without client credentials');
  const signedBytes = new Uint8Array(await signedRead.arrayBuffer());
  assert.ok(signedBytes.length > 0, 'signed drawing URL must return the uploaded bytes');

  return { path: payload.path, expiresIn: payload.expires_in };
}

const emailA = taggedEmail('a');
const emailB = taggedEmail('b');

try {
  const signupA = await signUp(emailA, 'a');
  const signupB = await signUp(emailB, 'b');

  if (!signupA.session?.access_token) await adminConfirmUser(signupA.user.id);
  if (!signupB.session?.access_token) await adminConfirmUser(signupB.user.id);

  let sessionA = signupA.session?.access_token ? signupA.session : await signIn(emailA);
  const sessionB = signupB.session?.access_token ? signupB.session : await signIn(emailB);

  const userA = await me(sessionA.access_token);
  const userB = await me(sessionB.access_token);
  assert.notEqual(userA.id, userB.id, 'disposable users must be isolated identities');

  assert.equal((await progressList(sessionA.access_token)).length, 0, 'fresh learner A must start with zero progress');
  assert.equal((await progressList(sessionB.access_token)).length, 0, 'fresh learner B must start with zero progress');

  const rowA = await createProgress(sessionA.access_token, 'M09_A');
  const rowB = await createProgress(sessionB.access_token, 'M09_B');
  assert.equal(rowA.user_id, userA.id, 'A row must be owned by authenticated A');
  assert.equal(rowB.user_id, userB.id, 'B row must be owned by authenticated B');

  const visibleA = await progressList(sessionA.access_token);
  assert.deepEqual(visibleA.map((row) => row.id), [rowA.id], 'A must see only A progress through real REST/JWT RLS');

  const crossPatch = await patchProgress(sessionA.access_token, rowB.id, 99);
  assert.deepEqual(crossPatch, [], 'A must not update B progress through REST/JWT RLS');
  const crossDelete = await deleteProgress(sessionA.access_token, rowB.id);
  assert.deepEqual(crossDelete, [], 'A must not delete B progress through REST/JWT RLS');

  const ownPatch = await patchProgress(sessionA.access_token, rowA.id, 2);
  assert.equal(ownPatch?.[0]?.stars_earned, 2, 'A must update own progress');
  const ownDelete = await deleteProgress(sessionA.access_token, rowA.id);
  assert.equal(ownDelete?.[0]?.id, rowA.id, 'A must delete own progress');

  const drawing = await uploadDrawing(sessionA.access_token, userA.id);
  assert.equal(drawing.expiresIn, 300);

  sessionA = await refresh(sessionA.refresh_token);
  assert.equal((await me(sessionA.access_token)).id, userA.id, 'refreshed session must retain learner identity');

  const recovery = await optionalRecovery(emailA);
  const refreshTokenAtLogout = sessionA.refresh_token;
  await logout(sessionA.access_token);

  const refreshAfterLogout = await request('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    json: { refresh_token: refreshTokenAtLogout },
  });
  assert.ok(
    [400, 401, 403].includes(refreshAfterLogout.response.status),
    'logout must revoke the session refresh token even though an issued access JWT can remain valid until expiry'
  );

  console.log(JSON.stringify({
    gate: 'M09-C',
    status: 'PASS',
    signup: true,
    signIn: true,
    freshStartZeroProgress: true,
    restCrud: true,
    realJwtRlsIsolation: true,
    privateUpload: true,
    signedUrlSeconds: drawing.expiresIn,
    refresh: true,
    logoutRefreshRevocation: true,
    recovery,
    secretsPrinted: false,
  }));
} finally {
  // Storage is not owned by auth FK, so remove objects before deleting disposable users.
  for (const path of [...storagePaths].reverse()) {
    await adminDeleteStorageObject(path);
  }
  // Auth deletion cascades any remaining progress rows.
  for (const id of [...users].reverse()) {
    await adminDeleteUser(id);
  }
}
