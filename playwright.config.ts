import { defineConfig, devices } from "@playwright/test";

// Use the same port as astro preview by default
const PORT = 4321;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `PUBLIC_SITE_URL=${BASE_URL} npm run build && PUBLIC_SITE_URL=${BASE_URL} astro preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
