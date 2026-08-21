import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.NUXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:3007',
  },
  webServer: {
    command: 'pnpm.cmd dev',
    url: 'http://localhost:3007',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
