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

  function getAccessToken() {
    return readSession()?.access_token || null;
  }

  async function request(path, options = {}) {
    assertReady();
    const accessToken = getAccessToken();
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

  async function progressList() {
    return request('/rest/v1/lexia_progress?select=*&order=letter.asc', {
      headers: { Accept: 'application/json' },
    }) || [];
  }

  async function progressCreate(data) {
    const rows = await request('/rest/v1/lexia_progress', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      json: data,
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function progressUpdate(id, data) {
    const rows = await request(`/rest/v1/lexia_progress?id=eq.${encodeFilterValue(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      json: data,
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function progressRemove(id) {
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
    return request('/auth/v1/user');
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
