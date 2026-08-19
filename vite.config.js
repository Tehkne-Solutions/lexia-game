import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const releaseSha = process.env.VITE_LEXIA_RELEASE_SHA
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || '';
const buildProvider = process.env.VITE_LEXIA_PLATFORM_PROVIDER || 'base44';
const e2eMemoryPlatform = process.env.LEXIA_E2E_MEMORY_PLATFORM === 'true';
const e2ePlatformPath = fileURLToPath(new URL('./scripts/fixtures/e2e-platform.js', import.meta.url));
const runtimePlatformPath = fileURLToPath(new URL('./src/platform/index.js', import.meta.url));

function e2ePlatformPlugin() {
  if (!e2eMemoryPlatform) return null;
  return {
    name: 'lexia-m28c-e2e-platform',
    enforce: 'pre',
    resolveId(source) {
      const normalized = String(source || '').replaceAll('\\', '/');
      const runtimeNormalized = runtimePlatformPath.replaceAll('\\', '/');
      if (
        source === '@/platform'
        || source === '@/platform/index.js'
        || normalized === runtimeNormalized
        || normalized.endsWith('/src/platform/index.js')
      ) {
        return e2ePlatformPath;
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  define: {
    'import.meta.env.VITE_LEXIA_RELEASE_SHA': JSON.stringify(releaseSha),
    'import.meta.env.VITE_LEXIA_BUILD_PROVIDER_MARKER': JSON.stringify(buildProvider),
  },
  plugins: [
    e2ePlatformPlugin(),
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ].filter(Boolean)
});