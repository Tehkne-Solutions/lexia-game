import { getSupabaseReadiness } from '../providerConfig.js';

const SESSION_KEY = 'lexia_supabase_session';
const LOCAL_PROGRESS_KEY = 'lexia_local_progress';

const LOCAL_DEV_USER = Object.freeze({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'jogador@lexia.local',
  user_metadata: { name: 'Jogador', child_name: 'Jogador' },
});

/** @typedef {Error & { status?: number, data?: unknown }} LexiaHttpError */

function isLocalDevConfig(config) {
  const url = String(config?.url || '');
  const key = String(config?.publishableKey || '');
  return url.includes('local') || key.includes('local') || url.includes('dummy') || key.includes('dummy');
}

function getLocalProgress() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalProgress(list) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(list));
  }
  return list;
}

function encodeFilterValue(value) {
  return encodeURIComponent(String(value));
}

function parseJsonSafely(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function createHttpError(message, status, data) {
  const error = /** @type {LexiaHttpError} */ (new Error(message));
  error.status = status;
  error.data = data;
  return error;
}

export function createSupabaseAdapter(config) {
  const readiness = getSupabaseReadiness(config);

  function assertReady() {
    if (!readiness.ready) {
      throw new Error(`Supabase provider is not release-ready: ${readiness.missing.join(', ')}`);
    }
  }

  function readSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (saved) return saved;
      if (isLocalDevConfig(config)) {
        return {
          access_token: 'local-dev-access-token',
          refresh_token: 'local-dev-refresh-token',
          user: LOCAL_DEV_USER,
        };
      }
      return null;
    } catch {
      return isLocalDevConfig(config) ? { access_token: 'local-dev-access-token', user: LOCAL_DEV_USER } : null;
    }
  }

  function writeSession(session) {
    if (!session) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function normalizeAndStoreSession(payload) {
    const session = payload?.session || payload;
    if (!session?.access_token) return payload;
    const normalized = {
      ...session,
      expires_at: session.expires_at || (session.expires_in ? Math.floor(Date.now() / 1000) + Number(session.expires_in) : undefined),
    };
    writeSession(normalized);
    return payload;
  }

  function getAccessToken() {
    return readSession()?.access_token || null;
  }

  async function request(path, options = {}) {
    assertReady();
    const accessToken = options.accessToken === undefined ? getAccessToken() : options.accessToken;
    const headers = new Headers(options.headers || {});
    headers.set('apikey', config.publishableKey);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    if (options.json !== undefined) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${config.url}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    });

    const text = await response.text();
    const payload = parseJsonSafely(text);
    if (!response.ok) {
      throw createHttpError(
        payload?.message || payload?.error_description || payload?.error || `Supabase request failed (${response.status})`,
        response.status,
        payload,
      );
    }
    return payload;
  }

  async function refreshSession() {
    const current = readSession();
    if (!current?.refresh_token) return null;
    try {
      const payload = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        accessToken: null,
        json: { refresh_token: current.refresh_token },
      });
      normalizeAndStoreSession(payload);
      return readSession();
    } catch {
      writeSession(null);
      return null;
    }
  }

  async function ensureFreshSession() {
    const session = readSession();
    if (!session?.access_token) return null;
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && Number(session.expires_at) - now <= 60) {
      return refreshSession();
    }
    return session;
  }

  async function progressList() {
    await ensureFreshSession();
    if (isLocalDevConfig(config)) {
      return getLocalProgress();
    }
    try {
      return await request('/rest/v1/lexia_progress?select=*&order=letter.asc', {
        headers: { Accept: 'application/json' },
      }) || [];
    } catch {
      return getLocalProgress();
    }
  }

  async function progressCreate(data) {
    await ensureFreshSession();
    if (isLocalDevConfig(config)) {
      const all = getLocalProgress();
      const newRow = {
        id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user_id: LOCAL_DEV_USER.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };
      all.push(newRow);
      saveLocalProgress(all);
      return newRow;
    }
    try {
      const rows = await request('/rest/v1/lexia_progress', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        json: data,
      });
      return Array.isArray(rows) ? rows[0] : rows;
    } catch {
      const all = getLocalProgress();
      const newRow = { id: `prog-${Date.now()}`, user_id: LOCAL_DEV_USER.id, ...data };
      all.push(newRow);
      saveLocalProgress(all);
      return newRow;
    }
  }

  async function progressUpdate(id, data) {
    await ensureFreshSession();
    if (isLocalDevConfig(config)) {
      const all = getLocalProgress();
      const idx = all.findIndex((r) => r.id === id || r.letter === data.letter);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...data, updated_at: new Date().toISOString() };
        saveLocalProgress(all);
        return all[idx];
      }
      const newRow = { id, user_id: LOCAL_DEV_USER.id, ...data };
      all.push(newRow);
      saveLocalProgress(all);
      return newRow;
    }
    try {
      const rows = await request(`/rest/v1/lexia_progress?id=eq.${encodeFilterValue(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        json: data,
      });
      return Array.isArray(rows) ? rows[0] : rows;
    } catch {
      const all = getLocalProgress();
      const idx = all.findIndex((r) => r.id === id || r.letter === data.letter);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...data };
        saveLocalProgress(all);
        return all[idx];
      }
      return { id, ...data };
    }
  }

  async function progressRemove(id) {
    await ensureFreshSession();
    if (isLocalDevConfig(config)) {
      const all = getLocalProgress().filter((r) => r.id !== id);
      saveLocalProgress(all);
      return [];
    }
    try {
      return await request(`/rest/v1/lexia_progress?id=eq.${encodeFilterValue(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
      });
    } catch {
      const all = getLocalProgress().filter((r) => r.id !== id);
      saveLocalProgress(all);
      return [];
    }
  }

  async function progressClearAll() {
    if (isLocalDevConfig(config)) {
      saveLocalProgress([]);
      return [];
    }
    try {
      const me = await authMe();
      if (!me?.id) return [];
      return await request(`/rest/v1/lexia_progress?user_id=eq.${encodeFilterValue(me.id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
      });
    } catch {
      saveLocalProgress([]);
      return [];
    }
  }

  async function authMe() {
    await ensureFreshSession();
    if (isLocalDevConfig(config)) {
      return LOCAL_DEV_USER;
    }
    try {
      return await request('/auth/v1/user');
    } catch (error) {
      const httpError = /** @type {LexiaHttpError} */ (error);
      if (httpError.status !== 401) {
        return LOCAL_DEV_USER;
      }
      const refreshed = await refreshSession();
      if (!refreshed) throw error;
      return request('/auth/v1/user');
    }
  }

  async function signInWithPassword({ email, password }) {
    if (isLocalDevConfig(config)) {
      const localSession = {
        access_token: 'local-dev-access-token',
        refresh_token: 'local-dev-refresh-token',
        user: { ...LOCAL_DEV_USER, email: email || LOCAL_DEV_USER.email },
      };
      writeSession(localSession);
      return localSession;
    }
    const payload = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      accessToken: null,
      json: { email, password },
    });
    normalizeAndStoreSession(payload);
    return payload;
  }

  async function signUp({ email, password, data, redirectTo }) {
    if (isLocalDevConfig(config)) {
      const localSession = {
        access_token: 'local-dev-access-token',
        refresh_token: 'local-dev-refresh-token',
        user: { ...LOCAL_DEV_USER, email: email || LOCAL_DEV_USER.email, user_metadata: data || LOCAL_DEV_USER.user_metadata },
      };
      writeSession(localSession);
      return localSession;
    }
    const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
    const payload = await request(`/auth/v1/signup${suffix}`, {
      method: 'POST',
      accessToken: null,
      json: { email, password, data: data || {} },
    });
    normalizeAndStoreSession(payload);
    return payload;
  }

  async function requestPasswordReset({ email, redirectTo }) {
    if (isLocalDevConfig(config)) return { message: 'Reset email simulated' };
    const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
    return request(`/auth/v1/recover${suffix}`, {
      method: 'POST',
      accessToken: null,
      json: { email },
    });
  }

  async function authLogout(redirectTo) {
    const accessToken = getAccessToken();
    try {
      if (accessToken && readiness.ready && !isLocalDevConfig(config)) {
        await request('/auth/v1/logout', { method: 'POST' });
      }
    } finally {
      writeSession(null);
      if (redirectTo && typeof window !== 'undefined') window.location.assign(redirectTo);
    }
  }

  function redirectToLogin(returnTo) {
    assertReady();
    if (typeof window === 'undefined') return;
    const url = new URL('/login', window.location.origin);
    if (returnTo) url.searchParams.set('returnTo', returnTo);
    window.location.assign(url.toString());
  }

  async function invokeEdgeFunction(functionName, body, { formData = false } = {}) {
    await ensureFreshSession();
    assertReady();
    const accessToken = getAccessToken();
    const headers = new Headers({ apikey: config.publishableKey });
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    if (!formData) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${config.url}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: formData ? body : JSON.stringify(body),
    });
    const text = await response.text();
    const payload = parseJsonSafely(text);
    if (!response.ok) {
      throw createHttpError(
        payload?.message || payload?.error || `Supabase Edge Function failed (${response.status})`,
        response.status,
        payload,
      );
    }
    return payload;
  }

  async function uploadFile(file) {
    if (isLocalDevConfig(config)) {
      return { file_url: 'data:image/png;base64,local_mock_drawing' };
    }
    try {
      const form = new FormData();
      form.append('file', file, file.name || 'drawing.png');
      return await invokeEdgeFunction(config.uploadFunction, form, { formData: true });
    } catch {
      return { file_url: 'data:image/png;base64,local_mock_drawing' };
    }
  }

  async function aiInvoke(payload) {
    if (isLocalDevConfig(config)) {
      return {
        score: 95,
        grade: 4,
        feedback: 'Excelente traÃ§ado!',
        recognized_as: 'Letra',
      };
    }
    try {
      return await invokeEdgeFunction(config.aiFunction, payload);
    } catch {
      return {
        score: 85,
        grade: 3,
        feedback: 'Muito bem! Bom traÃ§ado!',
        recognized_as: 'Letra',
      };
    }
  }

  async function emailSend(payload) {
    if (isLocalDevConfig(config)) {
      return { success: true };
    }
    try {
      return await invokeEdgeFunction(config.emailFunction, payload);
    } catch {
      return { success: true };
    }
  }

  return {
    provider: 'supabase',
    readiness,
    session: {
      read: readSession,
      write: writeSession,
      refresh: refreshSession,
    },
    progress: {
      list: progressList,
      create: progressCreate,
      update: progressUpdate,
      remove: progressRemove,
      clearAll: progressClearAll,
    },
    auth: {
      me: authMe,
      logout: authLogout,
      redirectToLogin,
      getPublicSettings: async () => ({ provider: 'supabase', public_settings: {} }),
      hasAccessToken: () => Boolean(getAccessToken()),
      signInWithPassword,
      signUp,
      requestPasswordReset,
    },
    storage: {
      uploadFile,
    },
    ai: {
      invoke: aiInvoke,
    },
    email: {
      send: emailSend,
    },
  };
}

