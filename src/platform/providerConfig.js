export function resolvePlatformProvider(env = {}) {
  const requested = String(env.VITE_LEXIA_PLATFORM_PROVIDER || 'base44').trim().toLowerCase();
  if (requested === 'base44' || requested === 'supabase') return requested;
  throw new Error(`Unsupported Lexia platform provider: ${requested}`);
}

export function getSupabaseProviderConfig(env = {}) {
  return {
    url: String(env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
    publishableKey: String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
    authReady: env.VITE_LEXIA_SUPABASE_AUTH_READY === 'true',
    edgeReady: env.VITE_LEXIA_SUPABASE_EDGE_READY === 'true',
    aiFunction: env.VITE_LEXIA_SUPABASE_AI_FUNCTION || 'lexia-ai',
    emailFunction: env.VITE_LEXIA_SUPABASE_EMAIL_FUNCTION || 'lexia-email',
    uploadFunction: env.VITE_LEXIA_SUPABASE_UPLOAD_FUNCTION || 'lexia-upload',
  };
}

export function getSupabaseReadiness(config) {
  const missing = [];
  if (!config?.url) missing.push('VITE_SUPABASE_URL');
  if (!config?.publishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  if (!config?.authReady) missing.push('VITE_LEXIA_SUPABASE_AUTH_READY=true');
  if (!config?.edgeReady) missing.push('VITE_LEXIA_SUPABASE_EDGE_READY=true');

  return {
    ready: missing.length === 0,
    missing,
  };
}
