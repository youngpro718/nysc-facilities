/**
 * Manual User-Facing QA Test Suite
 * NYSC Facilities Hub — http://localhost:5173
 *
 * Tests all major user-facing pages at both desktop (1280x800)
 * and mobile (375x667) viewports.
 *
 * Run:
 *   cd /Users/jduchate/Downloads/nysc-facilities-main
 *   npx playwright test --config tests/manual-playwright.config.ts --reporter=list 2>&1
 */

import { chromium, expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:5173";
const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
// JWT anon key found in tests/e2e/global-setup.ts
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";
const SUPABASE_STORAGE_KEY = "app-auth";

// Test accounts — prefer env vars
const TEST_EMAIL = process.env.PLAYWRIGHT_USER_EMAIL || process.env.PLAYWRIGHT_ADMIN_EMAIL || "";
const TEST_PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD || process.env.PLAYWRIGHT_ADMIN_PASSWORD || "";

// Screenshot output dir
const SCREENSHOT_DIR = path.join(__dirname, "..", "playwright-report", "manual-screenshots");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function screenshotPath(name: string): string {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  return path.join(SCREENSHOT_DIR, `${name.replace(/[^a-z0-9\-_]/gi, "_")}.png`);
}

const consoleErrorMap: Record<string, string[]> = {};
const pageErrorMap: Record<string, string[]> = {};

function attachListeners(page: Page, label: string): void {
  consoleErrorMap[label] = [];
  pageErrorMap[label] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrorMap[label].push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrorMap[label].push(err.message);
  });
}

async function injectSession(page: Page, session: object): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(
    ({ key, sessionData }) => {
      localStorage.setItem(key, JSON.stringify(sessionData));
    },
    { key: SUPABASE_STORAGE_KEY, sessionData: session }
  );
}

// ---------------------------------------------------------------------------
// Session acquisition
// ---------------------------------------------------------------------------

let _sharedSession: object | null = null;
let _sessionAcquired = false;

