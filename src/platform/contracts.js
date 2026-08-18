export const LEXIA_PLATFORM_CONTRACT_VERSION = '1.1.0';

const REQUIRED_METHODS = [
  'progress.list',
  'progress.create',
  'progress.update',
  'progress.remove',
  'progress.clearAll',
  'auth.me',
  'auth.logout',
  'auth.redirectToLogin',
  'auth.getPublicSettings',
  'auth.hasAccessToken',
  'auth.signInWithPassword',
  'auth.signUp',
  'auth.requestPasswordReset',
  'storage.uploadFile',
  'ai.invoke',
  'email.send',
];

function getPath(target, path) {
  return path.split('.').reduce((value, key) => value?.[key], target);
}

export function assertPlatformContract(platform) {
  if (!platform || typeof platform !== 'object') {
    throw new Error('Lexia platform provider must be an object');
  }

  const missing = REQUIRED_METHODS.filter((path) => typeof getPath(platform, path) !== 'function');
  if (missing.length > 0) {
    throw new Error(`Lexia platform provider "${platform.provider || 'unknown'}" is missing: ${missing.join(', ')}`);
  }

  return platform;
}

export const platformContract = Object.freeze({
  version: LEXIA_PLATFORM_CONTRACT_VERSION,
  requiredMethods: [...REQUIRED_METHODS],
});
