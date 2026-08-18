import { getSupabaseReadiness } from '@/platform/providerConfig';

const SESSION_KEY = 'lexia_supabase_session';

function encodeFilterValue(value) {
  return encodeURIComponent(String(value));
}

function parseJsonSafely(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
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
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
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
      const error = new Error(payload?.message || payload?.error_description || payload?.error || `Supabase request failed (${response.status})`);
      error.status = response.status;
      error.data = payload;
      throw error;
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
    return request('/rest/v1/lexia_progress?select=*&order=letter.asc', {
      headers: { Accept: 'application/json' },
    }) || [];
  }

  async function progressCreate(data) {
    await ensureFreshSession();
    const rows = await request('/rest/v1/lexia_progress', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      json: data,
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function progressUpdate(id, data) {
    await ensureFreshSession();
    const rows = await request(`/rest/v1/lexia_progress?id=eq.${encodeFilterValue(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      json: data,
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function progressRemove(id) {
    await ensureFreshSession();
    return request(`/rest/v1/lexia_progress?id=eq.${encodeFilterValue(id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
  }

  async function progressClearAll() {
    const me = await authMe();
    if (!me?.id) return [];
    return request(`/rest/v1/lexia_progress?user_id=eq.${encodeFilterValue(me.id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
  }

  async function authMe() {
    await ensureFreshSession();
    try {
      return await request('/auth/v1/user');
    } catch (error) {
      if (error.status !== 401) throw error;
      const refreshed = await refreshSession();
      if (!refreshed) throw error;
      return request('/auth/v1/user');
    }
  }

  async function signInWithPassword({ email, password }) {
    const payload = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      accessToken: null,
      json: { email, password },
    });
    normalizeAndStoreSession(payload);
    return payload;
  }

  async function signUp({ email, password, data, redirectTo }) {
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
      if (accessToken && readiness.ready) {
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
      const error = new Error(payload?.message || payload?.error || `Supabase Edge Function failed (${response.status})`);
      error.status = response.status;
      error.data = payload;
      throw error;
    }
    return payload;
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append('file', file, file.name || 'drawing.png');
    return invokeEdgeFunction(config.uploadFunction, form, { formData: true });
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
      invoke: (payload) => invokeEdgeFunction(config.aiFunction, payload),
    },
    email: {
      send: (payload) => invokeEdgeFunction(config.emailFunction, payload),
    },
  };
}
