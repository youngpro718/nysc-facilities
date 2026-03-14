/**
 * FULL FIVE-AGENT AUDIT
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers all agents:
 *   Agent 1 — Cross-device UI / responsive interaction
 *   Agent 2 — Court employee practicality
 *   Agent 3 — Role-based profile testing
 *   Agent 4 — Design pattern observation
 *   Agent 5 — Master synthesis data gathering
 *
 * Runs on BOTH iPhone 13 (375×844) and Desktop Chrome (1280×800).
 * Set env vars:
 *   PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {
  getSession,
  injectSession,
  snap,
  bodyHealth,
  collectErrors,
  dismissInstallPrompt,
} from "./helpers/auth";
import * as fs from "fs";
import * as path from "path";

// ─── Credentials ──────────────────────────────────────────────────────────────
const EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "jduchate@gmail.com";
const PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "welcome";

const AUDIT_DIR = path.resolve("tests/e2e/screenshots/audit");

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _session: object | null = null;

async function ensureSession() {
  if (!_session) {
    _session = await getSession(EMAIL, PASSWORD);
    if (!_session) throw new Error("Could not obtain session — check credentials");
  }
  return _session;
}

async function go(page: Page, urlPath: string) {
  const s = await ensureSession();
  await injectSession(page, s);
  await page.goto(urlPath, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(2_000);
  await dismissInstallPrompt(page);
}

async function auditSnap(page: Page, name: string) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const file = path.join(AUDIT_DIR, `${name.replace(/[^a-z0-9\-_]/gi, "_").toLowerCase()}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[snap] ${file}`);
}

/** Returns bounding box diagnostics for a locator */
async function bbox(page: Page, sel: string) {
  return page.locator(sel).first().boundingBox().catch(() => null);
}

/** Checks if any element overflows the current viewport width */
async function checkOverflow(page: Page): Promise<string[]> {
  const vp = page.viewportSize()!;
  const overflows: string[] = [];
  const els = await page.locator("button, input, select, textarea, [role='button'], img, nav").all();
  for (const el of els) {
    const box = await el.boundingBox().catch(() => null);
    if (!box) continue;
    if (box.x + box.width > vp.width + 4) {
      const txt = (await el.textContent().catch(() => ""))?.trim().slice(0, 40) || "";
      overflows.push(`"${txt}" right=${Math.round(box.x + box.width)}px (vp=${vp.width})`);
    }
  }
  return overflows;
}

/** Returns the computed safe-area-inset-top value */
async function safeAreaTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.createElement("div");
    el.style.paddingTop = "env(safe-area-inset-top)";
    document.body.appendChild(el);
    const val = parseFloat(getComputedStyle(el).paddingTop) || 0;
    document.body.removeChild(el);
    return val;
  });
}

/** Check if a sticky header overlaps the page content */
async function headerOverlapCheck(page: Page): Promise<{ headerBottom: number; firstContentTop: number; overlaps: boolean }> {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const main = document.querySelector("main, [data-main], .main-content, #main");
    if (!header || !main) return { headerBottom: 0, firstContentTop: 0, overlaps: false };
    const hb = header.getBoundingClientRect().bottom;
    const ct = main.getBoundingClientRect().top;
    return { headerBottom: hb, firstContentTop: ct, overlaps: ct < hb - 2 };
  });
}

// ─── AGENT 1: Cross-Device UI / Responsive Interaction ────────────────────────

