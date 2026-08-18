import { withSupabase } from 'npm:@supabase/server';

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function isEvaluationResult(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return Number.isFinite(Number(result.score)) &&
    Number.isFinite(Number(result.grade)) &&
    typeof result.feedback === 'string' &&
    typeof result.recognized_as === 'string';
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const upstreamUrl = Deno.env.get('LEXIA_AI_UPSTREAM_URL');
    const upstreamKey = Deno.env.get('LEXIA_AI_UPSTREAM_KEY');
    if (!upstreamUrl) return json({ error: 'ai_upstream_not_configured' }, 503);

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload.prompt !== 'string' || payload.prompt.length > 12000) {
      return json({ error: 'invalid_ai_request' }, 400);
    }
    if (!Array.isArray(payload.file_urls) || payload.file_urls.length !== 1) {
      return json({ error: 'one_drawing_url_required' }, 400);
    }

    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (upstreamKey) headers.set('Authorization', `Bearer ${upstreamKey}`);

    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let result: unknown;
    try { result = JSON.parse(text); } catch { result = null; }

    if (!response.ok) {
      console.error('Lexia AI upstream failed', response.status);
      return json({ error: 'ai_upstream_failed' }, 502);
    }
    if (!isEvaluationResult(result)) {
      return json({ error: 'invalid_ai_response' }, 502);
    }

    const normalized = result as Record<string, unknown>;
    return json({
      score: Math.max(0, Math.min(100, Number(normalized.score))),
      grade: Math.max(1, Math.min(4, Math.round(Number(normalized.grade)))),
      feedback: String(normalized.feedback).slice(0, 160),
      recognized_as: String(normalized.recognized_as).slice(0, 32),
    });
  }),
};
