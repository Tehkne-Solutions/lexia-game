import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5178',
    headless: true,
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5178',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VITE_AUTH_PROVIDER: 'supabase',
    },
  },
});