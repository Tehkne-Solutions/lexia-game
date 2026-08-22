import { createSupabaseAdapter } from '@/platform/adapters/supabaseAdapter';
import { assertPlatformContract, platformContract } from '@/platform/contracts';
import { decorateProgressWithDailyChallenge } from '@/platform/decorators/dailyChallengeProgressDecorator';
import { decoratePlatformWithReadResilience } from '@/platform/decorators/readResilienceDecorator';
import { getSupabaseProviderConfig, resolvePlatformProvider } from '@/platform/providerConfig';

const supabaseAdapter = createSupabaseAdapter(getSupabaseProviderConfig(import.meta.env));
resolvePlatformProvider(import.meta.env);
if (!supabaseAdapter.readiness.ready) {
  throw new Error(`Supabase provider requested but not release-ready: ${supabaseAdapter.readiness.missing.join(', ')}`);
}

const resilientProvider = decoratePlatformWithReadResilience(supabaseAdapter);
const decoratedProvider = {
  ...resilientProvider,
  progress: decorateProgressWithDailyChallenge(resilientProvider.progress),
};

export const lexiaPlatform = assertPlatformContract(decoratedProvider);
export const activePlatformProvider = lexiaPlatform.provider;
export const platformReadiness = supabaseAdapter.readiness;
export { platformContract };