async function getSession(): Promise<object | null> {
  if (_sessionAcquired) return _sharedSession;
  _sessionAcquired = true;

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.warn("[QA] No credentials provided — visiting pages as unauthenticated.");
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error || !data.session) {
      console.error("[QA] Supabase sign-in failed:", error?.message ?? "no session");
      return null;
    }
    _sharedSession = data.session;
    console.log("[QA] Session acquired for:", TEST_EMAIL);
    return _sharedSession;
  } catch (e) {
    console.error("[QA] Session acquisition error:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page visit helper: desktop + mobile screenshot + error collection
// ---------------------------------------------------------------------------

interface VisitResult {
  url: string;
  finalUrl: string;
  title: string;
  consoleErrors: string[];
  pageErrors: string[];
  screenshotDesktop: string;
  screenshotMobile: string;
  loadedOk: boolean;
  errorBoundaryDetected: boolean;
  spinnerStuck: boolean;
  horizontalOverflow: boolean;
  notes: string[];
}

async function visitPage(
  session: object | null,
  route: string,
  label: string
): Promise<VisitResult> {
  const browser = await chromium.launch({ headless: true });
  const notes: string[] = [];
  let finalUrl = "";
  let title = "";
  let loadedOk = true;
  let errorBoundaryDetected = false;
  let spinnerStuck = false;
  let horizontalOverflow = false;

  // --- Desktop (1280x800) ---
  const dCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await dCtx.addInitScript(() => {
    localStorage.setItem("pwa-install-dismissed", "true");
  });
  const dPage = await dCtx.newPage();
  const dLabel = label + "_desktop";
  attachListeners(dPage, dLabel);

  if (session) {
    try { await injectSession(dPage, session); } catch { /* ignore */ }
  }

  try {
    await dPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 25000 });
    finalUrl = dPage.url();
    title = await dPage.title();

    const bodyText = await dPage.locator("body").innerText({ timeout: 5000 }).catch(() => "");

    // Error boundary detection
    if (
      bodyText.includes("Something went wrong") ||
      bodyText.includes("Unexpected error") ||
      bodyText.includes("Error Boundary") ||
      bodyText.includes("ChunkLoadError") ||
      bodyText.includes("Application error")
    ) {
      errorBoundaryDetected = true;
      notes.push("ERROR BOUNDARY DETECTED");
    }

    // 404 detection
    if (
      bodyText.toLowerCase().includes("page not found") ||
      (bodyText.includes("404") && !bodyText.includes("404 "))
    ) {
      notes.push("404/Not Found page shown");
    }

    // Stuck spinner detection (after networkidle, still spinning)
    const spinCount = await dPage.locator("svg.animate-spin").count();
    if (spinCount > 0) {
      spinnerStuck = true;
      notes.push(`Spinner still visible (${spinCount}x) after network idle`);
    }

    // Check for redirect to login (unauthenticated)
    if (finalUrl.includes("/login") && route !== "/login") {
      notes.push("Redirected to /login (auth required or not logged in)");
    }

  } catch (e: any) {
    loadedOk = false;
    notes.push(`Desktop load error: ${e.message?.slice(0, 120)}`);
  }

  const dScreenshot = screenshotPath(`${label}_desktop`);
  await dPage.screenshot({ path: dScreenshot, fullPage: true }).catch(() => {});
  await dCtx.close();

  // --- Mobile (375x667) ---
  const mCtx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  });
  await mCtx.addInitScript(() => {
    localStorage.setItem("pwa-install-dismissed", "true");
  });
  const mPage = await mCtx.newPage();
  const mLabel = label + "_mobile";
  attachListeners(mPage, mLabel);

  if (session) {
    try { await injectSession(mPage, session); } catch { /* ignore */ }
  }

  try {
    await mPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 25000 });

    // Horizontal overflow check
    const bodyScrollWidth = await mPage.evaluate(() => document.body.scrollWidth);
    const windowWidth = await mPage.evaluate(() => window.innerWidth);
    if (bodyScrollWidth > windowWidth + 5) {
      horizontalOverflow = true;
      notes.push(`Mobile horizontal overflow: body=${bodyScrollWidth}px > window=${windowWidth}px`);
    }
  } catch (e: any) {
    notes.push(`Mobile load error: ${e.message?.slice(0, 120)}`);
  }

  const mScreenshot = screenshotPath(`${label}_mobile`);
  await mPage.screenshot({ path: mScreenshot, fullPage: true }).catch(() => {});
  await mCtx.close();

  await browser.close();

  return {
    url: route,
    finalUrl,
    title,
    consoleErrors: [
      ...(consoleErrorMap[dLabel] ?? []),
      ...(consoleErrorMap[mLabel] ?? []),
    ],
    pageErrors: [
      ...(pageErrorMap[dLabel] ?? []),
      ...(pageErrorMap[mLabel] ?? []),
    ],
    screenshotDesktop: dScreenshot,
    screenshotMobile: mScreenshot,
    loadedOk,
    errorBoundaryDetected,
    spinnerStuck,
    horizontalOverflow,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Shared results accumulator
// ---------------------------------------------------------------------------

const qaResults: VisitResult[] = [];

function logResult(r: VisitResult): void {
  const icons = {
    errBoundary: r.errorBoundaryDetected ? "!! " : "",
    spinner: r.spinnerStuck ? "[SPINNER] " : "",
    overflow: r.horizontalOverflow ? "[OVERFLOW] " : "",
    consoleErr: r.consoleErrors.length > 0 ? `[${r.consoleErrors.length} console err] ` : "",
    pageErr: r.pageErrors.length > 0 ? `[${r.pageErrors.length} JS err] ` : "",
  };
  const flags = Object.values(icons).join("").trim();
  console.log(
    `  URL: ${r.url} → ${r.finalUrl}` +
    (flags ? `\n  Flags: ${flags}` : "") +
    (r.notes.length ? `\n  Notes: ${r.notes.join(" | ")}` : "") +
    (r.consoleErrors.length ? `\n  Console: ${r.consoleErrors.slice(0, 2).join(" || ")}` : "") +
    (r.pageErrors.length ? `\n  JS errors: ${r.pageErrors.slice(0, 2).join(" || ")}` : "")
  );
}

// ---------------------------------------------------------------------------
// Test: Login page (no auth needed)
// ---------------------------------------------------------------------------

test("01 - Login page renders", async ({ playwright }) => {
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 20000 });

  const title = await page.title();
  console.log(`[Login] Title: ${title}`);

  // Heading
  const headingVisible = await page.locator("h1").filter({ hasText: /NYSC Facilities Hub/i }).isVisible().catch(() => false);
  console.log(`[Login] Heading visible: ${headingVisible}`);

  // Auth notice
  const noticeVisible = await page.getByText(/authorized use only/i).isVisible().catch(() => false);
  console.log(`[Login] Auth notice visible: ${noticeVisible}`);

  // Email + password fields
  const emailVisible = await page.locator('input[type="email"]').isVisible().catch(() => false);
  const passwordVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
  console.log(`[Login] Email field: ${emailVisible}, Password field: ${passwordVisible}`);

  // Mobile screenshot
  await page.setViewportSize({ width: 375, height: 667 });
  const mobileOverflowCheck = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
  console.log(`[Login] Mobile horizontal overflow: ${mobileOverflowCheck}`);

  await page.screenshot({ path: screenshotPath("01_login_desktop"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });

  expect(headingVisible).toBe(true);
  expect(noticeVisible).toBe(true);
  expect(emailVisible).toBe(true);
  expect(passwordVisible).toBe(true);

  await ctx.close();
  await browser.close();
});

