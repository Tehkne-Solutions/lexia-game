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

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  define: {
    'import.meta.env.VITE_LEXIA_RELEASE_SHA': JSON.stringify(releaseSha),
    'import.meta.env.VITE_LEXIA_BUILD_PROVIDER_MARKER': JSON.stringify(buildProvider),
  },
  resolve: {
    alias: e2eMemoryPlatform
      ? [{
        find: /^@\/platform$/,
        replacement: fileURLToPath(new URL('./scripts/fixtures/e2e-platform.js', import.meta.url)),
      }]
      : [],
  },
  plugins: [
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
  ]
});