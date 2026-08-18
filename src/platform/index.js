import { base44Adapter } from '@/platform/adapters/base44Adapter';
import { createSupabaseAdapter } from '@/platform/adapters/supabaseAdapter';
import { assertPlatformContract, platformContract } from '@/platform/contracts';
import { getSupabaseProviderConfig, resolvePlatformProvider } from '@/platform/providerConfig';

const supabaseAdapter = createSupabaseAdapter(getSupabaseProviderConfig(import.meta.env));
const providers = {
  base44: base44Adapter,
  supabase: supabaseAdapter,
};

const requestedProvider = resolvePlatformProvider(import.meta.env);
const selectedProvider = providers[requestedProvider];

if (requestedProvider === 'supabase' && !supabaseAdapter.readiness.ready) {
  throw new Error(`Supabase provider requested but not release-ready: ${supabaseAdapter.readiness.missing.join(', ')}`);
}

export const lexiaPlatform = assertPlatformContract(selectedProvider);
export const activePlatformProvider = lexiaPlatform.provider;
export const platformReadiness = selectedProvider.readiness || { ready: true, missing: [] };
export { platformContract };
