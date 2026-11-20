import { defineConfig, devices } from '@playwright/test'
const port = 4187
export default defineConfig({
  testDir: 'tests/browser',
  timeout: 45000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:' + port + '/Clases-inacap/',
    ...devices['Pixel 7'],
    browserName: 'chromium',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port ' + port + ' --strictPort',
    url: 'http://127.0.0.1:' + port + '/Clases-inacap/',
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
  reporter: 'list',
})
