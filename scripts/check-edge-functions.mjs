import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const upload = await readFile(new URL('../supabase/functions/lexia-upload/index.ts', import.meta.url), 'utf8');
const ai = await readFile(new URL('../supabase/functions/lexia-ai/index.ts', import.meta.url), 'utf8');
const email = await readFile(new URL('../supabase/functions/lexia-email/index.ts', import.meta.url), 'utf8');
const config = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');
const bucket = await readFile(new URL('../supabase/migrations/202608180002_lexia_drawings_bucket.sql', import.meta.url), 'utf8');

for (const [name, source] of [['upload', upload], ['ai', ai], ['email', email]]) {
  assert.ok(source.includes("withSupabase({ auth: 'user' }"), `${name} must require an authenticated user`);
  assert.ok(!source.includes('sb_secret_'), `${name} must not contain a Supabase secret key literal`);
  assert.ok(!source.includes('service_role='), `${name} must not contain a service role literal`);
}

assert.ok(upload.includes('MAX_BYTES = 2 * 1024 * 1024'));
assert.ok(upload.includes("createSignedUrl(path, 300)"));
assert.ok(ai.includes('LEXIA_AI_UPSTREAM_URL'));
assert.ok(ai.includes('invalid_ai_response'));
assert.ok(email.includes('recipient_must_match_authenticated_user'));
assert.ok(email.includes('LEXIA_EMAIL_UPSTREAM_URL'));
assert.ok(bucket.includes("'lexia-drawings'"));
assert.ok(bucket.includes('false'));

for (const functionName of ['lexia-upload', 'lexia-ai', 'lexia-email']) {
  assert.ok(config.includes(`[functions.${functionName}]`));
  assert.ok(config.includes('verify_jwt = true'));
}

console.log('Lexia Edge Functions M04-C contract: PASS (authenticated, private upload, constrained upstreams)');
