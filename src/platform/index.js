import { base44Adapter } from '@/platform/adapters/base44Adapter';
import { assertPlatformContract, platformContract } from '@/platform/contracts';

const providers = {
  base44: base44Adapter,
};

const requestedProvider = import.meta.env.VITE_LEXIA_PLATFORM_PROVIDER || 'base44';
const selectedProvider = providers[requestedProvider];

if (!selectedProvider) {
  console.warn(
    `[Lexia] Unknown platform provider "${requestedProvider}". Falling back to Base44 until another adapter is configured.`
  );
}

export const lexiaPlatform = assertPlatformContract(selectedProvider || base44Adapter);
export const activePlatformProvider = lexiaPlatform.provider;
export { platformContract };

// Temporary compatibility export. Legacy modules can keep importing `base44`
// while their call sites are migrated to the provider-neutral contract.
export const base44Client = base44Adapter.raw;
