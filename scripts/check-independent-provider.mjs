import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getSupabaseProviderConfig, getSupabaseReadiness, resolvePlatformProvider } from '../src/platform/providerConfig.js';

assert.equal(resolvePlatformProvider({}), 'base44', 'Base44 must remain the safe default during M04');
assert.equal(resolvePlatformProvider({ VITE_LEXIA_PLATFORM_PROVIDER: 'supabase' }), 'supabase');
assert.throws(() => resolvePlatformProvider({ VITE_LEXIA_PLATFORM_PROVIDER: 'unknown' }));

const emptyConfig = getSupabaseProviderConfig({});
const emptyReadiness = getSupabaseReadiness(emptyConfig);
assert.equal(emptyReadiness.ready, false, 'Supabase must not activate without release configuration');
assert.ok(emptyReadiness.missing.includes('VITE_SUPABASE_URL'));
assert.ok(emptyReadiness.missing.includes('VITE_SUPABASE_PUBLISHABLE_KEY'));

const readyConfig = getSupabaseProviderConfig({
  VITE_SUPABASE_URL: 'https://example.supabase.co/',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  VITE_LEXIA_SUPABASE_AUTH_READY: 'true',
  VITE_LEXIA_SUPABASE_EDGE_READY: 'true',
});
assert.equal(readyConfig.url, 'https://example.supabase.co');
assert.equal(getSupabaseReadiness(readyConfig).ready, true);

const platformIndex = await readFile(new URL('../src/platform/index.js', import.meta.url), 'utf8');
assert.ok(platformIndex.includes("base44: base44Adapter"));
assert.ok(platformIndex.includes("supabase: supabaseAdapter"));
assert.ok(platformIndex.includes("requestedProvider === 'supabase'"));

const adapter = await readFile(new URL('../src/platform/adapters/supabaseAdapter.js', import.meta.url), 'utf8');
assert.ok(adapter.includes('/auth/v1/token?grant_type=password'));
assert.ok(adapter.includes('/auth/v1/signup'));
assert.ok(adapter.includes('/auth/v1/recover'));
assert.ok(adapter.includes('refresh_token'));

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.ok(app.includes("location.pathname === '/login'"));
assert.ok(app.includes("import Login from './pages/Login'"));

const login = await readFile(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
assert.ok(login.includes("activePlatformProvider !== 'supabase'"));
assert.ok(login.includes("parsed.origin !== window.location.origin"), 'login return URL must reject cross-origin redirects');

const migration = await readFile(new URL('../supabase/migrations/202608180001_lexia_progress.sql', import.meta.url), 'utf8');
assert.ok(migration.includes('enable row level security'));
assert.ok(migration.includes('auth.uid()'));
assert.ok(migration.includes('unique (user_id, letter)'));

console.log('Lexia independent provider M04-B contract: PASS (Supabase auth staged, Base44 default)');
