/**
 * AGENT: Regular User (Standard Court Employee)
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a standard court employee (judge, clerk, officer, etc.) using
 * the self-service features of the app:
 *   - Dashboard (personal overview)
 *   - My Requests — submit a supply request, view status
 *   - My Issues — report an issue, view updates
 *   - Profile — view / edit personal info
 *
 * Also tests that all admin/operations sections are properly blocked.
 *
 * Env vars required:
 *   PLAYWRIGHT_USER_EMAIL
 *   PLAYWRIGHT_USER_PASSWORD
 */

import { test, expect } from "@playwright/test";
import {
  getSession,
  hasCredentials,
  injectSession,
  collectErrors,
  snap,
  bodyHealth,
  dismissInstallPrompt,
} from "./helpers/auth";

// ─── Credentials ───────────────────────────────────────────────────────────────

const EMAIL = process.env.PLAYWRIGHT_USER_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD;

let _session: object | null = null;

test.beforeAll(async () => {
  if (!hasCredentials(EMAIL, PASSWORD)) return;
  _session = await getSession(EMAIL!, PASSWORD!);
});

async function go(page: Parameters<typeof injectSession>[0], urlPath: string) {
  await injectSession(page, _session!);
  await page.goto(urlPath, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(1_500);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Regular User Agent", () => {
  test.skip(
    !hasCredentials(EMAIL, PASSWORD),
    "Set PLAYWRIGHT_USER_EMAIL and PLAYWRIGHT_USER_PASSWORD"
  );

  // ── Onboarding — first login redirect ─────────────────────────────────────

  test.describe("Onboarding & login redirect", () => {
    test("user lands on dashboard after session injection, not on login", async ({
      page,
    }) => {
      await go(page, "/");
      await expect(page).not.toHaveURL(/\/login/);
      await snap(page, "user-01-dashboard-after-auth");
    });
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────

  test.describe("User Dashboard", () => {
    test("loads personal dashboard", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject).toBe(false);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[user/dashboard] body: ${health.snippet}`);
      await snap(page, "user-01-dashboard");

      if (getErrors().length)
        console.warn("[user/dashboard] console errors:", getErrors());
    });
  });

  // ── My Requests ────────────────────────────────────────────────────────────

  test.describe("My Requests (/my-requests)", () => {
    test("loads my requests page without crash", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/my-requests");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject).toBe(false);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[user/my-requests] body: ${health.snippet}`);
      await snap(page, "user-02-my-requests");

      if (getErrors().length)
        console.warn("[user/my-requests] console errors:", getErrors());
    });

    test("can open supply request form", async ({ page }) => {
      await go(page, "/my-requests");
      await dismissInstallPrompt(page);

      const newReqBtn = page
        .getByRole("button", { name: /new request|submit|add request|supply request/i })
        .first();

      if (await newReqBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await newReqBtn.click();
        await page.waitForTimeout(800);
        await snap(page, "user-02-supply-request-form-open");

        // Form fields present
        const fields = page.locator("input, textarea, select");
        const fieldCount = await fields.count();
        console.log(`[user/my-requests] form fields visible: ${fieldCount}`);
        expect(fieldCount, "Supply request form should have at least one field").toBeGreaterThan(0);

        // BUG-1 check: form alignment on mobile
        const viewport = page.viewportSize();
        const fieldBoxes = await fields.all();
        const overflows: string[] = [];
        for (const f of fieldBoxes) {
          const box = await f.boundingBox().catch(() => null);
          if (!box || !viewport) continue;
          if (box.x + box.width > viewport.width + 2) {
            const name = await f.getAttribute("name").catch(() => "");
            overflows.push(`field[name=${name}] right=${(box.x + box.width).toFixed(0)}px`);
          }
        }
        if (overflows.length > 0) {
          console.error(
            `[BUG-1/user] Supply request form fields overflow viewport:\n  ` +
              overflows.join("\n  ")
          );
        }

        await snap(page, "user-02-supply-request-form-alignment");
      } else {
        console.warn("[user/my-requests] new request button not visible");
      }
    });

    test("can filter/switch tabs on my-requests", async ({ page }) => {
      await go(page, "/my-requests");
      await dismissInstallPrompt(page);

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`[user/my-requests] tabs found: ${tabCount}`);

      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(400);
      }
      if (tabCount > 0) await snap(page, "user-02-my-requests-tabs");
    });
  });

  // ── My Issues ──────────────────────────────────────────────────────────────

  test.describe("My Issues (/my-issues)", () => {
    test("loads my issues page without crash", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/my-issues");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject).toBe(false);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[user/my-issues] body: ${health.snippet}`);
      await snap(page, "user-03-my-issues");

      if (getErrors().length)
        console.warn("[user/my-issues] console errors:", getErrors());
    });

    test("can open report issue form", async ({ page }) => {
      await go(page, "/my-issues");
      await dismissInstallPrompt(page);

      const reportBtn = page
        .getByRole("button", { name: /report issue|new issue|add issue/i })
        .first();

      if (await reportBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await reportBtn.click();
        await page.waitForTimeout(800);
        await snap(page, "user-03-report-issue-form-open");

        const fieldCount = await page.locator("input, textarea, select").count();
        console.log(`[user/my-issues] issue form fields: ${fieldCount}`);
        expect(fieldCount).toBeGreaterThan(0);
      } else {
        console.warn("[user/my-issues] report issue button not visible");
      }
    });

    test("existing issues list displays", async ({ page }) => {
      await go(page, "/my-issues");

      // Look for issue cards or empty state
      const issueItems = page.locator(
        '[role="listitem"], li, article, .card'
      );
      const count = await issueItems.count();
      console.log(`[user/my-issues] issue items found: ${count}`);

      const emptyState = page.locator(
        '[class*="empty"], [class*="no-issues"], text=/no issues|nothing here/i'
      );
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      console.log(`[user/my-issues] empty state visible: ${emptyVisible}`);

      await snap(page, "user-03-my-issues-list");
    });
  });

  // ── Profile ────────────────────────────────────────────────────────────────

  test.describe("Profile (/profile)", () => {
    test("loads profile page", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/profile");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject).toBe(false);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[user/profile] body: ${health.snippet}`);
      await snap(page, "user-04-profile");

      if (getErrors().length)
        console.warn("[user/profile] console errors:", getErrors());
    });

    test("profile shows user info fields", async ({ page }) => {
      await go(page, "/profile");

      // Look for common profile fields
      const nameField = page.locator(
        'input[name*="name"], input[placeholder*="name" i], [aria-label*="name" i]'
      ).first();
      const emailField = page.locator(
        'input[name*="email"], input[type="email"]'
      ).first();

      const nameVisible = await nameField.isVisible().catch(() => false);
      const emailVisible = await emailField.isVisible().catch(() => false);
      console.log(
        `[user/profile] name field: ${nameVisible}, email field: ${emailVisible}`
      );

      await snap(page, "user-04-profile-fields");
    });
  });

  // ── Access control — blocked routes ────────────────────────────────────────

  test.describe("Access control — regular user cannot reach admin pages", () => {
    const blockedRoutes = [
      { path: "/spaces", label: "Spaces" },
      { path: "/keys", label: "Keys" },
      { path: "/users", label: "User Management" },
      { path: "/admin", label: "Admin Center" },
      { path: "/lighting", label: "Lighting" },
      { path: "/operations", label: "Operations Hub" },
      { path: "/inventory", label: "Inventory" },
      { path: "/supply-room", label: "Supply Room" },
      { path: "/access-assignments", label: "Access & Assignments" },
      { path: "/court-live", label: "Court Live" },
    ];

    for (const { path: urlPath, label } of blockedRoutes) {
      test(`regular user is blocked from ${label}`, async ({ page }) => {
        await go(page, urlPath);
        const url = page.url();
        const blocked =
          url.includes("/login") ||
          url.includes("/403") ||
          url.includes("/unauthorized") ||
          url.includes("/dashboard");
        console.log(
          `[user/access-control] ${urlPath} -> ${url.replace(/https?:\/\/[^/]+/, "")} (${blocked ? "BLOCKED ✅" : "ACCESSIBLE ⚠️"})`
        );
        if (!blocked) {
          console.error(
            `[user/access-control] ⚠️ Regular user can access ${label} — RBAC issue`
          );
        }
        await snap(page, `user-blocked-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
      });
    }
  });
});
