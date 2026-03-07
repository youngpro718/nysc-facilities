/**
 * AGENT: Court Aide (Supply Room Staff)
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a Court Aide walking through their permitted sections:
 *   - Supply Room (fulfill requests, approve/reject)
 *   - Inventory (add/edit items, stock levels, low-stock alerts)
 *   - Operations (limited — report issues only)
 *
 * Also re-runs the BUG-1 supply alignment check from this user's perspective,
 * since court aides are the primary users of the supply ordering flow.
 *
 * Env vars required:
 *   PLAYWRIGHT_COURT_AIDE_EMAIL
 *   PLAYWRIGHT_COURT_AIDE_PASSWORD
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

const EMAIL = process.env.PLAYWRIGHT_COURT_AIDE_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_COURT_AIDE_PASSWORD;

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

test.describe("Court Aide Agent", () => {
  test.skip(
    !hasCredentials(EMAIL, PASSWORD),
    "Set PLAYWRIGHT_COURT_AIDE_EMAIL and PLAYWRIGHT_COURT_AIDE_PASSWORD"
  );

  // ── Dashboard ──────────────────────────────────────────────────────────────

  test.describe("Dashboard", () => {
    test("court aide lands on dashboard", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "aide-01-dashboard");

      if (getErrors().length)
        console.warn("[aide/dashboard] console errors:", getErrors());
    });
  });

  // ── Supply Room ────────────────────────────────────────────────────────────

  test.describe("Supply Room (/supply-room)", () => {
    test("loads supply room dashboard", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/supply-room");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject).toBe(false);
      expect(health.hasErrorBoundary).toBe(false);
      console.log(`[aide/supply-room] body: ${health.snippet}`);
      await snap(page, "aide-02-supply-room");

      if (getErrors().length)
        console.warn("[aide/supply-room] console errors:", getErrors());
    });

    test("can see pending requests list", async ({ page }) => {
      await go(page, "/supply-room");
      await dismissInstallPrompt(page);

      // Look for pending/queue section
      const pendingSection = page
        .locator("section, div, [role='region']")
        .filter({ hasText: /pending|queue|awaiting/i })
        .first();

      if (await pendingSection.isVisible({ timeout: 8_000 }).catch(() => false)) {
        console.log("[aide/supply-room] pending section found");
        await snap(page, "aide-02-supply-room-pending");

        // Click first pending request
        const firstRequest = pendingSection
          .locator('[role="button"], button, li, article')
          .first();
        if (await firstRequest.isVisible().catch(() => false)) {
          await firstRequest.click();
          await page.waitForTimeout(800);
          await snap(page, "aide-02-supply-room-request-detail");
        }
      } else {
        console.warn("[aide/supply-room] no pending section visible");
      }
    });

    test("BUG-1: supply room fulfill UI alignment on mobile", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/supply-room");

      const viewport = page.viewportSize();
      console.log(`[BUG-1/aide] Viewport: ${JSON.stringify(viewport)}`);

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
            `"${text?.trim().slice(0, 40)}" right=${rightEdge.toFixed(0)}px`
          );
        }
      }

      if (overflowingEls.length > 0) {
        console.error(
          `[BUG-1/aide] ${overflowingEls.length} overflowing element(s):\n  ` +
            overflowingEls.join("\n  ")
        );
      } else {
        console.log("[BUG-1/aide] No overflow detected on supply room page");
      }

      await snap(page, "aide-02-supply-room-alignment-check");

      if (getErrors().length)
        console.warn("[BUG-1/aide] console errors:", getErrors());
    });

    test("approve/reject workflow UI accessible", async ({ page }) => {
      await go(page, "/supply-room");
      await dismissInstallPrompt(page);

      // Look for approve / fulfill / reject buttons
      const approveBtn = page
        .getByRole("button", { name: /approve|fulfill|fulfill request/i })
        .first();
      const rejectBtn = page
        .getByRole("button", { name: /reject|deny/i })
        .first();

      const approveVisible = await approveBtn.isVisible({ timeout: 6_000 }).catch(() => false);
      const rejectVisible = await rejectBtn.isVisible({ timeout: 2_000 }).catch(() => false);

      console.log(
        `[aide/supply-room] approve button: ${approveVisible}, reject button: ${rejectVisible}`
      );

      if (approveVisible) {
        await snap(page, "aide-02-supply-room-approve-visible");
        // Don't actually click — we don't want to modify real data
      }
    });
  });

  // ── Inventory ──────────────────────────────────────────────────────────────

  test.describe("Inventory (/inventory)", () => {
    test("loads inventory list", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/inventory");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasObjectObject).toBe(false);
      expect(health.hasErrorBoundary).toBe(false);

      await expect(
        page.getByRole("heading", { name: /^inventory$/i }).first()
      ).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-tour="inventory-search"]')).toBeVisible();
      await snap(page, "aide-03-inventory");

      if (getErrors().length)
        console.warn("[aide/inventory] console errors:", getErrors());
    });

    test("inventory search filter works", async ({ page }) => {
      await go(page, "/inventory");
      await dismissInstallPrompt(page);

      const searchBox = page.locator('[data-tour="inventory-search"] input, input[type="search"], input[placeholder*="search" i]').first();
      if (await searchBox.isVisible({ timeout: 6_000 }).catch(() => false)) {
        await searchBox.fill("paper");
        await page.waitForTimeout(800);
        await snap(page, "aide-03-inventory-search-paper");

        await searchBox.clear();
        await page.waitForTimeout(400);
        await snap(page, "aide-03-inventory-search-cleared");
      } else {
        console.warn("[aide/inventory] search box not found");
      }
    });

    test("low stock alerts section visible", async ({ page }) => {
      await go(page, "/inventory");

      const lowStockSection = page
        .locator("section, div, [role='region'], h2, h3")
        .filter({ hasText: /low stock|reorder|alert/i })
        .first();

      const visible = await lowStockSection
        .isVisible({ timeout: 8_000 })
        .catch(() => false);
      console.log(`[aide/inventory] low stock section visible: ${visible}`);

      if (visible) await snap(page, "aide-03-inventory-low-stock");
    });

    test("inventory tabs / categories can be switched", async ({ page }) => {
      await go(page, "/inventory");

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`[aide/inventory] tabs found: ${tabCount}`);

      for (let i = 0; i < Math.min(tabCount, 4); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(400);
      }

      if (tabCount > 0) await snap(page, "aide-03-inventory-tabs-explored");
    });

    test("add item button / form accessible", async ({ page }) => {
      await go(page, "/inventory");
      await dismissInstallPrompt(page);

      const addBtn = page
        .getByRole("button", { name: /add item|new item|add product/i })
        .first();

      if (await addBtn.isVisible({ timeout: 6_000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(800);
        await snap(page, "aide-03-inventory-add-form");

        const fields = await page.locator("input, textarea, select").count();
        console.log(`[aide/inventory] add item form fields: ${fields}`);
      } else {
        console.warn("[aide/inventory] add item button not found");
      }
    });

    test("BUG-1: inventory page element alignment on mobile", async ({ page }) => {
      await go(page, "/inventory");

      const viewport = page.viewportSize();
      const interactiveEls = await page
        .locator("button, input, select, [role='button']")
        .all();

      const overflows: string[] = [];
      for (const el of interactiveEls) {
        const box = await el.boundingBox().catch(() => null);
        if (!box || !viewport) continue;
        if (box.x + box.width > viewport.width + 2) {
          const text = await el.textContent().catch(() => "");
          overflows.push(`"${text?.trim().slice(0, 30)}" right=${(box.x + box.width).toFixed(0)}px`);
        }
      }

      if (overflows.length > 0) {
        console.error(
          `[BUG-1/inventory] ${overflows.length} overflowing element(s):\n  ` +
            overflows.join("\n  ")
        );
      } else {
        console.log("[BUG-1/inventory] No overflow on inventory page");
      }
    });
  });

  // ── Operations (limited) ───────────────────────────────────────────────────

  test.describe("Operations — report issues (/operations)", () => {
    test("can access operations to report issues", async ({ page }) => {
      const getErrors = collectErrors(page);
      await go(page, "/operations");

      await expect(page).not.toHaveURL(/\/login/);
      const health = await bodyHealth(page);
      expect(health.hasErrorBoundary).toBe(false);
      await snap(page, "aide-04-operations");

      if (getErrors().length)
        console.warn("[aide/operations] console errors:", getErrors());
    });
  });

  // ── Access control — blocked routes ────────────────────────────────────────

  test.describe("Access control — court aide cannot reach admin pages", () => {
    const blockedRoutes = [
      { path: "/spaces", label: "Spaces" },
      { path: "/keys", label: "Keys" },
      { path: "/users", label: "Users" },
      { path: "/admin", label: "Admin Center" },
      { path: "/lighting", label: "Lighting" },
      { path: "/court-live", label: "Court Live" },
    ];

    for (const { path: urlPath, label } of blockedRoutes) {
      test(`court aide is blocked from ${label}`, async ({ page }) => {
        await go(page, urlPath);
        const url = page.url();
        const blocked =
          url.includes("/login") ||
          url.includes("/403") ||
          url.includes("/unauthorized");
        console.log(
          `[aide/access-control] ${urlPath} -> ${url.replace(/https?:\/\/[^/]+/, "")} (${blocked ? "BLOCKED ✅" : "ACCESSIBLE ⚠️"})`
        );
        if (!blocked) {
          console.error(
            `[aide/access-control] ⚠️ Court Aide can access ${label} — RBAC issue`
          );
        }
        await snap(page, `aide-blocked-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
      });
    }
  });
});
