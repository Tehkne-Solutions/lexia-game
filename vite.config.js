import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const releaseSha = process.env.VITE_LEXIA_RELEASE_SHA
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || '';
const buildProvider = process.env.VITE_LEXIA_PLATFORM_PROVIDER || 'supabase';

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_LEXIA_RELEASE_SHA': JSON.stringify(releaseSha),
    'import.meta.env.VITE_LEXIA_BUILD_PROVIDER_MARKER': JSON.stringify(buildProvider),
  },
  plugins: [react()]
});