// ---------------------------------------------------------------------------
// Session check
// ---------------------------------------------------------------------------

test("02 - Session check", async () => {
  const session = await getSession();
  console.log(`[Session] Available: ${session !== null}`);
  if (!session) {
    console.log("[Session] Tests will proceed unauthenticated — pages may redirect to /login");
  }
});

// ---------------------------------------------------------------------------
// All pages — mass visit
// ---------------------------------------------------------------------------

const PAGES = [
  { route: "/dashboard",               label: "dashboard",               name: "Dashboard" },
  { route: "/request",                  label: "request_hub",             name: "Request Hub" },
  { route: "/request/help",             label: "request_help",            name: "Help Request Form" },
  { route: "/request/supplies",         label: "request_supplies",        name: "Supply Order Form" },
  { route: "/my-activity",              label: "my_activity",             name: "My Activity" },
  { route: "/my-requests",              label: "my_requests",             name: "My Requests" },
  { route: "/my-issues",                label: "my_issues",               name: "My Issues" },
  { route: "/my-supply-requests",       label: "my_supply_requests",      name: "My Supply Requests" },
  { route: "/supply-room",              label: "supply_room",             name: "Supply Room" },
  { route: "/court-operations",         label: "court_operations",        name: "Court Operations" },
  { route: "/cmc-dashboard",            label: "cmc_dashboard",           name: "CMC Dashboard" },
  { route: "/court-officer-dashboard",  label: "court_officer_dashboard", name: "Court Officer Dashboard" },
  { route: "/court-aide-dashboard",     label: "court_aide_dashboard",    name: "Court Aide Dashboard" },
  { route: "/inventory",                label: "inventory",               name: "Inventory" },
  { route: "/tasks",                    label: "tasks",                   name: "Tasks" },
  { route: "/profile",                  label: "profile",                 name: "Profile" },
  { route: "/term-sheet",               label: "term_sheet",              name: "Term Sheet" },
  { route: "/help",                     label: "help_center",             name: "Help Center" },
  { route: "/form-intake",              label: "form_intake",             name: "Form Intake" },
  { route: "/form-templates",           label: "form_templates",          name: "Form Templates" },
  { route: "/notifications",            label: "notifications",           name: "Notifications" },
];

for (const { route, label, name } of PAGES) {
  test(`03 - Page: ${name} (${route})`, async () => {
    console.log(`\n[Page: ${name}]`);
    const session = await getSession();
    const result = await visitPage(session, route, label);
    qaResults.push(result);
    logResult(result);
  });
}

// ---------------------------------------------------------------------------
// Redirect routes
// ---------------------------------------------------------------------------

const REDIRECT_TESTS = [
  { from: "/issues",      expectedFragment: "operations",        note: "issues → /operations" },
  { from: "/maintenance", expectedFragment: "operations",        note: "maintenance → /operations" },
  { from: "/settings",    expectedFragment: "profile",           note: "settings → /profile" },
  { from: "/occupants",   expectedFragment: "access-assignments", note: "occupants → /access-assignments" },
  { from: "/supplies",    expectedFragment: "tasks",             note: "supplies → /tasks" },
];

