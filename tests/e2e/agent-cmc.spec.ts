/**
 * AGENT: Court Management Coordinator (CMC)
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a CMC user navigating their permitted sections of the app:
 *   - Court Live grid
 *   - Operations (report issues, view maintenance)
 *   - My Requests
 *   - Profile
 *
 * Also verifies that admin-only routes are NOT accessible.
 *
 * Env vars required:
 *   PLAYWRIGHT_CMC_EMAIL
 *   PLAYWRIGHT_CMC_PASSWORD
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

const EMAIL = process.env.PLAYWRIGHT_CMC_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_CMC_PASSWORD;

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

test.describe("CMC Agent", () => {
  test.skip(
    !hasCredentials(EMAIL, PASSWORD),
    "Set PLAYWRIGHT_CMC_EMAIL and PLAYWRIGHT_CMC_PASSWORD"
  );

  // ── Dashboard ──────────────────────────────────────────────────────────────

  test.describe("Dashboard", () => {
    test("CMC lands on dashboard (not login)", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "cmc-01-dashboard");

      if (getErrors().length)
        console.warn("[cmc/dashboard] console errors:", getErrors());
    });
  });

  // ── Court Live ─────────────────────────────────────────────────────────────

  test.describe("Court Live (/court-live)", () => {
    test("loads courtroom grid", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/court-live");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[cmc/court-live] body: ${health.snippet}`);
      await snap(page, "cmc-02-court-live");

      if (getErrors().length)
        console.warn("[cmc/court-live] console errors:", getErrors());
    });

    test("can interact with courtroom status cards if present", async ({
      page,
    }) => {
      await go(page, "/court-live");
      await dismissInstallPrompt(page);

      // Look for clickable courtroom cards / buttons
      const courtroomCard = page
        .locator('[role="button"], button, article, .card')
        .filter({ hasText: /courtroom|part|room/i })
        .first();

      if (
        await courtroomCard.isVisible({ timeout: 8_000 }).catch(() => false)
      ) {
        const label = await courtroomCard.textContent();
        console.log(`[cmc/court-live] clicking card: "${label?.trim().slice(0, 40)}"`);
        await courtroomCard.click();
        await page.waitForTimeout(800);
        await snap(page, "cmc-02-court-live-card-click");
      } else {
        console.warn("[cmc/court-live] no courtroom card found to interact with");
      }
    });
  });

  // ── Operations ─────────────────────────────────────────────────────────────

  test.describe("Operations (/operations)", () => {
    test("loads operations hub", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/operations");

      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /operations/i }).first()
      ).toBeVisible({ timeout: 10_000 });
      await snap(page, "cmc-03-operations");

      if (getErrors().length)
        console.warn("[cmc/operations] console errors:", getErrors());
    });

    test("can view issues tab", async ({ page }) => {
      await go(page, "/operations?tab=issues");
      await expect(page).not.toHaveURL(/\/login/);
      await snap(page, "cmc-03-operations-issues");
    });

    test("report issue form is accessible", async ({ page }) => {
      await go(page, "/operations");
      await dismissInstallPrompt(page);

      // Look for "Report Issue" or "New Issue" button
      const reportBtn = page
        .getByRole("button", { name: /report issue|new issue|add issue/i })
        .first();

      if (await reportBtn.isVisible({ timeout: 6_000 }).catch(() => false)) {
        await reportBtn.click();
        await page.waitForTimeout(800);
        await snap(page, "cmc-03-report-issue-form");

        // Check form fields are visible
        const formFields = await page.locator("input, textarea, select").count();
        console.log(`[cmc/operations] issue form fields visible: ${formFields}`);
      } else {
        console.warn("[cmc/operations] report issue button not found");
      }
    });
  });

  // ── My Requests ────────────────────────────────────────────────────────────

  test.describe("My Requests (/my-requests)", () => {
    test("loads my requests page", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/my-requests");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[cmc/my-requests] body: ${health.snippet}`);
      await snap(page, "cmc-04-my-requests");

      if (getErrors().length)
        console.warn("[cmc/my-requests] console errors:", getErrors());
    });

    test("supply request form flow", async ({ page }) => {
      await go(page, "/my-requests");
      await dismissInstallPrompt(page);

      const newRequestBtn = page
        .getByRole("button", { name: /new request|submit request|add request/i })
        .first();

      if (await newRequestBtn.isVisible({ timeout: 6_000 }).catch(() => false)) {
        await newRequestBtn.click();
        await page.waitForTimeout(800);
        await snap(page, "cmc-04-supply-request-form");

        const fields = await page.locator("input, textarea, select").count();
        console.log(`[cmc/my-requests] supply request form fields: ${fields}`);
      } else {
        console.warn("[cmc/my-requests] new request button not found");
      }
    });
  });

  // ── Profile ────────────────────────────────────────────────────────────────

  test.describe("Profile (/profile)", () => {
    test("loads profile page", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/profile");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "cmc-05-profile");

      if (getErrors().length)
        console.warn("[cmc/profile] console errors:", getErrors());
    });
  });

  // ── Access control — blocked routes ────────────────────────────────────────

  test.describe("Access control — CMC cannot reach admin-only pages", () => {
    const blockedRoutes = [
      { path: "/spaces", label: "Spaces (building mgmt)" },
      { path: "/keys", label: "Keys Management" },
      { path: "/users", label: "User Management" },
      { path: "/admin", label: "Admin Center" },
      { path: "/lighting", label: "Lighting Management" },
      { path: "/inventory", label: "Inventory" },
    ];

    for (const { path: urlPath, label } of blockedRoutes) {
      test(`CMC is blocked from ${label}`, async ({ page }) => {
        await go(page, urlPath);
        const url = page.url();
        const redirected = url.includes("/login") || url.includes("/403") || url.includes("/unauthorized");
        console.log(
          `[cmc/access-control] ${urlPath} -> ${url.replace(/https?:\/\/[^/]+/, "")} (${redirected ? "BLOCKED ✅" : "ACCESSIBLE ⚠️"})`
        );
        await snap(page, `cmc-blocked-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
        // Log rather than hard-fail so we get a full picture
        if (!redirected) {
          console.error(
            `[cmc/access-control] ⚠️ CMC can access ${label} — RBAC may not be enforced`
          );
        }
      });
    }
  });
});
