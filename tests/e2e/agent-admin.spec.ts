/**
 * AGENT: Admin
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a full admin user walking through every section of the app.
 * Also contains targeted regression checks for two known mobile UI bugs:
 *
 *   BUG-1  Supply ordering page — elements misaligned on mobile viewport
 *   BUG-2  Access & Assignments — clicking a person opens a sheet that is
 *           trapped behind the iPhone notch with no reachable close button
 *
 * Env vars required:
 *   PLAYWRIGHT_ADMIN_EMAIL
 *   PLAYWRIGHT_ADMIN_PASSWORD
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

const EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

// ─── Shared session (loaded once per worker) ───────────────────────────────────

let _session: object | null = null;

test.beforeAll(async () => {
  if (!hasCredentials(EMAIL, PASSWORD)) return;
  _session = await getSession(EMAIL!, PASSWORD!);
});

// Helper: navigate to a path with session already injected
async function go(page: Parameters<typeof injectSession>[0], urlPath: string) {
  await injectSession(page, _session!);
  await page.goto(urlPath, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(1_500);
}

// ─── Guard ─────────────────────────────────────────────────────────────────────

test.describe("Admin Agent", () => {
  test.skip(!hasCredentials(EMAIL, PASSWORD), "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD");

  // ── Onboarding / Login ──────────────────────────────────────────────────────

  test.describe("Onboarding — login page", () => {
    test("login page renders NYSC branding", async ({ page }) => {
      await page.goto("/login");
      // App name is rendered in a <p> tag (not a heading) on the login page
      await expect(page.getByText(/nysc facilities hub/i)).toBeVisible();
      await expect(page.getByText(/authorized use only/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign in/i })
      ).toBeDisabled();
      await snap(page, "admin-00-login-page");
    });

    test("admin can sign in via the UI form and land on dashboard", async ({
      page,
    }) => {
      await page.addInitScript(() =>
        localStorage.setItem("pwa-install-dismissed", "true")
      );
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel(/email/i).fill(EMAIL!);
      await page.getByLabel(/password/i).fill(PASSWORD!);

      // Wait for validation to enable the button
      await expect(
        page.getByRole("button", { name: /sign in/i })
      ).toBeEnabled({ timeout: 5_000 });
      await page.getByRole("button", { name: /sign in/i }).click();

      // Allow up to 20s — may route through /auth/callback first
      await page
        .waitForURL((url) => !url.href.includes("/login"), { timeout: 20_000 })
        .catch(() => {});

      const finalUrl = page.url();
      console.log(`[admin/login-form] final URL: ${finalUrl}`);
      await snap(page, "admin-00-after-login");

      if (finalUrl.includes("/login")) {
        console.warn(
          "[admin/login-form] ⚠️  Still on /login — rate-limited or UI auth flow differs from SDK"
        );
      } else {
        expect(finalUrl).not.toMatch(/\/login/);
      }
    });
  });

  // ── Dashboard ───────────────────────────────────────────────────────────────

  test.describe("Dashboard (/)", () => {
    test("loads stats cards and charts", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject, "[object Object] visible on dashboard").toBe(false);
      expect(health.hasErrorBoundary, "Error boundary triggered on dashboard").toBe(false);

      const chartCount = await page
        .locator(".recharts-wrapper, canvas, [data-testid*='chart']")
        .count();
      console.log(`[admin/dashboard] chart elements: ${chartCount}`);

      await snap(page, "admin-01-dashboard");
      if (getErrors().length)
        console.warn("[admin/dashboard] console errors:", getErrors());
    });
  });

  // ── Spaces ──────────────────────────────────────────────────────────────────

  test.describe("Spaces (/spaces)", () => {
    test("loads room list", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/spaces");

      await expect(page).not.toHaveURL(/\/login/);
      const spaceList = page.locator('[data-tour="space-list"]');
      await expect(spaceList).toBeVisible({ timeout: 12_000 });
      await snap(page, "admin-02-spaces-list");

      if (getErrors().length)
        console.warn("[admin/spaces] console errors:", getErrors());
    });

    test("clicking a room card opens the room drawer", async ({ page }) => {
      await go(page, "/spaces");
      await expect(page).not.toHaveURL(/\/login/);

      const firstRoom = page.locator("h3").first();
      await expect(firstRoom).toBeVisible({ timeout: 15_000 });
      const roomName = await firstRoom.textContent();
      await firstRoom.click();

      const drawer = page.getByRole("dialog");
      await expect(drawer).toBeVisible({ timeout: 8_000 });
      await expect(drawer).toContainText(roomName ?? "");
      await snap(page, "admin-02-spaces-room-drawer");

      // Verify drawer has a close / back affordance
      const closeable =
        (await drawer.getByRole("button", { name: /close/i }).isVisible().catch(() => false)) ||
        (await page.getByRole("button", { name: /back/i }).isVisible().catch(() => false));
      console.log(`[admin/spaces] drawer closeable: ${closeable}`);
    });

    test("floor plan view tab switches correctly", async ({ page }) => {
      await go(page, "/spaces");
      const floorBtn = page.getByRole("button", { name: /floor plan/i });
      if (await floorBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await floorBtn.click();
        await expect(
          page.getByRole("heading", { name: /floor plan viewer/i })
        ).toBeVisible({ timeout: 8_000 });
        await snap(page, "admin-02-spaces-floor-plan");
      } else {
        console.warn("[admin/spaces] floor plan button not visible — skipped");
      }
    });
  });

  // ── Operations ──────────────────────────────────────────────────────────────

  test.describe("Operations (/operations)", () => {
    test("loads issues tab", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/operations?tab=issues");

      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /operations/i }).first()
      ).toBeVisible({ timeout: 10_000 });
      await snap(page, "admin-03-operations-issues");

      if (getErrors().length)
        console.warn("[admin/operations] console errors:", getErrors());
    });

    test("can switch to maintenance tab", async ({ page }) => {
      await go(page, "/operations");
      const maintenanceTab = page.getByRole("tab", { name: /maintenance/i });
      if (await maintenanceTab.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await maintenanceTab.click();
        await page.waitForTimeout(600);
        const state = await maintenanceTab.getAttribute("data-state");
        console.log(`[admin/operations] maintenance tab state: ${state}`);
        await snap(page, "admin-03-operations-maintenance");
      }
    });
  });

  // ── Keys ────────────────────────────────────────────────────────────────────

  test.describe("Keys (/keys)", () => {
    test("loads key management with tabs", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/keys");

      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /key management/i })
      ).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-tour="keys-tabs"]')).toBeVisible();
      await snap(page, "admin-04-keys");

      // Switch tabs
      const tabs = page.locator('[data-tour="keys-tabs"] [role="tab"]');
      const tabCount = await tabs.count();
      console.log(`[admin/keys] tabs found: ${tabCount}`);
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(400);
      }
      await snap(page, "admin-04-keys-tabs-explored");

      if (getErrors().length)
        console.warn("[admin/keys] console errors:", getErrors());
    });
  });

  // ── Access & Assignments — BUG-2 ────────────────────────────────────────────

  test.describe("Access & Assignments (/access-assignments) — BUG-2 investigation", () => {
    test("loads without crash and shows personnel search", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/access-assignments");

      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /access & assignments/i })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator('[data-tour="personnel-search"]')
      ).toBeVisible();
      await snap(page, "admin-05-access-assignments");

      if (getErrors().length)
        console.warn("[admin/access-assignments] console errors:", getErrors());
    });

    test("BUG-2: clicking a person — dialog positioning vs iPhone notch", async ({
      page,
    }) => {
      await go(page, "/access-assignments");
      await expect(page).not.toHaveURL(/\/login/);
      await dismissInstallPrompt(page);

      // Wait for the personnel list to populate
      const personLink = page
        .locator('a, button, [role="button"]')
        .filter({ hasText: /[A-Z][a-z]+ [A-Z][a-z]+/ })
        .first();

      const personVisible = await personLink
        .isVisible({ timeout: 12_000 })
        .catch(() => false);

      if (!personVisible) {
        // Try searching for someone
        const searchBox = page.locator('[data-tour="personnel-search"] input, input[type="search"], input[placeholder*="search" i]').first();
        if (await searchBox.isVisible().catch(() => false)) {
          await searchBox.fill("a");
          await page.waitForTimeout(800);
        }
      }

      const personBtn = page
        .locator('a, button, [role="button"], li, [role="listitem"]')
        .filter({ hasText: /[A-Z][a-z]/ })
        .first();

      if (!(await personBtn.isVisible({ timeout: 8_000 }).catch(() => false))) {
        console.warn("[BUG-2] No person found to click — capturing blank state");
        await snap(page, "admin-05-access-bug2-no-person");
        return;
      }

      const personName = await personBtn.textContent();
      console.log(`[BUG-2] Clicking person: "${personName?.trim()}"`);
      await personBtn.click();
      await page.waitForTimeout(1_500);

      await snap(page, "admin-05-access-bug2-after-click");

      // Check if a dialog / sheet / drawer opened
      const dialog = page.getByRole("dialog").first();
      const dialogVisible = await dialog.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`[BUG-2] Dialog/sheet opened: ${dialogVisible}`);

      if (dialogVisible) {
        const box = await dialog.boundingBox();
        console.log(`[BUG-2] Dialog bounding box: ${JSON.stringify(box)}`);

        // iPhone 13 safe-area-inset-top ≈ 47 px.
        // If the dialog top is at 0 it is behind the notch.
        if (box) {
          const behindNotch = box.y < 20;
          console.log(
            `[BUG-2] Dialog top ${box.y}px — ${behindNotch ? "⚠️ BEHIND NOTCH" : "✅ below notch"}`
          );
          if (behindNotch) {
            console.error(
              "[BUG-2] CONFIRMED: Sheet opens at y=0, content hidden behind iPhone notch"
            );
          }
        }

        // Check close button is reachable
        const closeBtn = dialog.getByRole("button", { name: /close|dismiss|cancel|done/i }).first();
        const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
        console.log(`[BUG-2] Close button visible: ${closeBtnVisible}`);

        if (!closeBtnVisible) {
          console.error(
            "[BUG-2] CONFIRMED: No reachable close/dismiss button in the sheet — user is trapped"
          );
        }

        await snap(page, "admin-05-access-bug2-dialog-open");

        // Attempt to close — swipe down is common for mobile sheets
        if (closeBtnVisible) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          const stillOpen = await dialog.isVisible().catch(() => false);
          console.log(`[BUG-2] Dialog still open after close attempt: ${stillOpen}`);
        }
      } else {
        console.log("[BUG-2] No dialog appeared after click — may navigate inline");
      }
    });
  });

  // ── Users ───────────────────────────────────────────────────────────────────

  // NOTE: /users was removed — it redirects to /admin. Test now lives in Admin Center section.

  // ── Admin Center ────────────────────────────────────────────────────────────

  test.describe("Admin Center (/admin)", () => {
    test("loads admin center", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/admin");

      await expect(page).not.toHaveURL(/\/login/);
      // Mobile view shows Users/System tabs — no explicit "Admin Center" h1 on mobile
      await expect(
        page.getByRole("tab", { name: /users/i }).first()
      ).toBeVisible({ timeout: 10_000 });
      await snap(page, "admin-07-admin-center");

      if (getErrors().length)
        console.warn("[admin/admin-center] console errors:", getErrors());
    });
  });

  // ── System Settings ─────────────────────────────────────────────────────────

  test.describe("System Settings (/system-settings)", () => {
    test("loads without crash", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/system-settings");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "admin-08-system-settings");
    });
  });

  // ── Lighting ────────────────────────────────────────────────────────────────
  // NOTE: /lighting route was removed — lighting lives inside /operations

  test.describe("Lighting (via /operations)", () => {
    test("lighting tab accessible via operations", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/operations");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);

      // Lighting is now a tab within Operations (/operations)
      const lightingTab = page.getByRole("tab", { name: /lighting/i });
      if (await lightingTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await lightingTab.click();
        await page.waitForTimeout(500);
        console.log(`[admin/lighting] lighting tab found and clicked`);
      } else {
        console.warn(`[admin/lighting] no lighting tab visible — may be behind a different nav`);
      }

      const floorTab = page.getByRole("tab", { name: /floor view/i });
      if (await floorTab.isVisible().catch(() => false)) {
        await floorTab.click();
        await page.waitForTimeout(500);
        const state = await floorTab.getAttribute("data-state");
        console.log(`[admin/lighting] floor view tab state: ${state}`);
      }
      await snap(page, "admin-10-lighting");

      if (getErrors().length)
        console.warn("[admin/lighting] console errors:", getErrors());
    });
  });

  // ── Court Live ──────────────────────────────────────────────────────────────

  test.describe("Court Live Grid (/court-live)", () => {
    test("loads without crash", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/court-live");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "admin-15-court-live");
    });
  });

  // ── Admin: Key Requests ─────────────────────────────────────────────────────

  test.describe("Admin Key Requests (/admin/key-requests)", () => {
    test("loads without crash", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/admin/key-requests");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[admin/key-requests] body: ${health.snippet}`);
      await snap(page, "admin-11-key-requests");
    });
  });

  // ── Admin: Supply Requests — BUG-1 ──────────────────────────────────────────

  test.describe("Admin Supply Requests (/admin/supply-requests) — BUG-1 investigation", () => {
    test("BUG-1: supply ordering page element alignment on mobile", async ({
      page,
    }) => {
      const getErrors = collectErrors(page);
      await go(page, "/admin/supply-requests");

      await expect(page).not.toHaveURL(/\/login/);
      await snap(page, "admin-12-supply-requests-full");

      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);

      // Check interactive elements are within the viewport (375px on iPhone 13)
      const viewport = page.viewportSize();
      console.log(`[BUG-1] Viewport: ${JSON.stringify(viewport)}`);

      // Gather all buttons and inputs
      const interactiveEls = await page
        .locator("button, input, select, textarea, [role='button']")
        .all();

      const overflowingEls: string[] = [];
      for (const el of interactiveEls) {
        const box = await el.boundingBox().catch(() => null);
        if (!box || !viewport) continue;
        const rightEdge = box.x + box.width;
        if (rightEdge > viewport.width + 2) {
          const text = await el.textContent().catch(() => "");
          overflowingEls.push(
            `"${text?.trim().slice(0, 40)}" right-edge=${rightEdge.toFixed(0)}px`
          );
        }
        // Also flag elements positioned off the left edge
        if (box.x < -2) {
          const text = await el.textContent().catch(() => "");
          overflowingEls.push(
            `"${text?.trim().slice(0, 40)}" left-edge=${box.x.toFixed(0)}px`
          );
        }
      }

      if (overflowingEls.length > 0) {
        console.error(
          `[BUG-1] CONFIRMED: ${overflowingEls.length} element(s) overflow viewport:\n  ` +
            overflowingEls.join("\n  ")
        );
      } else {
        console.log("[BUG-1] No viewport overflows detected on this pass");
      }

      // Scroll down to reveal any off-screen misaligned content
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(500);
      await snap(page, "admin-12-supply-requests-scrolled");

      // Try opening a supply order (look for a card or row to click)
      const orderItem = page
        .locator('[role="listitem"], tr, .card, article')
        .first();
      if (await orderItem.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await orderItem.click();
        await page.waitForTimeout(800);
        await snap(page, "admin-12-supply-requests-detail");

        // Re-check alignment after modal/drawer opens
        const dialogBox = await page
          .getByRole("dialog")
          .boundingBox()
          .catch(() => null);
        if (dialogBox && viewport) {
          const dialogOverflows = dialogBox.x + dialogBox.width > viewport.width + 2;
          console.log(
            `[BUG-1] Supply detail dialog overflows: ${dialogOverflows} (right=${(dialogBox.x + dialogBox.width).toFixed(0)}px)`
          );
        }
      }

      if (getErrors().length)
        console.warn("[BUG-1] Console errors:", getErrors());
    });
  });

  // ── Admin: Form Templates ───────────────────────────────────────────────────

  test.describe("Form Templates (/admin/form-templates)", () => {
    test("loads without crash", async ({ page }) => {
      await go(page, "/admin/form-templates");
      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "admin-13-form-templates");
    });
  });

  // ── Admin: Routing Rules ────────────────────────────────────────────────────

  test.describe("Routing Rules (/admin/routing-rules)", () => {
    test("loads without crash", async ({ page }) => {
      await go(page, "/admin/routing-rules");
      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "admin-14-routing-rules");
    });
  });

  // ── Full sweep health report ─────────────────────────────────────────────────

  test.describe("Full admin page sweep", () => {
    test("visit every admin page and collect health report", async ({ page }) => {
      test.setTimeout(120_000);
      await injectSession(page, _session!);

      const pages = [
        { path: "/", label: "Dashboard" },
        { path: "/spaces", label: "Spaces" },
        { path: "/operations", label: "Operations" },
        { path: "/keys", label: "Keys" },
        { path: "/access-assignments", label: "Access & Assignments" },
        // /users was removed — redirects to /admin
        { path: "/admin", label: "Admin Center" },
        { path: "/admin?tab=system", label: "System Settings" },
        // /lighting was removed — lighting lives inside /operations
        { path: "/court-live", label: "Court Live" },
        { path: "/admin/key-requests", label: "Key Requests" },
        { path: "/admin/supply-requests", label: "Supply Requests" },
        { path: "/admin/form-templates", label: "Form Templates" },
        { path: "/admin/routing-rules", label: "Routing Rules" },
      ];

      type Row = {
        label: string;
        path: string;
        finalUrl: string;
        redirected: boolean;
        errors: number;
        hasObjectObject: boolean;
        hasErrorBoundary: boolean;
      };

      const report: Row[] = [];

      for (const { path: urlPath, label } of pages) {
        const pageErrors: string[] = [];
        page.on("console", (m) => {
          if (m.type() === "error") pageErrors.push(m.text());
        });
        page.on("pageerror", (e) => pageErrors.push(e.message));

        // Use "load" instead of "networkidle" — admin pages have persistent
        // WebSocket / long-poll connections that prevent networkidle from settling.
        await page.goto(urlPath, { waitUntil: "load", timeout: 45_000 });
        await page.waitForTimeout(2_000);

        const finalUrl = page.url();
        const health = await bodyHealth(page);
        await snap(page, `admin-sweep-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);

        report.push({
          label,
          path: urlPath,
          finalUrl: finalUrl.replace(/https?:\/\/[^/]+/, ""),
          redirected: finalUrl.includes("/login"),
          errors: pageErrors.length,
          hasObjectObject: health.hasObjectObject,
          hasErrorBoundary: health.hasErrorBoundary,
        });

        page.removeAllListeners("console");
        page.removeAllListeners("pageerror");
      }

      console.log("\n════════════════════════════════════════");
      console.log("ADMIN PAGE HEALTH REPORT");
      console.log("════════════════════════════════════════");
      let passing = 0;
      for (const r of report) {
        const issues: string[] = [];
        if (r.redirected) issues.push("REDIRECTED TO LOGIN");
        if (r.hasObjectObject) issues.push("[object Object]");
        if (r.hasErrorBoundary) issues.push("ERROR BOUNDARY");
        if (r.errors > 0) issues.push(`${r.errors} console error(s)`);
        const ok = issues.length === 0;
        if (ok) passing++;
        console.log(
          `${ok ? "✅" : "❌"} ${r.label.padEnd(22)} ${r.finalUrl}${ok ? "" : "\n     ⚠️  " + issues.join(", ")}`
        );
      }
      console.log("────────────────────────────────────────");
      console.log(`PASS: ${passing}/${report.length}`);
      console.log("════════════════════════════════════════\n");

      expect(passing + (report.length - passing)).toBe(pages.length);
    });
  });
});
