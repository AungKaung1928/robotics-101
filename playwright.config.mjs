// Browser smoke matrix (e2e/smoke/smoke.pw.mjs) on the built site: three engines, desktop + phone + tablet emulation.
// CI only (.github/workflows/browsers.yml); locally `npm run build && npx playwright test` once Playwright and its browsers exist.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e/smoke',
  testMatch: '*.pw.mjs', // not *.spec.*: vitest would pick that up
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173/', trace: 'retain-on-failure' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: false },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'android-pixel', use: { ...devices['Pixel 7'] } }, // Chromium engine + touch + mobile viewport
    { name: 'iphone', use: { ...devices['iPhone 14'] } }, // WebKit engine + touch; not real iOS Safari
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
  ],
})
