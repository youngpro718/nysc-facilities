import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["html"], ["github"]]
    : [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // ── Public + agent tests on iPhone 13 (webkit) ───────────────────────────
    {
      name: "webkit-iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
      testIgnore: [
        "**/admin-auth.smoke.spec.ts",
        "**/agent-*.spec.ts",       // agents run on their own projects below
      ],
    },

    // ── Admin smoke tests — require storageState from global-setup ───────────
    {
      name: "webkit-iphone-admin",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
        storageState: "tests/e2e/.auth/admin.json",
      },
      testMatch: "**/admin-auth.smoke.spec.ts",
    },

    // ── Agent: Admin — iPhone 13 webkit ─────────────────────────────────────
    // Primary mobile view — reproduces the notch and alignment bugs on the
    // same device class the real users are on.
    {
      name: "agent-admin-iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
      testMatch: "**/agent-admin.spec.ts",
    },

    // ── Agent: CMC — iPhone 13 webkit ───────────────────────────────────────
    {
      name: "agent-cmc-iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
      testMatch: "**/agent-cmc.spec.ts",
    },

    // ── Agent: Court Aide — iPhone 13 webkit ────────────────────────────────
    {
      name: "agent-court-aide-iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
      testMatch: "**/agent-court-aide.spec.ts",
    },

    // ── Agent: Regular User — iPhone 13 webkit ──────────────────────────────
    {
      name: "agent-user-iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
      testMatch: "**/agent-user.spec.ts",
    },

    // ── Chromium desktop — all agent tests for side-by-side comparison ───────
    // Useful for debugging layout bugs: run the same tests on desktop to see
    // if issues are mobile-specific or universal.
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
      testMatch: [
        "**/agent-*.spec.ts",
        "**/public*.spec.ts",
        "**/public-forms*.spec.ts",
      ],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
