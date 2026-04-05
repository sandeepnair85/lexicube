import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180000,
  fullyParallel: true,
  workers: 4,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});