test.describe("AGENT 1 — Cross-Device UI Audit", () => {

  // ── 1a: Login Page ──────────────────────────────────────────────────────────
  test("A1-01: Login page — mobile layout & safe-area", async ({ page }) => {
    await page.goto("/login", { waitUntil: "load" });
    await page.waitForTimeout(1_500);
    const sat = await safeAreaTop(page);
    console.log(`[A1-01] safe-area-inset-top: ${sat}px`);
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-01] OVERFLOW:", overflows);
    const vp = page.viewportSize()!;
    console.log(`[A1-01] viewport: ${vp.width}×${vp.height}`);
    await auditSnap(page, "A1-01-login");
  });

  // ── 1b: Dashboard ───────────────────────────────────────────────────────────
  test("A1-02: Dashboard — layout, stats cards, scroll", async ({ page }) => {
    await go(page, "/");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-02] OVERFLOW on dashboard:", overflows);
    const overlap = await headerOverlapCheck(page);
    console.log(`[A1-02] Header overlap check: ${JSON.stringify(overlap)}`);
    await auditSnap(page, "A1-02-dashboard");

    // Scroll to bottom to check full-page scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await auditSnap(page, "A1-02-dashboard-bottom");
  });

  // ── 1c: Access & Assignments — BUG-2 person sheet ──────────────────────────
  test("A1-03: Access & Assignments — person sheet open/close", async ({ page }) => {
    await go(page, "/access-assignments");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-03] OVERFLOW:", overflows);
    await auditSnap(page, "A1-03-access-list");

    // Try to find and click a person card
    const cards = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: /[A-Z][a-z]+ [A-Z]/ });
    const cardCount = await cards.count();
    console.log(`[A1-03] Person cards found: ${cardCount}`);

    if (cardCount > 0) {
      const personName = await cards.first().textContent();
      console.log(`[A1-03] Clicking person: "${personName?.trim().slice(0, 40)}"`);
      await cards.first().click();
      await page.waitForTimeout(1_500);
      await auditSnap(page, "A1-03-access-sheet-open");

      const dialog = page.getByRole("dialog").first();
      const dialogVisible = await dialog.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`[A1-03] Sheet/dialog opened: ${dialogVisible}`);

      if (dialogVisible) {
        const box = await dialog.boundingBox();
        console.log(`[A1-03] Sheet bounding box: ${JSON.stringify(box)}`);
        const vp = page.viewportSize()!;
        if (box) {
          const behindNotch = box.y < 20;
          const overflowsRight = box.x + box.width > vp.width + 4;
          const overflowsBottom = box.y + box.height > vp.height + 10;
          console.log(`[A1-03] Sheet y=${box.y} (${behindNotch ? "⚠️ BEHIND NOTCH/TOP" : "OK"})`);
          console.log(`[A1-03] Sheet right overflow: ${overflowsRight}`);
          console.log(`[A1-03] Sheet taller than viewport: ${overflowsBottom}`);
        }

        // Check for close button
        const closeBtn = dialog.getByRole("button", { name: /close|dismiss|done|back|×/i }).first();
        const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
        console.log(`[A1-03] Close button visible: ${closeBtnVisible}`);
        if (!closeBtnVisible) {
          // Check if close X button exists anywhere
          const xBtn = page.locator('button[aria-label="Close"], button svg[data-lucide="x"], button .lucide-x').first();
          const xVisible = await xBtn.isVisible().catch(() => false);
          console.log(`[A1-03] X close button visible: ${xVisible}`);
        }

        // Try to scroll inside the sheet
        const scrollable = dialog.locator('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto');
        const scrollCount = await scrollable.count();
        console.log(`[A1-03] Scrollable areas inside sheet: ${scrollCount}`);

        // Try to close
        if (closeBtnVisible) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          const stillOpen = await dialog.isVisible().catch(() => false);
          console.log(`[A1-03] Sheet still open after close: ${stillOpen}`);
        } else {
          // Try pressing Escape
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
          const closedByEsc = !(await dialog.isVisible().catch(() => true));
          console.log(`[A1-03] Sheet closed by Escape: ${closedByEsc}`);
        }
        await auditSnap(page, "A1-03-access-sheet-after-close");
      }
    } else {
      // Try search
      const search = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill("a");
        await page.waitForTimeout(1_000);
        await auditSnap(page, "A1-03-access-search-results");
      }
    }
  });

  // ── 1d: Operations Page ─────────────────────────────────────────────────────
  test("A1-04: Operations — tabs, scroll, mobile layout", async ({ page }) => {
    await go(page, "/operations");
    await auditSnap(page, "A1-04-operations");

    // Check tab bar overflow
    const tabBar = page.locator('[role="tablist"]').first();
    const tabBarBox = await tabBar.boundingBox().catch(() => null);
    const vp = page.viewportSize()!;
    if (tabBarBox) {
      const overflows = tabBarBox.width > vp.width;
      console.log(`[A1-04] Tab bar width: ${tabBarBox.width}px, viewport: ${vp.width}px, overflows: ${overflows}`);
    }

    // Test each tab
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`[A1-04] Tabs found: ${tabCount}`);
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      const tabLabel = await tabs.nth(i).textContent();
      await tabs.nth(i).click();
      await page.waitForTimeout(600);
      await auditSnap(page, `A1-04-operations-tab-${i}-${tabLabel?.trim().toLowerCase().replace(/\s+/g, "-") || i}`);
    }
  });

  // ── 1e: Spaces page — room drawer ───────────────────────────────────────────
  test("A1-05: Spaces — room card tap, drawer behavior", async ({ page }) => {
    await go(page, "/spaces");
    await auditSnap(page, "A1-05-spaces-list");

    const firstCard = page.locator("h3, [class*='room'], [class*='space']").first();
    if (await firstCard.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForTimeout(1_000);
      const dialog = page.getByRole("dialog").first();
      const open = await dialog.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`[A1-05] Room drawer opened: ${open}`);
      if (open) {
        const box = await dialog.boundingBox();
        console.log(`[A1-05] Drawer box: ${JSON.stringify(box)}`);
        await auditSnap(page, "A1-05-spaces-drawer-open");
        // Check close
        const closeBtn = dialog.getByRole("button", { name: /close/i }).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        } else {
          await page.keyboard.press("Escape");
        }
        await page.waitForTimeout(500);
        await auditSnap(page, "A1-05-spaces-drawer-closed");
      }
    }
  });

  // ── 1f: Keys page ───────────────────────────────────────────────────────────
  test("A1-06: Keys — tabs, layout, mobile usability", async ({ page }) => {
    await go(page, "/keys");
    await auditSnap(page, "A1-06-keys");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-06] OVERFLOW on keys:", overflows);
  });

  // ── 1g: Supply Request page (user flow) ─────────────────────────────────────
  test("A1-07: Supply Order Page — layout, scroll, sticky footer", async ({ page }) => {
    await go(page, "/request/supplies");
    await auditSnap(page, "A1-07-supply-order-top");

    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-07] OVERFLOW:", overflows);

    const vp = page.viewportSize()!;

    // Check if sticky footer is present and within viewport
    const stickyFooter = page.locator('[class*="sticky bottom"], [class*="sticky-bottom"], footer').last();
    const footerBox = await stickyFooter.boundingBox().catch(() => null);
    if (footerBox) {
      console.log(`[A1-07] Footer box: ${JSON.stringify(footerBox)}`);
      const footerInView = footerBox.y + footerBox.height <= vp.height + 5;
      console.log(`[A1-07] Footer visible in viewport: ${footerInView}`);
    }

    // Scroll through the page
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(400);
    await auditSnap(page, "A1-07-supply-order-scrolled");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await auditSnap(page, "A1-07-supply-order-bottom");
  });

  // ── 1h: Admin supply requests page ──────────────────────────────────────────
  test("A1-08: Admin Supply Requests — BUG-1 layout check", async ({ page }) => {
    await go(page, "/admin/supply-requests");
    await auditSnap(page, "A1-08-admin-supply-requests");

    const overflows = await checkOverflow(page);
    if (overflows.length) {
      console.error(`[A1-08] BUG-1 CONFIRMED: ${overflows.length} overflow(s):\n  ` + overflows.join("\n  "));
    } else {
      console.log("[A1-08] No viewport overflows detected");
    }

    // Try clicking first request item
    const item = page.locator('[role="listitem"], tr, article').first();
    if (await item.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await item.click();
      await page.waitForTimeout(800);
      const dialog = page.getByRole("dialog").first();
      const open = await dialog.isVisible({ timeout: 3_000 }).catch(() => false);
      if (open) {
        const box = await dialog.boundingBox();
        const vp = page.viewportSize()!;
        console.log(`[A1-08] Detail dialog: ${JSON.stringify(box)}, vp=${vp.width}×${vp.height}`);
        await auditSnap(page, "A1-08-supply-request-detail");
      }
    }
  });

  // ── 1i: Court Operations page ───────────────────────────────────────────────
  test("A1-09: Court Operations — tab bar, scroll, layout", async ({ page }) => {
    await go(page, "/court-operations");
    await auditSnap(page, "A1-09-court-operations");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-09] OVERFLOW:", overflows);

    // Check sticky tab bar
    const tabBar = page.locator('[role="tablist"]').first();
    const tabBox = await tabBar.boundingBox().catch(() => null);
    const vp = page.viewportSize()!;
    if (tabBox) {
      console.log(`[A1-09] Tab bar: ${JSON.stringify(tabBox)}, vp width=${vp.width}`);
      const overflowsW = tabBox.width > vp.width + 4;
      console.log(`[A1-09] Tab bar overflows viewport: ${overflowsW}`);
    }

    // Test tab switching
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    for (let i = 0; i < Math.min(tabCount, 5); i++) {
      const label = await tabs.nth(i).textContent();
      await tabs.nth(i).click();
      await page.waitForTimeout(700);
      await auditSnap(page, `A1-09-court-ops-tab-${i}-${(label || "").trim().toLowerCase().replace(/\s+/g, "-")}`);
    }
  });

  // ── 1j: Navigation — bottom tab bar & mobile menu ───────────────────────────
  test("A1-10: Mobile navigation — bottom bar, hamburger, menu close", async ({ page }) => {
    await go(page, "/");

    // Check bottom tab bar
    const bottomBar = page.locator('nav[class*="bottom"], [class*="BottomTabBar"], [class*="bottom-tab"]').first();
    const bbVisible = await bottomBar.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`[A1-10] Bottom tab bar visible: ${bbVisible}`);
    if (bbVisible) {
      const box = await bottomBar.boundingBox();
      const vp = page.viewportSize()!;
      console.log(`[A1-10] Bottom bar box: ${JSON.stringify(box)}, viewport height=${vp.height}`);
    }
    await auditSnap(page, "A1-10-nav-bottom-bar");

    // Test hamburger / mobile menu
    const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], [data-tour*="mobile"]').first();
    const hVisible = await hamburger.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hVisible) {
      await hamburger.click();
      await page.waitForTimeout(500);
      await auditSnap(page, "A1-10-nav-mobile-menu-open");

      // Try to close it
      const closeMenuBtn = page.locator('[aria-label*="close" i]').first();
      if (await closeMenuBtn.isVisible().catch(() => false)) {
        await closeMenuBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(400);
      await auditSnap(page, "A1-10-nav-mobile-menu-closed");
    }
  });

  // ── 1k: Profile page ────────────────────────────────────────────────────────
  test("A1-11: Profile page — layout, tabs, form usability", async ({ page }) => {
    await go(page, "/profile");
    await auditSnap(page, "A1-11-profile");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-11] OVERFLOW on profile:", overflows);
  });

  // ── 1l: Users page ──────────────────────────────────────────────────────────
  test("A1-12: Users page — table layout, mobile usability", async ({ page }) => {
    await go(page, "/users");
    await auditSnap(page, "A1-12-users");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-12] OVERFLOW on users:", overflows);
    const vp = page.viewportSize()!;
    console.log(`[A1-12] Viewport: ${vp.width}×${vp.height}`);

    // Check table horizontal scroll
    const table = page.locator("table").first();
    if (await table.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const tableBox = await table.boundingBox();
      console.log(`[A1-12] Table box: ${JSON.stringify(tableBox)}, vp=${vp.width}`);
      if (tableBox && tableBox.width > vp.width) {
        console.error(`[A1-12] Table wider than viewport: ${tableBox.width}px > ${vp.width}px`);
      }
    }
  });

  // ── 1m: Admin Center ────────────────────────────────────────────────────────
  test("A1-13: Admin Center — layout and tabs", async ({ page }) => {
    await go(page, "/admin");
    await auditSnap(page, "A1-13-admin-center");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-13] OVERFLOW:", overflows);
  });

  // ── 1n: Notifications ───────────────────────────────────────────────────────
  test("A1-14: Notifications page", async ({ page }) => {
    await go(page, "/notifications");
    await auditSnap(page, "A1-14-notifications");
  });

  // ── 1o: Lighting page ───────────────────────────────────────────────────────
  test("A1-15: Lighting page — tabs, layout", async ({ page }) => {
    await go(page, "/lighting");
    await auditSnap(page, "A1-15-lighting");
  });

  // ── 1p: Court Live Grid ─────────────────────────────────────────────────────
  test("A1-16: Court Live Grid — layout, filter bar", async ({ page }) => {
    await go(page, "/court-live");
    await auditSnap(page, "A1-16-court-live");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-16] OVERFLOW:", overflows);

    // Check if any content is clipped by header
    const overlap = await headerOverlapCheck(page);
    console.log(`[A1-16] Header overlap: ${JSON.stringify(overlap)}`);
  });

  // ── 1q: Request Hub ─────────────────────────────────────────────────────────
  test("A1-17: Request Hub — options, navigation", async ({ page }) => {
    await go(page, "/request");
    await auditSnap(page, "A1-17-request-hub");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-17] OVERFLOW:", overflows);
  });

  // ── 1r: My Activity ─────────────────────────────────────────────────────────
  test("A1-18: My Activity page", async ({ page }) => {
    await go(page, "/my-activity");
    await auditSnap(page, "A1-18-my-activity");
  });

  // ── 1s: Tasks ───────────────────────────────────────────────────────────────
  test("A1-19: Tasks page", async ({ page }) => {
    await go(page, "/tasks");
    await auditSnap(page, "A1-19-tasks");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-19] OVERFLOW:", overflows);
  });

  // ── 1t: Inventory ───────────────────────────────────────────────────────────
  test("A1-20: Inventory Dashboard", async ({ page }) => {
    await go(page, "/inventory");
    await auditSnap(page, "A1-20-inventory");
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A1-20] OVERFLOW:", overflows);
  });

});