test("04 - Legacy redirects", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();

  if (session) {
    try { await injectSession(page, session); } catch { /* ignore */ }
  }

  console.log("\n[Legacy Redirects]");
  for (const check of REDIRECT_TESTS) {
    try {
      await page.goto(`${BASE_URL}${check.from}`, { waitUntil: "networkidle", timeout: 15000 });
      const finalUrl = page.url();
      const redirectedCorrectly = finalUrl.includes(check.expectedFragment);
      const wentToLogin = finalUrl.includes("/login");
      console.log(
        `  ${check.note}: ${check.from} → ${finalUrl}` +
        ` | Correct redirect: ${redirectedCorrectly ? "✓ YES" : "✗ NO"}` +
        (wentToLogin ? " | WENT TO LOGIN (auth gate)" : "")
      );
    } catch (e: any) {
      console.log(`  ${check.note}: ERROR - ${e.message?.slice(0, 80)}`);
    }
  }

  await ctx.close();
  await browser.close();
});

test("05 - 404 page behavior", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();

  if (session) {
    try { await injectSession(page, session); } catch { /* ignore */ }
  }

  console.log("\n[404 Page]");
  try {
    await page.goto(`${BASE_URL}/totally-made-up-route-xyz123`, { waitUntil: "networkidle", timeout: 15000 });
    const finalUrl = page.url();
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    const has404 = bodyText.toLowerCase().includes("not found") || bodyText.includes("404");
    const redirectedToLogin = finalUrl.includes("/login");
    console.log(`  URL: /totally-made-up-route-xyz123 → ${finalUrl}`);
    console.log(`  Shows 404/Not Found content: ${has404 ? "✓ YES" : "✗ NO"}`);
    console.log(`  Redirected to login: ${redirectedToLogin ? "YES (auth gate)" : "no"}`);
    await page.screenshot({ path: screenshotPath("05_404_page"), fullPage: true });
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

// ---------------------------------------------------------------------------
// Deep interaction tests
// ---------------------------------------------------------------------------

test("06 - Help form interaction and validation", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Help Form]");
  try {
    await page.goto(`${BASE_URL}/request/help`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("06a_help_form_initial"), fullPage: true });

      // Try empty submit to trigger validation
      const submitBtn = page.locator('button[type="submit"]').first();
      const btnVisible = await submitBtn.isVisible().catch(() => false);
      if (btnVisible) {
        await submitBtn.click();
        await page.waitForTimeout(800);
        const validationCount = await page.locator('[aria-invalid="true"], .text-destructive, [role="alert"]').count();
        console.log(`  Validation messages after empty submit: ${validationCount}`);
        await page.screenshot({ path: screenshotPath("06b_help_form_after_submit"), fullPage: true });
      } else {
        console.log(`  Submit button not found`);
      }

      // Count form fields
      const inputs = await page.locator("input:visible, textarea:visible, select:visible").count();
      console.log(`  Visible form fields: ${inputs}`);
    } else {
      console.log(`  Redirected to login — auth required`);
    }

    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top errors: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("07 - Supply form interaction and validation", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Supply Form]");
  try {
    await page.goto(`${BASE_URL}/request/supplies`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("07a_supply_form_initial"), fullPage: true });

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(800);
        const validationCount = await page.locator('[aria-invalid="true"], .text-destructive, [role="alert"]').count();
        console.log(`  Validation messages after empty submit: ${validationCount}`);
        await page.screenshot({ path: screenshotPath("07b_supply_form_after_submit"), fullPage: true });
      }

      const inputs = await page.locator("input:visible, textarea:visible, select:visible").count();
      console.log(`  Visible form fields: ${inputs}`);
    } else {
      console.log(`  Redirected to login — auth required`);
    }

    console.log(`  Console errors: ${errors.length}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("08 - My Activity tabs", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[My Activity Tabs]");
  try {
    await page.goto(`${BASE_URL}/my-activity`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`  Tab count: ${tabCount}`);

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabText = (await tab.textContent() ?? `Tab ${i}`).trim();
        const isDisabled = await tab.getAttribute("disabled").catch(() => null);
        const ariaDisabled = await tab.getAttribute("aria-disabled").catch(() => null);
        await tab.click().catch(() => {});
        await page.waitForTimeout(600);
        const tabpanel = page.locator('[role="tabpanel"]');
        const panelContent = await tabpanel.innerText({ timeout: 3000 }).catch(() => "");
        const emptyState = panelContent.toLowerCase().includes("no ") || panelContent.includes("empty") || panelContent.length < 20;
        console.log(
          `  Tab "${tabText}": disabled=${isDisabled ?? ariaDisabled ?? "no"}, empty state=${emptyState}`
        );
        await page.screenshot({ path: screenshotPath(`08_my_activity_tab_${i}`), fullPage: true });
      }
    } else {
      console.log(`  Redirected to login — auth required`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("09 - Profile page tabs", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Profile Tabs]");
  try {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("09a_profile_initial"), fullPage: true });

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`  Tab count: ${tabCount}`);

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabText = (await tab.textContent() ?? `Tab ${i}`).trim();
        await tab.click().catch(() => {});
        await page.waitForTimeout(600);
        const panelText = await page.locator('[role="tabpanel"]').innerText({ timeout: 3000 }).catch(() => "");
        const hasContent = panelText.length > 30;
        console.log(`  Tab "${tabText}": has content=${hasContent}`);
        await page.screenshot({ path: screenshotPath(`09b_profile_tab_${i}_${tabText.replace(/\s+/g, "_")}`), fullPage: true });
      }
    } else {
      console.log(`  Redirected to login`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("10 - Dashboard stat cards and mobile overflow", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Dashboard]");
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("10a_dashboard_desktop"), fullPage: true });

      // Count cards
      const cards = await page.locator('[class*="card"]').count();
      console.log(`  Card elements (approx): ${cards}`);

      // Count stats-like numbers
      const bigNumbers = await page.locator('p, span, div').filter({ hasText: /^\d+$/ }).count();
      console.log(`  Numeric stat values visible: ${bigNumbers}`);

      // Mobile check
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(400);
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const winWidth = await page.evaluate(() => window.innerWidth);
      console.log(`  Mobile overflow: ${bodyScrollWidth > winWidth + 5 ? `YES (${bodyScrollWidth} > ${winWidth})` : "none"}`);
      await page.screenshot({ path: screenshotPath("10b_dashboard_mobile"), fullPage: true });
    } else {
      console.log(`  Redirected to login`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 3).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("11 - Inventory search and tabs", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Inventory]");
  try {
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("11a_inventory_initial"), fullPage: true });

      // Search
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill("paper");
        await page.waitForTimeout(600);
        await page.screenshot({ path: screenshotPath("11b_inventory_search_paper"), fullPage: true });
        console.log(`  Search input: found and used`);
        await searchInput.clear();
      } else {
        console.log(`  Search input: not found`);
      }

      // Tabs
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`  Tab count: ${tabCount}`);
      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        const tabText = (await tabs.nth(i).textContent() ?? `Tab ${i}`).trim();
        await tabs.nth(i).click().catch(() => {});
        await page.waitForTimeout(400);
        console.log(`  Tab "${tabText}" clicked`);
      }
    } else {
      console.log(`  Redirected to login`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("12 - Tasks tabs and empty states", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Tasks]");
  try {
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("12a_tasks_initial"), fullPage: true });

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`  Tab count: ${tabCount}`);

      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        const tabText = (await tabs.nth(i).textContent() ?? `Tab ${i}`).trim();
        await tabs.nth(i).click().catch(() => {});
        await page.waitForTimeout(400);
        const panelText = await page.locator('[role="tabpanel"]').innerText({ timeout: 3000 }).catch(() => "");
        const empty = panelText.toLowerCase().includes("no task") || panelText.toLowerCase().includes("no item") || panelText.length < 30;
        console.log(`  Tab "${tabText}": empty state=${empty}`);
        await page.screenshot({ path: screenshotPath(`12b_tasks_tab_${i}`), fullPage: true });
      }
    } else {
      console.log(`  Redirected to login`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("13 - Court Operations tabs", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Court Operations]");
  try {
    await page.goto(`${BASE_URL}/court-operations`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("13a_court_ops_initial"), fullPage: true });

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`  Tab count: ${tabCount}`);

      for (let i = 0; i < Math.min(tabCount, 6); i++) {
        const tabText = (await tabs.nth(i).textContent() ?? `Tab ${i}`).trim();
        await tabs.nth(i).click().catch(() => {});
        await page.waitForTimeout(500);
        await page.screenshot({ path: screenshotPath(`13b_court_ops_tab_${i}`), fullPage: true });
        console.log(`  Tab "${tabText}" clicked`);
      }

      const buttons = await page.locator("button:visible").count();
      console.log(`  Visible action buttons: ${buttons}`);
    } else {
      console.log(`  Redirected to login`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

test("14 - Supply Room tabs", async ({ playwright }) => {
  const session = await getSession();
  const browser = await playwright.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem("pwa-install-dismissed", "true"); });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  if (session) { try { await injectSession(page, session); } catch { /* ignore */ } }

  console.log("\n[Supply Room]");
  try {
    await page.goto(`${BASE_URL}/supply-room`, { waitUntil: "networkidle", timeout: 20000 });
    const url = page.url();
    console.log(`  Landed at: ${url}`);

    if (!url.includes("/login")) {
      await page.screenshot({ path: screenshotPath("14a_supply_room_initial"), fullPage: true });

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`  Tab count: ${tabCount}`);

      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        const tabText = (await tabs.nth(i).textContent() ?? `Tab ${i}`).trim();
        await tabs.nth(i).click().catch(() => {});
        await page.waitForTimeout(400);
        console.log(`  Tab "${tabText}" clicked`);
      }
    } else {
      console.log(`  Redirected to login`);
    }
    console.log(`  Console errors: ${errors.length}`);
    if (errors.length) console.log(`  Top: ${errors.slice(0, 2).join(" | ")}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.slice(0, 100)}`);
  }

  await ctx.close();
  await browser.close();
});

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------

test("99 - Final QA Summary", async () => {
  console.log("\n");
  console.log("=".repeat(72));
  console.log("NYSC FACILITIES HUB — QA REPORT SUMMARY");
  console.log(`Run: ${new Date().toISOString()}`);
  console.log("=".repeat(72));

  if (qaResults.length === 0) {
    console.log("No page-visit results collected.");
    return;
  }

  const errorBoundaries = qaResults.filter(r => r.errorBoundaryDetected).map(r => r.url);
  const stuckSpinners = qaResults.filter(r => r.spinnerStuck).map(r => r.url);
  const overflows = qaResults.filter(r => r.horizontalOverflow).map(r => r.url);
  const withConsoleErrs = qaResults.filter(r => r.consoleErrors.length > 0);
  const withPageErrs = qaResults.filter(r => r.pageErrors.length > 0);
  const authGated = qaResults.filter(r => r.finalUrl.includes("/login") && r.url !== "/login").map(r => r.url);
  const loaded = qaResults.filter(r => r.loadedOk && !r.finalUrl.includes("/login")).map(r => r.url);

  console.log(`\nPages tested:         ${qaResults.length}`);
  console.log(`Pages loaded OK:       ${loaded.length}`);
  console.log(`Auth-gated (→ /login): ${authGated.length}${authGated.length ? " | " + authGated.join(", ") : ""}`);
  console.log(`Error boundaries:      ${errorBoundaries.length > 0 ? errorBoundaries.join(", ") : "none"}`);
  console.log(`Stuck spinners:        ${stuckSpinners.length > 0 ? stuckSpinners.join(", ") : "none"}`);
  console.log(`Mobile overflow:       ${overflows.length > 0 ? overflows.join(", ") : "none"}`);
  console.log(`Pages with JS errors:  ${withPageErrs.length > 0 ? withPageErrs.map(r => r.url).join(", ") : "none"}`);
  console.log(`Pages with console err:${withConsoleErrs.length > 0 ? withConsoleErrs.map(r => r.url).join(", ") : "none"}`);

  if (withConsoleErrs.length > 0) {
    console.log("\n-- Console Errors (top 3 per page) --");
    for (const r of withConsoleErrs.slice(0, 8)) {
      console.log(`  [${r.url}] ${r.consoleErrors.slice(0, 3).join(" | ")}`);
    }
  }

  if (withPageErrs.length > 0) {
    console.log("\n-- JavaScript Page Errors --");
    for (const r of withPageErrs.slice(0, 8)) {
      console.log(`  [${r.url}] ${r.pageErrors.slice(0, 2).join(" | ")}`);
    }
  }

  if (qaResults.some(r => r.notes.length > 0)) {
    console.log("\n-- Notable Issues Per Page --");
    for (const r of qaResults.filter(r => r.notes.length > 0)) {
      console.log(`  [${r.url}] ${r.notes.join(" | ")}`);
    }
  }

  console.log(`\nScreenshots: ${SCREENSHOT_DIR}`);
  console.log("=".repeat(72));
});
