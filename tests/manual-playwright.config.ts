import { defineConfig } from "@playwright/test";

export default defineConfig({
  // testDir is relative to this config file's location (tests/ directory)
  testDir: ".",
  testMatch: "**/manual-user-test.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "manual-qa",
      use: {
        viewport: { width: 1280, height: 800 },
        browserName: "chromium",
      },
    },
  ],
  // Start the dev server if not already running
  webServer: {
    command: "npm run dev -- --port 5173 --host 127.0.0.1",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 90_000,
  },
});
