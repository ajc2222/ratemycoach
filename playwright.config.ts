import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end configuration.
 *
 * The suite runs against a production build with its own isolated data
 * directory (`.data-e2e`), so tests can assert on what was actually persisted
 * without touching development data.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      LOCAL_DB_DIR: ".data-e2e",
      ADMIN_USER: "e2e-operator",
      ADMIN_PASSWORD: "e2e-password-that-is-long-enough",
      EXPERIMENT_SALT: "e2e-fixed-salt",
      IP_HASH_SALT: "e2e-ip-salt",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NODE_ENV: "production",
    },
  },
});