// ─── AGENT 2: Court Employee Practicality ─────────────────────────────────────

test.describe("AGENT 2 — Court Employee Practicality", () => {

  // ── 2a: Court Operations deep dive ──────────────────────────────────────────
  test("A2-01: Court Operations — full workflow as court staff", async ({ page }) => {
    await go(page, "/court-operations");
    const health = await bodyHealth(page);
    console.log(`[A2-01] Page health: ${JSON.stringify(health)}`);
    await auditSnap(page, "A2-01-court-ops-full");

    // Check Sessions tab content
    const sessionsTab = page.getByRole("tab", { name: /session/i });
    if (await sessionsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await sessionsTab.click();
      await page.waitForTimeout(800);
      await auditSnap(page, "A2-01-court-ops-sessions");

      // Check if "Add Session" or "Create Session" button exists
      const addBtn = page.getByRole("button", { name: /add session|create session|new session|schedule/i }).first();
      const hasAddBtn = await addBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`[A2-01] Add/Create Session button visible: ${hasAddBtn}`);

      if (hasAddBtn) {
        await addBtn.click();
        await page.waitForTimeout(800);
        await auditSnap(page, "A2-01-court-ops-create-session-form");

        const form = page.getByRole("dialog").first();
        const formVisible = await form.isVisible({ timeout: 3_000 }).catch(() => false);
        console.log(`[A2-01] Create session form/dialog: ${formVisible}`);

        if (formVisible) {
          // Check form fields
          const fields = await form.locator("input, select, textarea").all();
          console.log(`[A2-01] Form fields: ${fields.length}`);
          for (const f of fields) {
            const label = await f.getAttribute("placeholder") || await f.getAttribute("name") || await f.getAttribute("aria-label");
            console.log(`[A2-01] Field: ${label}`);
          }
          // Close form
          await page.keyboard.press("Escape");
        }
      }
    }

    // Check Assignments tab
    const assignTab = page.getByRole("tab", { name: /assign/i });
    if (await assignTab.isVisible().catch(() => false)) {
      await assignTab.click();
      await page.waitForTimeout(800);
      await auditSnap(page, "A2-01-court-ops-assignments");
    }

    // Check Staff/Absences tab
    const staffTab = page.getByRole("tab", { name: /staff|absence/i });
    if (await staffTab.isVisible().catch(() => false)) {
      await staffTab.click();
      await page.waitForTimeout(800);
      await auditSnap(page, "A2-01-court-ops-staff");
    }

    // Check Live status tab
    const liveTab = page.getByRole("tab", { name: /live/i });
    if (await liveTab.isVisible().catch(() => false)) {
      await liveTab.click();
      await page.waitForTimeout(800);
      await auditSnap(page, "A2-01-court-ops-live");
    }

    // Check Shutdowns tab
    const shutdownTab = page.getByRole("tab", { name: /shutdown|maint/i });
    if (await shutdownTab.isVisible().catch(() => false)) {
      await shutdownTab.click();
      await page.waitForTimeout(800);
      await auditSnap(page, "A2-01-court-ops-shutdowns");
    }
  });

  // ── 2b: Supply Request — full user flow ─────────────────────────────────────
  test("A2-02: Supply Request — as a court employee placing an order", async ({ page }) => {
    await go(page, "/request");
    await auditSnap(page, "A2-02-request-hub");

    // Find and click the Supplies option
    const suppliesBtn = page.getByRole("link", { name: /suppl/i }).first()
      .or(page.getByRole("button", { name: /suppl/i }).first())
      .or(page.locator('[href*="supplies"]').first());

    if (await suppliesBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await suppliesBtn.click();
      await page.waitForTimeout(1_000);
      await auditSnap(page, "A2-02-supply-order-page");
    } else {
      await go(page, "/request/supplies");
      await auditSnap(page, "A2-02-supply-order-direct");
    }

    // Look for item categories / catalog
    const items = await page.locator('[class*="item"], [class*="product"], [class*="catalog"], button, [role="button"]').all();
    console.log(`[A2-02] Interactive elements on supply page: ${items.length}`);

    // Try to add an item
    const addItemBtn = page.locator('button').filter({ hasText: /\+|add|select/i }).first();
    if (await addItemBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await addItemBtn.click();
      await page.waitForTimeout(500);
      await auditSnap(page, "A2-02-supply-item-added");
    }

    // Scroll to see order summary / submit
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await auditSnap(page, "A2-02-supply-order-bottom");

    // Check for submit button
    const submitBtn = page.getByRole("button", { name: /submit|place order|send request|confirm/i }).first();
    const submitVisible = await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`[A2-02] Submit button visible: ${submitVisible}`);
  });

  // ── 2c: My Supply Requests — viewing order status ───────────────────────────
  test("A2-03: My Supply Requests — viewing past orders", async ({ page }) => {
    await go(page, "/my-supply-requests");
    await auditSnap(page, "A2-03-my-supply-requests");
    const health = await bodyHealth(page);
    console.log(`[A2-03] Page health: ${JSON.stringify(health)}`);
  });

  // ── 2d: Operations — reporting an issue ─────────────────────────────────────
  test("A2-04: Operations — report issue workflow", async ({ page }) => {
    await go(page, "/operations");
    await auditSnap(page, "A2-04-operations-overview");

    // Find Report Issue button
    const reportBtn = page.getByRole("button", { name: /report issue|new issue|report/i }).first();
    const reportVisible = await reportBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`[A2-04] Report Issue button visible: ${reportVisible}`);

    if (reportVisible) {
      await reportBtn.click();
      await page.waitForTimeout(800);
      await auditSnap(page, "A2-04-report-issue-form");

      const form = page.getByRole("dialog").first();
      const formVisible = await form.isVisible({ timeout: 3_000 }).catch(() => false);
      if (formVisible) {
        const fields = await form.locator("input, select, textarea").all();
        console.log(`[A2-04] Issue form fields: ${fields.length}`);
        await page.keyboard.press("Escape");
      }
    }
  });

  // ── 2e: Dashboard from user perspective ─────────────────────────────────────
  test("A2-05: User Dashboard — role dashboard clarity", async ({ page }) => {
    await go(page, "/dashboard");
    await auditSnap(page, "A2-05-user-dashboard");
    const health = await bodyHealth(page);
    console.log(`[A2-05] User dashboard body: ${health.snippet}`);
  });

  // ── 2f: Keys — practical workflow ───────────────────────────────────────────
  test("A2-06: Keys — check-out key workflow", async ({ page }) => {
    await go(page, "/keys");
    await auditSnap(page, "A2-06-keys-overview");

    // Check for assign/issue key button
    const issueBtn = page.getByRole("button", { name: /assign|issue|check.?out|add key/i }).first();
    const issueVisible = await issueBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`[A2-06] Issue Key button visible: ${issueVisible}`);
  });

  // ── 2g: Court Live Grid — situational awareness ─────────────────────────────
  test("A2-07: Court Live Grid — situational awareness view", async ({ page }) => {
    await go(page, "/court-live");
    await page.waitForTimeout(2_000);
    await auditSnap(page, "A2-07-court-live-full");

    // Check filter controls
    const filters = await page.locator('button, select, input[type="text"]').all();
    console.log(`[A2-07] Filter/control elements: ${filters.length}`);

    // Check individual room cells
    const cells = await page.locator('[class*="cell"], [class*="grid"] > div, tr').count();
    console.log(`[A2-07] Grid cells/rows: ${cells}`);

    // Scroll full page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await auditSnap(page, "A2-07-court-live-scrolled");
  });

});

