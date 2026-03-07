/**
 * Playwright config for manual admin QA tests.
 * Targets the already-running dev server at localhost:5173.
 * Uses Chromium desktop (not mobile WebKit) so admin UI is fully visible.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/manual-admin-test.spec.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-admin" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Desktop viewport so admin tables / charts are not clipped
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // App is already running — do not spawn a web server
  webServer: undefined,
});
