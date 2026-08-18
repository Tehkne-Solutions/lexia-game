import { base44Adapter } from '@/platform/adapters/base44Adapter';
import { assertPlatformContract, platformContract } from '@/platform/contracts';

const providers = {
  base44: base44Adapter,
};

// Base44 remains the active runtime provider until a second adapter is fully
// implemented and passes the same platform contract and release gates.
const requestedProvider = 'base44';
const selectedProvider = providers[requestedProvider];

export const lexiaPlatform = assertPlatformContract(selectedProvider);
export const activePlatformProvider = lexiaPlatform.provider;
export { platformContract };