// ─── AGENT 3: Role-Based Profile Testing ──────────────────────────────────────

test.describe("AGENT 3 — Role-Based Access Audit", () => {

  // Admin has DevModePanel to switch roles — use it to inspect role views
  test("A3-01: Admin role — full page sweep with access audit", async ({ page }) => {
    await go(page, "/");
    await auditSnap(page, "A3-01-admin-dashboard");

    // Check admin-only nav items
    const navItems = await page.locator('nav a, [role="navigation"] a, [data-tour] a').all();
    const navTexts = [];
    for (const nav of navItems) {
      const txt = await nav.textContent().catch(() => "");
      navTexts.push(txt?.trim());
    }
    console.log(`[A3-01] Nav items visible to admin: ${navTexts.filter(Boolean).join(", ")}`);

    // Check admin-exclusive pages
    const adminPages = [
      "/users", "/admin", "/system-settings", "/lighting", "/court-live",
      "/access-assignments", "/admin/key-requests", "/admin/supply-requests"
    ];
    for (const p of adminPages) {
      await go(page, p);
      const redirectedToLogin = page.url().includes("/login");
      const health = await bodyHealth(page);
      console.log(`[A3-01] ${p}: redirected=${redirectedToLogin}, error=${health.hasErrorBoundary}`);
      await auditSnap(page, `A3-01-admin-page${p.replace(/\//g, "-")}`);
    }
  });

  // Use preview_role via localStorage to simulate CMC
  test("A3-02: CMC role preview — dashboard and court operations", async ({ page }) => {
    const s = await ensureSession();
    await page.addInitScript(({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
      localStorage.setItem("pwa-install-dismissed", "true");
      localStorage.setItem("preview_role", "cmc");
    }, { key: "app-auth", value: JSON.stringify(s) });

    await page.goto("/cmc-dashboard", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await dismissInstallPrompt(page);
    await auditSnap(page, "A3-02-cmc-dashboard");

    const health = await bodyHealth(page);
    console.log(`[A3-02] CMC dashboard: ${health.snippet}`);

    // Check court operations visibility
    await page.goto("/court-operations", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(1_500);
    await auditSnap(page, "A3-02-cmc-court-operations");

    // Check supply room
    await page.goto("/supply-room", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(1_500);
    await auditSnap(page, "A3-02-cmc-supply-room");

    const navItems = await page.locator('nav a, [role="navigation"] a').all();
    const navTexts = [];
    for (const nav of navItems) {
      const txt = await nav.textContent().catch(() => "");
      navTexts.push(txt?.trim());
    }
    console.log(`[A3-02] CMC nav items: ${navTexts.filter(Boolean).join(", ")}`);
  });

  // Preview court_officer role
  test("A3-03: Court Officer role preview — workflow check", async ({ page }) => {
    const s = await ensureSession();
    await page.addInitScript(({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
      localStorage.setItem("pwa-install-dismissed", "true");
      localStorage.setItem("preview_role", "court_officer");
    }, { key: "app-auth", value: JSON.stringify(s) });

    await page.goto("/court-officer-dashboard", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await dismissInstallPrompt(page);
    await auditSnap(page, "A3-03-court-officer-dashboard");

    const health = await bodyHealth(page);
    console.log(`[A3-03] Court Officer dashboard: ${health.snippet}`);

    // Key pages for court officer
    for (const p of ["/request", "/request/supplies", "/my-activity"]) {
      await page.goto(p, { waitUntil: "load", timeout: 30_000 });
      await page.waitForTimeout(1_000);
      await auditSnap(page, `A3-03-court-officer${p.replace(/\//g, "-")}`);
    }
  });

  // Preview court_aide role
  test("A3-04: Court Aide role preview — work center", async ({ page }) => {
    const s = await ensureSession();
    await page.addInitScript(({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
      localStorage.setItem("pwa-install-dismissed", "true");
      localStorage.setItem("preview_role", "court_aide");
    }, { key: "app-auth", value: JSON.stringify(s) });

    await page.goto("/court-aide-dashboard", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await dismissInstallPrompt(page);
    await auditSnap(page, "A3-04-court-aide-dashboard");

    const health = await bodyHealth(page);
    console.log(`[A3-04] Court Aide dashboard: ${health.snippet}`);

    // Check court aide work center
    await page.goto("/court-aide-dashboard", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(1_500);
    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A3-04] OVERFLOW:", overflows);

    // Supply room access check
    await page.goto("/supply-room", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(1_000);
    await auditSnap(page, "A3-04-court-aide-supply-room");
  });

  // Standard user role
  test("A3-05: Standard user role preview — basic access", async ({ page }) => {
    const s = await ensureSession();
    await page.addInitScript(({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
      localStorage.setItem("pwa-install-dismissed", "true");
      localStorage.setItem("preview_role", "user");
    }, { key: "app-auth", value: JSON.stringify(s) });

    await page.goto("/dashboard", { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await dismissInstallPrompt(page);
    await auditSnap(page, "A3-05-standard-user-dashboard");

    const health = await bodyHealth(page);
    console.log(`[A3-05] Standard user: ${health.snippet}`);

    const navItems = await page.locator('nav a, [role="navigation"] a').all();
    const navTexts = [];
    for (const nav of navItems) {
      const txt = await nav.textContent().catch(() => "");
      navTexts.push(txt?.trim());
    }
    console.log(`[A3-05] Standard user nav: ${navTexts.filter(Boolean).join(", ")}`);

    // Test that admin pages redirect
    for (const p of ["/users", "/admin", "/system-settings", "/access-assignments"]) {
      await page.goto(p, { waitUntil: "load", timeout: 30_000 });
      await page.waitForTimeout(1_000);
      const url = page.url();
      const blocked = url.includes("/login") || url.includes("dashboard") || url.includes("not-found") || !url.includes(p);
      console.log(`[A3-05] ${p}: blocked=${blocked}, url=${url}`);
    }

    await auditSnap(page, "A3-05-standard-user-after-admin-attempt");
  });

  // Check DevModePanel role switcher
  test("A3-06: DevModePanel — role switcher UI audit", async ({ page }) => {
    await go(page, "/");

    // Look for DevModePanel
    const devPanel = page.locator('[class*="DevMode"], [class*="dev-mode"], [data-testid*="dev"]').first();
    const devVisible = await devPanel.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`[A3-06] DevModePanel visible: ${devVisible}`);
    if (devVisible) {
      await auditSnap(page, "A3-06-devmode-panel");
    }

    // Check Users page for role management
    await go(page, "/users");
    await auditSnap(page, "A3-06-users-page");

    // Try to find role assignment UI
    const roleDropdown = page.locator('select[name*="role"], [aria-label*="role" i]').first();
    const roleVisible = await roleDropdown.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`[A3-06] Role dropdown visible in users: ${roleVisible}`);
  });

});

// ─── AGENT 4: Design Pattern Observations ─────────────────────────────────────

test.describe("AGENT 4 — Design Pattern Observations", () => {

  // ── 4a: Modal/Sheet sizing patterns ─────────────────────────────────────────
  test("A4-01: Sheet/modal sizing audit across major flows", async ({ page }) => {
    const vp = page.viewportSize()!;
    console.log(`[A4-01] Testing viewport: ${vp.width}×${vp.height}`);

    // Access & Assignments sheet
    await go(page, "/access-assignments");
    const card = page.locator('[class*="card"], [class*="Card"]').first();
    if (await card.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1_000);
      const dialog = page.getByRole("dialog").first();
      if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const box = await dialog.boundingBox();
        console.log(`[A4-01] Access sheet size: ${JSON.stringify(box)} — covers ${((box?.height || 0) / vp.height * 100).toFixed(0)}% of viewport height`);
        await auditSnap(page, "A4-01-access-sheet-sizing");
      }
    }

    // Spaces room drawer
    await go(page, "/spaces");
    const firstRoom = page.locator("h3").first();
    if (await firstRoom.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await firstRoom.click();
      await page.waitForTimeout(1_000);
      const dialog = page.getByRole("dialog").first();
      if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const box = await dialog.boundingBox();
        console.log(`[A4-01] Spaces drawer size: ${JSON.stringify(box)} — covers ${((box?.height || 0) / vp.height * 100).toFixed(0)}% of viewport height`);
        await auditSnap(page, "A4-01-spaces-drawer-sizing");
      }
    }
  });

  // ── 4b: Table patterns ───────────────────────────────────────────────────────
  test("A4-02: Table patterns — density, readability, mobile behavior", async ({ page }) => {
    const vp = page.viewportSize()!;

    // Court Live (dense table)
    await go(page, "/court-live");
    await page.waitForTimeout(1_500);
    const table = page.locator("table").first();
    if (await table.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const tbox = await table.boundingBox();
      console.log(`[A4-02] Court live table: ${JSON.stringify(tbox)}, vp=${vp.width}`);
      if (tbox && tbox.width > vp.width) {
        console.error(`[A4-02] Court live table overflows: ${tbox.width}px > ${vp.width}px`);
      }
    }
    await auditSnap(page, "A4-02-court-live-table-pattern");

    // Users table
    await go(page, "/users");
    const usersTable = page.locator("table").first();
    if (await usersTable.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const tbox = await usersTable.boundingBox();
      console.log(`[A4-02] Users table: ${JSON.stringify(tbox)}, vp=${vp.width}`);
    }
    await auditSnap(page, "A4-02-users-table-pattern");
  });

  // ── 4c: Bottom nav & action button patterns ──────────────────────────────────
  test("A4-03: Bottom nav and FAB pattern audit", async ({ page }) => {
    await go(page, "/");
    const vp = page.viewportSize()!;

    // Bottom tab bar
    const bottomNav = page.locator('[class*="BottomTabBar"], [class*="bottom-tab"], nav').last();
    if (await bottomNav.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const box = await bottomNav.boundingBox();
      console.log(`[A4-03] Bottom nav: y=${box?.y}, height=${box?.height}, vp_height=${vp.height}`);
      if (box) {
        const fromBottom = vp.height - (box.y + box.height);
        console.log(`[A4-03] Bottom nav distance from viewport bottom: ${fromBottom}px`);
      }
    }

    // FAB (Floating Action Button)
    const fab = page.locator('[class*="FloatingAction"], [class*="fab"], button[class*="fixed"]').first();
    if (await fab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const box = await fab.boundingBox();
      console.log(`[A4-03] FAB position: ${JSON.stringify(box)}`);
    }
    await auditSnap(page, "A4-03-bottom-nav-fab");
  });

  // ── 4d: Form patterns ────────────────────────────────────────────────────────
  test("A4-04: Form patterns — key request form (public)", async ({ page }) => {
    await page.goto("/forms/key-request", { waitUntil: "load" });
    await page.waitForTimeout(1_500);
    await auditSnap(page, "A4-04-key-request-form");

    const overflows = await checkOverflow(page);
    if (overflows.length) console.error("[A4-04] OVERFLOW in form:", overflows);

    const formInputs = await page.locator("input, select, textarea").count();
    console.log(`[A4-04] Key request form fields: ${formInputs}`);
  });

  // ── 4e: Status / badge patterns ─────────────────────────────────────────────
  test("A4-05: Status badge patterns — court live grid detail", async ({ page }) => {
    await go(page, "/court-live");
    await page.waitForTimeout(2_000);

    // Count status badges
    const badges = await page.locator('[class*="badge"], [class*="Badge"], [class*="status"]').count();
    console.log(`[A4-05] Status badges on court live: ${badges}`);
    await auditSnap(page, "A4-05-status-badges");
  });

  // ── 4f: Color theme patterns ─────────────────────────────────────────────────
  test("A4-06: Dark/light theme and color contrast", async ({ page }) => {
    await go(page, "/");
    await auditSnap(page, "A4-06-light-theme");

    // Toggle theme if toggle is available
    const themeToggle = page.locator('[data-tour="theme-toggle"] button, [aria-label*="theme" i]').first();
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      await auditSnap(page, "A4-06-dark-theme");
      // Toggle back
      await themeToggle.click();
    }
  });

  // ── 4g: Supply order product grid pattern ────────────────────────────────────
  test("A4-07: Supply order product catalog pattern", async ({ page }) => {
    await go(page, "/request/supplies");
    await page.waitForTimeout(1_500);
    await auditSnap(page, "A4-07-supply-catalog-pattern");

    const vp = page.viewportSize()!;
    // Check grid columns
    const gridContainer = page.locator('[class*="grid"]').first();
    if (await gridContainer.isVisible().catch(() => false)) {
      const box = await gridContainer.boundingBox();
      console.log(`[A4-07] Product grid: ${JSON.stringify(box)}, vp=${vp.width}`);
    }
  });

});

// ─── AGENT 5: Master Synthesis — Page Health Summary ──────────────────────────

test.describe("AGENT 5 — Master Synthesis Health Report", () => {

  test("A5-01: Full page health sweep — all routes", async ({ page }) => {
    test.setTimeout(180_000);

    const allPages = [
      { path: "/", label: "Admin Dashboard" },
      { path: "/spaces", label: "Spaces" },
      { path: "/operations", label: "Operations" },
      { path: "/keys", label: "Keys" },
      { path: "/access-assignments", label: "Access & Assignments" },
      { path: "/users", label: "Users" },
      { path: "/admin", label: "Admin Center" },
      { path: "/system-settings", label: "System Settings" },
      { path: "/lighting", label: "Lighting" },
      { path: "/court-live", label: "Court Live" },
      { path: "/admin/key-requests", label: "Admin Key Requests" },
      { path: "/admin/supply-requests", label: "Admin Supply Requests" },
      { path: "/admin/form-templates", label: "Admin Form Templates" },
      { path: "/admin/routing-rules", label: "Admin Routing Rules" },
      { path: "/court-operations", label: "Court Operations" },
      { path: "/inventory", label: "Inventory" },
      { path: "/request", label: "Request Hub" },
      { path: "/request/supplies", label: "Supply Order" },
      { path: "/my-activity", label: "My Activity" },
      { path: "/my-supply-requests", label: "My Supply Requests" },
      { path: "/notifications", label: "Notifications" },
      { path: "/tasks", label: "Tasks" },
      { path: "/profile", label: "Profile" },
      { path: "/supply-room", label: "Supply Room" },
      { path: "/dashboard", label: "User Dashboard" },
      { path: "/term-sheet", label: "Term Sheet" },
      { path: "/form-templates", label: "Form Templates" },
    ];

    const vp = page.viewportSize()!;
    type Row = {
      label: string; path: string; finalUrl: string;
      redirected: boolean; errors: number;
      hasObjectObject: boolean; hasErrorBoundary: boolean;
      overflowCount: number;
    };
    const report: Row[] = [];

    for (const { path: urlPath, label } of allPages) {
      const errs: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
      page.on("pageerror", (e) => errs.push(e.message));

      const s = await ensureSession();
      await injectSession(page, s);
      await page.goto(urlPath, { waitUntil: "load", timeout: 45_000 });
      await page.waitForTimeout(1_500);
      await dismissInstallPrompt(page);

      const finalUrl = page.url();
      const health = await bodyHealth(page);
      const overflows = await checkOverflow(page);

      report.push({
        label, path: urlPath,
        finalUrl: finalUrl.replace(/https?:\/\/[^/]+/, ""),
        redirected: finalUrl.includes("/login"),
        errors: errs.length,
        hasObjectObject: health.hasObjectObject,
        hasErrorBoundary: health.hasErrorBoundary,
        overflowCount: overflows.length,
      });

      if (overflows.length > 0) {
        console.error(`[A5-01] OVERFLOW on ${label}: ${overflows.join(", ")}`);
      }

      page.removeAllListeners("console");
      page.removeAllListeners("pageerror");
    }

    // Print master report
    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log(`║  MASTER PAGE HEALTH REPORT — Viewport: ${vp.width}×${vp.height}`.padEnd(63) + "║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    let passing = 0, overflowPages = 0;
    for (const r of report) {
      const issues: string[] = [];
      if (r.redirected) issues.push("REDIRECT→LOGIN");
      if (r.hasObjectObject) issues.push("[object Object]");
      if (r.hasErrorBoundary) issues.push("ERROR BOUNDARY");
      if (r.errors > 0) issues.push(`${r.errors} console error(s)`);
      if (r.overflowCount > 0) { issues.push(`${r.overflowCount} overflow(s)`); overflowPages++; }
      const ok = issues.length === 0;
      if (ok) passing++;
      console.log(
        `${ok ? "✅" : "❌"} ${r.label.padEnd(26)} ${r.finalUrl}${issues.length ? "\n     ⚠️  " + issues.join(" | ") : ""}`
      );
    }
    console.log("──────────────────────────────────────────────────────────────");
    console.log(`PASS: ${passing}/${report.length}  |  OVERFLOW PAGES: ${overflowPages}`);
    console.log("══════════════════════════════════════════════════════════════\n");
  });

  // Desktop comparison test
  test("A5-02: Desktop layout spot check — key pages", async ({ page }) => {
    const vp = page.viewportSize()!;
    console.log(`[A5-02] Running on: ${vp.width}×${vp.height}`);

    const pagesToCheck = [
      { path: "/", label: "dashboard" },
      { path: "/access-assignments", label: "access-assignments" },
      { path: "/court-operations", label: "court-operations" },
      { path: "/court-live", label: "court-live" },
      { path: "/admin/supply-requests", label: "supply-requests-admin" },
      { path: "/spaces", label: "spaces" },
      { path: "/operations", label: "operations" },
    ];

    for (const { path: urlPath, label } of pagesToCheck) {
      await go(page, urlPath);
      await auditSnap(page, `A5-02-desktop-${label}`);
      const overflows = await checkOverflow(page);
      if (overflows.length) console.error(`[A5-02] OVERFLOW on ${label}:`, overflows);

      // Sidebar check
      const sidebar = page.locator('[data-sidebar], aside, [class*="sidebar" i]').first();
      const sidebarVisible = await sidebar.isVisible({ timeout: 2_000 }).catch(() => false);
      console.log(`[A5-02] ${label}: sidebar visible=${sidebarVisible}`);
    }
  });
});
