import { base44Adapter } from '@/platform/adapters/base44Adapter';
import { assertPlatformContract, platformContract } from '@/platform/contracts';

const providers = {
  base44: base44Adapter,
};

// M01 intentionally keeps Base44 as the only active runtime provider.
// A provider switch will be introduced only when a second adapter is ready and validated.
const requestedProvider = 'base44';
const selectedProvider = providers[requestedProvider];

export const lexiaPlatform = assertPlatformContract(selectedProvider);
export const activePlatformProvider = lexiaPlatform.provider;
export { platformContract };

// Temporary compatibility export. Legacy modules can keep importing `base44`
// while their call sites are migrated to the provider-neutral contract.
export const base44Client = base44Adapter.raw;
