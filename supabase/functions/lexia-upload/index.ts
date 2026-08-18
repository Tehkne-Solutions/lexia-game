import { withSupabase } from 'npm:@supabase/server';

const BUCKET = 'lexia-drawings';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function extensionFor(type: string) {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/webp') return 'webp';
  return 'png';
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const userId = ctx.userClaims?.sub || ctx.userClaims?.id;
    if (!userId) return json({ error: 'authenticated_user_required' }, 401);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: 'file_required' }, 400);
    if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'unsupported_file_type' }, 415);
    if (file.size <= 0 || file.size > MAX_BYTES) return json({ error: 'invalid_file_size' }, 413);

    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extensionFor(file.type)}`;
    const { error: uploadError } = await ctx.supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: '300',
        upsert: false,
      });

    if (uploadError) {
      console.error('Lexia upload failed', uploadError.message);
      return json({ error: 'upload_failed' }, 502);
    }

    const { data: signed, error: signedError } = await ctx.supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, 300);

    if (signedError || !signed?.signedUrl) {
      console.error('Lexia signed URL failed', signedError?.message);
      await ctx.supabaseAdmin.storage.from(BUCKET).remove([path]);
      return json({ error: 'signed_url_failed' }, 502);
    }

    return json({
      file_url: signed.signedUrl,
      path,
      expires_in: 300,
    });
  }),
};
