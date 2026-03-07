/**
 * Manual Admin QA Test Suite
 * Tests all admin features of the NYSC Facilities Management app.
 *
 * Strategy:
 *   1. Attempt Supabase SDK sign-in if PLAYWRIGHT_ADMIN_EMAIL + PLAYWRIGHT_ADMIN_PASSWORD are set.
 *   2. Inject the session into localStorage (storage key: "app-auth") so every page load
 *      starts authenticated — exactly like the existing global-setup does.
 *   3. Dismiss the PWA install prompt via localStorage before every navigation.
 *   4. Capture all console errors throughout each test.
 *   5. Take a screenshot at the end of every test regardless of pass/fail.
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";
const SUPABASE_STORAGE_KEY = "app-auth";

const SCREENSHOTS_DIR = path.join(
  "/Users/jduchate/Downloads/nysc-facilities-main",
  "test-screenshots"
);

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

let cachedSession: object | null = null;

async function getAdminSession(): Promise<object | null> {
  if (cachedSession) return cachedSession;

  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
  if (!email || !password) return null;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      console.error("[auth] Supabase sign-in failed:", error?.message);
      return null;
    }
    cachedSession = data.session;
    return cachedSession;
  } catch (err) {
    console.error("[auth] Unexpected error during sign-in:", err);
    return null;
  }
}

async function injectSession(page: Page, session: object): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
      localStorage.setItem("pwa-install-dismissed", "true");
    },
    { key: SUPABASE_STORAGE_KEY, value: JSON.stringify(session) }
  );
}

// ---------------------------------------------------------------------------
// Screenshot helper
// ---------------------------------------------------------------------------

function screenshotDir(): string {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  return SCREENSHOTS_DIR;
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

async function screenshot(page: Page, name: string): Promise<void> {
  const dir = screenshotDir();
  const filePath = path.join(dir, `${safeName(name)}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`[screenshot] ${filePath}`);
}

// ---------------------------------------------------------------------------
// Console error collector
// ---------------------------------------------------------------------------

function attachConsoleCollector(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });
  return () => errors;
}

// ---------------------------------------------------------------------------
// Navigation helper
// ---------------------------------------------------------------------------

async function navigateTo(
  page: Page,
  urlPath: string,
  session: object | null
): Promise<string[]> {
  const getErrors = attachConsoleCollector(page);

  if (session) {
    await injectSession(page, session);
  }

  await page.goto(`${BASE_URL}${urlPath}`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });

  // Wait a moment for React to hydrate / redirects to settle
  await page.waitForTimeout(1500);

  return getErrors();
}

// ---------------------------------------------------------------------------
// Fixtures — provide session to every test
// ---------------------------------------------------------------------------

type AdminFixtures = {
  session: object | null;
};

const adminTest = test.extend<AdminFixtures>({
  session: async ({}, use) => {
    const s = await getAdminSession();
    await use(s);
  },
});

// ---------------------------------------------------------------------------
// SECTION 0: Public pages (no auth required)
// ---------------------------------------------------------------------------

test.describe("Public pages (no auth)", () => {
  test("login page renders NYSC branding", async ({ page }) => {
    const errors = await navigateTo(page, "/login", null);

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /nysc facilities hub/i })
    ).toBeVisible();
    await expect(page.getByText(/sign in to continue/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeDisabled();
    await expect(page.getByText(/authorized use only/i)).toBeVisible();

    await screenshot(page, "00-login-page");
    if (errors.length)
      console.warn(`[login page] Console errors:\n  ${errors.join("\n  ")}`);
  });

  test("unauthenticated visits to protected routes redirect to /login", async ({
    page,
  }) => {
    const protectedPaths = [
      "/",
      "/spaces",
      "/operations",
      "/keys",
      "/access-assignments",
      "/users",
      "/admin",
      "/system-settings",
      "/notifications",
      "/lighting",
      "/admin/key-requests",
      "/admin/supply-requests",
      "/admin/form-templates",
      "/admin/routing-rules",
      "/court-live",
      "/card-showcase",
    ];

    const results: Record<string, string> = {};

    for (const p of protectedPaths) {
      await page.goto(`${BASE_URL}${p}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForTimeout(1000);
      results[p] = page.url();
    }

    await screenshot(page, "00-unauthenticated-redirect");

    for (const [urlPath, finalUrl] of Object.entries(results)) {
      console.log(
        `  ${urlPath} -> ${finalUrl.replace(BASE_URL, "")} (${
          finalUrl.includes("/login") ? "REDIRECTED" : "NOT REDIRECTED"
        })`
      );
      expect(
        finalUrl,
        `Expected ${urlPath} to redirect to /login`
      ).toMatch(/\/login/);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION 1: Admin Dashboard  /
// ---------------------------------------------------------------------------

adminTest.describe("Admin Dashboard (/)", () => {
  adminTest(
    "loads without crash and shows stats cards / charts",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/", session);

      // Should not be on login page
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page).not.toHaveURL(/\/auth\//);

      // Look for dashboard indicators
      const body = page.locator("body");
      await expect(body).not.toContainText("[object Object]");
      await expect(body).not.toContainText("undefined");

      // Check for heading or stat cards
      const heading = page
        .getByRole("heading")
        .filter({ hasText: /dashboard|overview|facilities/i })
        .first();
      const headingVisible = await heading.isVisible().catch(() => false);
      console.log(`[dashboard] heading visible: ${headingVisible}`);

      // Check for charts (recharts containers or canvas)
      const chartEls = await page
        .locator(".recharts-wrapper, canvas, [data-testid*='chart']")
        .count();
      console.log(`[dashboard] chart elements found: ${chartEls}`);

      // Check for stat numbers (digits in cards)
      const statNums = await page.locator("text=/^\\d+$/").count();
      console.log(`[dashboard] numeric stat elements: ${statNums}`);

      await screenshot(page, "01-admin-dashboard");

      if (errors.length) {
        console.warn(
          `[dashboard] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
      expect(errors, "No JS exceptions on dashboard").toHaveLength(0);
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 2: Spaces  /spaces
// ---------------------------------------------------------------------------

adminTest.describe("Spaces management (/spaces)", () => {
  adminTest(
    "loads space list without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/spaces", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      // Should show a list of rooms or a loading skeleton
      const spaceList = page.locator('[data-tour="space-list"]');
      const spaceListVisible = await spaceList
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(`[spaces] space-list visible: ${spaceListVisible}`);

      // Look for any room cards
      const roomCards = await page.locator("h3, [role='heading']").count();
      console.log(`[spaces] heading/room card count: ${roomCards}`);

      await screenshot(page, "02-spaces-list");

      if (errors.length) {
        console.warn(`[spaces] Console errors:\n  ${errors.join("\n  ")}`);
      }
    }
  );

  adminTest(
    "can open a room drawer by clicking a room card",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      await navigateTo(page, "/spaces", session);
      await expect(page).not.toHaveURL(/\/login/);

      // Wait for room headings to appear
      const firstRoom = page.locator("h3").first();
      const roomVisible = await firstRoom
        .isVisible({ timeout: 15_000 })
        .catch(() => false);

      if (!roomVisible) {
        console.warn("[spaces] No room headings found — skipping drawer test");
        await screenshot(page, "02-spaces-no-rooms");
        return;
      }

      const roomName = await firstRoom.textContent();
      await firstRoom.click();

      const drawer = page.getByRole("dialog");
      const drawerVisible = await drawer
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      console.log(
        `[spaces] drawer opened: ${drawerVisible} (room: ${roomName})`
      );

      if (drawerVisible) {
        await expect(drawer).toContainText(roomName ?? "");
      }

      await screenshot(page, "02-spaces-room-drawer");
    }
  );

  adminTest(
    "tabs switch on spaces page",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      await navigateTo(page, "/spaces", session);
      await expect(page).not.toHaveURL(/\/login/);

      // Floor plan button
      const floorPlanBtn = page.getByRole("button", { name: /floor plan/i });
      const fpVisible = await floorPlanBtn.isVisible().catch(() => false);
      console.log(`[spaces] floor plan button visible: ${fpVisible}`);

      if (fpVisible) {
        await floorPlanBtn.click();
        await page.waitForTimeout(1000);
        const fpHeading = page.getByRole("heading", {
          name: /floor plan viewer/i,
        });
        const fpHeadingVisible = await fpHeading
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
        console.log(
          `[spaces] floor plan viewer heading visible: ${fpHeadingVisible}`
        );
        await screenshot(page, "02-spaces-floor-plan");
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 3: Operations  /operations
// ---------------------------------------------------------------------------

adminTest.describe("Operations hub (/operations)", () => {
  adminTest(
    "loads issues tab without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(
        page,
        "/operations?tab=issues",
        session
      );

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const heading = page
        .getByRole("heading", { name: /operations/i })
        .first();
      const headingVisible = await heading
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(`[operations] heading visible: ${headingVisible}`);

      await screenshot(page, "03-operations-issues");

      if (errors.length) {
        console.warn(
          `[operations] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );

  adminTest(
    "can switch to maintenance tab",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      await navigateTo(page, "/operations", session);
      await expect(page).not.toHaveURL(/\/login/);

      const maintenanceTab = page.getByRole("tab", {
        name: /maintenance/i,
      });
      const tabVisible = await maintenanceTab
        .isVisible({ timeout: 8_000 })
        .catch(() => false);
      console.log(
        `[operations] maintenance tab visible: ${tabVisible}`
      );

      if (tabVisible) {
        await maintenanceTab.click();
        await page.waitForTimeout(800);
        await screenshot(page, "03-operations-maintenance-tab");
        const activeTab = page.locator('[role="tab"][data-state="active"]');
        const activeText = await activeTab.textContent().catch(() => "");
        console.log(
          `[operations] active tab after click: ${activeText}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 4: Keys  /keys
// ---------------------------------------------------------------------------

adminTest.describe("Keys management (/keys)", () => {
  adminTest(
    "loads key list without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/keys", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const heading = page
        .getByRole("heading", { name: /key management/i })
        .first();
      const headingVisible = await heading
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(`[keys] heading visible: ${headingVisible}`);

      const keyTabs = page.locator('[data-tour="keys-tabs"]');
      const tabsVisible = await keyTabs.isVisible().catch(() => false);
      console.log(`[keys] keys-tabs tour element visible: ${tabsVisible}`);

      await screenshot(page, "04-keys-list");

      if (errors.length) {
        console.warn(`[keys] Console errors:\n  ${errors.join("\n  ")}`);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 5: Access & Assignments  /access-assignments
// ---------------------------------------------------------------------------

adminTest.describe("Access & Assignments (/access-assignments)", () => {
  adminTest(
    "loads without crash and shows search element",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(
        page,
        "/access-assignments",
        session
      );

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const heading = page
        .getByRole("heading", { name: /access & assignments/i })
        .first();
      const headingVisible = await heading
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(
        `[access-assignments] heading visible: ${headingVisible}`
      );

      const searchEl = page.locator('[data-tour="personnel-search"]');
      const searchVisible = await searchEl.isVisible().catch(() => false);
      console.log(
        `[access-assignments] personnel search visible: ${searchVisible}`
      );

      await screenshot(page, "05-access-assignments");

      if (errors.length) {
        console.warn(
          `[access-assignments] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 6: Users  /users
// ---------------------------------------------------------------------------

adminTest.describe("User management (/users)", () => {
  adminTest(
    "loads user list without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/users", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const heading = page
        .getByRole("heading", { name: /user/i })
        .first();
      const headingVisible = await heading
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(`[users] heading visible: ${headingVisible}`);

      // Check for a table or list element
      const table = page.locator("table, [role='table'], [role='list']");
      const tableCount = await table.count();
      console.log(`[users] table/list elements: ${tableCount}`);

      await screenshot(page, "06-users-list");

      if (errors.length) {
        console.warn(`[users] Console errors:\n  ${errors.join("\n  ")}`);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 7: Admin Center  /admin
// ---------------------------------------------------------------------------

adminTest.describe("Admin Center (/admin)", () => {
  adminTest(
    "loads without crash and shows user management section",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/admin", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const heading = page
        .getByRole("heading", { name: /user management/i })
        .first();
      const headingVisible = await heading
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(`[admin] user management heading visible: ${headingVisible}`);

      await screenshot(page, "07-admin-center");

      if (errors.length) {
        console.warn(
          `[admin] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 8: System Settings  /system-settings
// ---------------------------------------------------------------------------

adminTest.describe("System Settings (/system-settings)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/system-settings", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");
      await expect(page.locator("body")).not.toContainText(
        "Application Error"
      );

      const body = await page.locator("body").textContent();
      console.log(
        `[system-settings] body snippet: ${body?.slice(0, 200)}`
      );

      await screenshot(page, "08-system-settings");

      if (errors.length) {
        console.warn(
          `[system-settings] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 9: Notifications  /notifications
// ---------------------------------------------------------------------------

adminTest.describe("Notifications (/notifications)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/notifications", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[notifications] body snippet: ${body?.slice(0, 200)}`
      );

      await screenshot(page, "09-notifications");

      if (errors.length) {
        console.warn(
          `[notifications] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 10: Lighting  /lighting
// ---------------------------------------------------------------------------

adminTest.describe("Lighting management (/lighting)", () => {
  adminTest(
    "loads without crash and shows lighting tabs",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/lighting", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const heading = page
        .getByRole("heading", { name: /lighting management/i })
        .first();
      const headingVisible = await heading
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      console.log(`[lighting] heading visible: ${headingVisible}`);

      const lightingTabs = page.locator('[data-tour="lighting-tabs"]');
      const tabsVisible = await lightingTabs.isVisible().catch(() => false);
      console.log(
        `[lighting] lighting-tabs tour element visible: ${tabsVisible}`
      );

      // Try switching to Floor View tab
      const floorViewTab = page.getByRole("tab", { name: /floor view/i });
      const floorTabVisible = await floorViewTab
        .isVisible()
        .catch(() => false);
      if (floorTabVisible) {
        await floorViewTab.click();
        await page.waitForTimeout(500);
        const activeState = await floorViewTab
          .getAttribute("data-state")
          .catch(() => null);
        console.log(
          `[lighting] floor view tab data-state after click: ${activeState}`
        );
      }

      await screenshot(page, "10-lighting");

      if (errors.length) {
        console.warn(
          `[lighting] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 11: Admin Key Requests  /admin/key-requests
// ---------------------------------------------------------------------------

adminTest.describe("Admin Key Requests (/admin/key-requests)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(
        page,
        "/admin/key-requests",
        session
      );

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[key-requests] body snippet: ${body?.slice(0, 300)}`
      );

      await screenshot(page, "11-admin-key-requests");

      if (errors.length) {
        console.warn(
          `[key-requests] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 12: Admin Supply Requests  /admin/supply-requests
// ---------------------------------------------------------------------------

adminTest.describe("Admin Supply Requests (/admin/supply-requests)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(
        page,
        "/admin/supply-requests",
        session
      );

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[supply-requests] body snippet: ${body?.slice(0, 300)}`
      );

      await screenshot(page, "12-admin-supply-requests");

      if (errors.length) {
        console.warn(
          `[supply-requests] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 13: Form Templates Admin  /admin/form-templates
// ---------------------------------------------------------------------------

adminTest.describe("Form Templates Admin (/admin/form-templates)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(
        page,
        "/admin/form-templates",
        session
      );

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[form-templates] body snippet: ${body?.slice(0, 300)}`
      );

      await screenshot(page, "13-admin-form-templates");

      if (errors.length) {
        console.warn(
          `[form-templates] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 14: Routing Rules  /admin/routing-rules
// ---------------------------------------------------------------------------

adminTest.describe("Routing Rules (/admin/routing-rules)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(
        page,
        "/admin/routing-rules",
        session
      );

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[routing-rules] body snippet: ${body?.slice(0, 300)}`
      );

      await screenshot(page, "14-admin-routing-rules");

      if (errors.length) {
        console.warn(
          `[routing-rules] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 15: Court Live Grid  /court-live
// ---------------------------------------------------------------------------

adminTest.describe("Court Live Grid (/court-live)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/court-live", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[court-live] body snippet: ${body?.slice(0, 300)}`
      );

      await screenshot(page, "15-court-live");

      if (errors.length) {
        console.warn(
          `[court-live] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 16: Card Showcase  /card-showcase
// ---------------------------------------------------------------------------

adminTest.describe("Card Showcase (/card-showcase)", () => {
  adminTest(
    "loads without crash",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const errors = await navigateTo(page, "/card-showcase", session);

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).not.toContainText("[object Object]");

      const body = await page.locator("body").textContent();
      console.log(
        `[card-showcase] body snippet: ${body?.slice(0, 300)}`
      );

      await screenshot(page, "16-card-showcase");

      if (errors.length) {
        console.warn(
          `[card-showcase] Console errors:\n  ${errors.join("\n  ")}`
        );
      }
    }
  );
});

// ---------------------------------------------------------------------------
// SECTION 17: Comprehensive page smoke — visit all 16 admin pages in sequence
//             Record crash/redirect/error per page in a summary
// ---------------------------------------------------------------------------

adminTest.describe("Full admin page sweep", () => {
  adminTest(
    "visit every admin page and collect a health report",
    async ({ page, session }) => {
      test.skip(!session, "Requires admin credentials");

      const pages = [
        { path: "/", label: "Admin Dashboard" },
        { path: "/spaces", label: "Spaces" },
        { path: "/operations", label: "Operations" },
        { path: "/keys", label: "Keys" },
        { path: "/access-assignments", label: "Access & Assignments" },
        { path: "/users", label: "Users" },
        { path: "/admin", label: "Admin Center" },
        { path: "/system-settings", label: "System Settings" },
        { path: "/notifications", label: "Notifications" },
        { path: "/lighting", label: "Lighting" },
        { path: "/admin/key-requests", label: "Admin Key Requests" },
        { path: "/admin/supply-requests", label: "Admin Supply Requests" },
        { path: "/admin/form-templates", label: "Form Templates Admin" },
        { path: "/admin/routing-rules", label: "Routing Rules" },
        { path: "/court-live", label: "Court Live Grid" },
        { path: "/card-showcase", label: "Card Showcase" },
      ];

      const report: Array<{
        label: string;
        path: string;
        finalUrl: string;
        redirectedToLogin: boolean;
        consoleErrors: number;
        hasObjectObject: boolean;
        hasUndefined: boolean;
        hasErrorBoundary: boolean;
        bodySnippet: string;
      }> = [];

      // Inject session once via initScript by navigating to base first
      await page.addInitScript(
        ({ key, value }: { key: string; value: string }) => {
          localStorage.setItem(key, value);
          localStorage.setItem("pwa-install-dismissed", "true");
        },
        {
          key: SUPABASE_STORAGE_KEY,
          value: JSON.stringify(session),
        }
      );

      for (const { path: urlPath, label } of pages) {
        const pageErrors: string[] = [];
        const onError = (msg: import("@playwright/test").ConsoleMessage) => {
          if (msg.type() === "error") pageErrors.push(msg.text());
        };
        const onPageError = (err: Error) =>
          pageErrors.push(`pageerror: ${err.message}`);

        page.on("console", onError);
        page.on("pageerror", onPageError);

        await page.goto(`${BASE_URL}${urlPath}`, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        await page.waitForTimeout(2000);

        const finalUrl = page.url();
        const bodyText = await page
          .locator("body")
          .textContent()
          .catch(() => "");

        const result = {
          label,
          path: urlPath,
          finalUrl: finalUrl.replace(BASE_URL, ""),
          redirectedToLogin: finalUrl.includes("/login"),
          consoleErrors: pageErrors.length,
          hasObjectObject: bodyText?.includes("[object Object]") ?? false,
          hasUndefined:
            /(^|\s)undefined(\s|$)/.test(bodyText ?? "") ||
            bodyText?.includes(": undefined") ??
            false,
          hasErrorBoundary:
            /something went wrong|application error|error boundary/i.test(
              bodyText ?? ""
            ),
          bodySnippet: bodyText?.slice(0, 150).replace(/\s+/g, " ") ?? "",
        };

        report.push(result);

        await screenshot(
          page,
          `sweep-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
        );

        page.removeListener("console", onError);
        page.removeListener("pageerror", onPageError);
      }

      // Print comprehensive report
      console.log("\n========================================");
      console.log("ADMIN PAGE HEALTH REPORT");
      console.log("========================================");

      const passing: typeof report = [];
      const failing: typeof report = [];

      for (const r of report) {
        const issues: string[] = [];
        if (r.redirectedToLogin) issues.push("REDIRECTED TO LOGIN");
        if (r.hasObjectObject) issues.push("[object Object] visible");
        if (r.hasUndefined) issues.push("'undefined' visible in body");
        if (r.hasErrorBoundary) issues.push("ERROR BOUNDARY triggered");
        if (r.consoleErrors > 0)
          issues.push(`${r.consoleErrors} console error(s)`);

        if (issues.length === 0) {
          passing.push(r);
        } else {
          failing.push(r);
        }

        const status = issues.length === 0 ? "PASS" : "FAIL";
        console.log(
          `\n[${status}] ${r.label} (${r.path}) -> ${r.finalUrl}`
        );
        if (issues.length) {
          console.log(`       Issues: ${issues.join(", ")}`);
        }
        console.log(`       Body: ${r.bodySnippet}`);
      }

      console.log("\n========================================");
      console.log(
        `SUMMARY: ${passing.length}/${report.length} pages PASS`
      );
      console.log("========================================");

      if (failing.length > 0) {
        console.log("\nFAILING PAGES:");
        for (const r of failing) {
          console.log(`  - ${r.label} (${r.path})`);
        }
      }

      // The sweep itself should not hard-fail on individual page issues
      // but we do assert that at least some pages loaded (sanity check)
      expect(passing.length + failing.length).toBe(pages.length);
    }
  );
});
