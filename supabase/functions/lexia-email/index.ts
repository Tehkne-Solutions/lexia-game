import { withSupabase } from 'npm:@supabase/server';

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const upstreamUrl = Deno.env.get('LEXIA_EMAIL_UPSTREAM_URL');
    const upstreamKey = Deno.env.get('LEXIA_EMAIL_UPSTREAM_KEY');
    if (!upstreamUrl) return json({ error: 'email_upstream_not_configured' }, 503);

    const authenticatedEmail = ctx.userClaims?.email;
    if (!authenticatedEmail) return json({ error: 'authenticated_email_required' }, 400);

    const payload = await req.json().catch(() => null);
    const subject = typeof payload?.subject === 'string' ? payload.subject.trim().slice(0, 200) : '';
    const body = typeof payload?.body === 'string' ? payload.body.trim().slice(0, 20000) : '';
    const requestedTo = typeof payload?.to === 'string' ? payload.to.trim().toLowerCase() : authenticatedEmail.toLowerCase();

    if (!subject || !body) return json({ error: 'subject_and_body_required' }, 400);
    if (requestedTo !== authenticatedEmail.toLowerCase()) {
      return json({ error: 'recipient_must_match_authenticated_user' }, 403);
    }

    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (upstreamKey) headers.set('Authorization', `Bearer ${upstreamKey}`);

    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: authenticatedEmail,
        subject,
        body,
      }),
    });

    if (!response.ok) {
      console.error('Lexia email upstream failed', response.status);
      return json({ error: 'email_upstream_failed' }, 502);
    }

    return json({ ok: true });
  }),
};
