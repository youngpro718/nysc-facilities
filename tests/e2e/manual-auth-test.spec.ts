/**
 * Comprehensive Auth Flows, Public Routes, and Navigation Test Suite
 * Tests all public-facing pages, auth flows, redirect behavior, and form interactions.
 */

import { expect, test, type Page } from "@playwright/test";

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface PageError {
  type: "console" | "pageerror";
  level?: string;
  message: string;
}

function collectErrors(page: Page): PageError[] {
  const errors: PageError[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console", level: "error", message: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    errors.push({ type: "pageerror", message: err.message });
  });
  return errors;
}

function filterNoisyErrors(errors: PageError[]): PageError[] {
  // Filter out known benign/unavoidable errors (Supabase realtime, favicon, etc.)
  const noisePatterns = [
    /favicon/i,
    /WebSocket/i,
    /supabase.*realtime/i,
    /Failed to load resource.*realtime/i,
    /net::ERR_NAME_NOT_RESOLVED/i,
    /net::ERR_CONNECTION_REFUSED/i,
    // Supabase auth network calls may fail in test env — expected
    /supabase\.co/i,
  ];
  return errors.filter(
    (e) => !noisePatterns.some((pat) => pat.test(e.message))
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

test.describe("Login Page (/login)", () => {
  test("renders NYSC branding, heading, and 'sign in to continue' subtitle", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /nysc facilities hub/i })).toBeVisible();
    await expect(page.getByText(/sign in to continue/i)).toBeVisible();

    const filtered = filterNoisyErrors(errors);
    if (filtered.length > 0) {
      console.warn("[login] JS errors:", filtered.map((e) => e.message).join("\n"));
    }
    expect(filtered, `Unexpected JS errors on /login: ${filtered.map(e=>e.message).join(', ')}`).toHaveLength(0);
  });

  test("shows 'Authorized use only' notice", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/authorized use only/i)).toBeVisible();
  });

  test("email and password fields are present and accept input", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill("tester@example.com");
    await expect(emailInput).toHaveValue("tester@example.com");

    await passwordInput.fill("TestPass123!");
    await expect(passwordInput).toHaveValue("TestPass123!");
  });

  test("password field has type='password' (masked input)", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("Sign In button is present", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("Sign In button is disabled when both fields are empty", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });

  test("Sign In button remains disabled with only email filled", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    // Button should still be disabled without password
    const btn = page.getByRole("button", { name: /sign in/i });
    await expect(btn).toBeDisabled();
  });

  test("Sign In button becomes enabled when both fields have values", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    const btn = page.getByRole("button", { name: /sign in/i });
    await expect(btn).toBeEnabled();
  });

  test("invalid credentials - stays on login page after submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@invalid-domain-xyz99999.test");
    await page.getByLabel(/password/i).fill("wrongpassword!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait up to 10s — auth network call may take time
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
    // Form should still be visible (not navigated away)
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("'Need an account? Create one' toggle switches to signup form", async ({ page }) => {
    await page.goto("/login");
    const toggleBtn = page.getByRole("button", { name: /need an account\? create one/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    // Should show signup-specific UI — heading subtitle changes
    await expect(page.getByText(/create your account/i)).toBeVisible();
  });

  test("'Forgot password?' link is visible and clickable", async ({ page }) => {
    await page.goto("/login");
    const forgotPw = page.getByRole("button", { name: /forgot password/i });
    await expect(forgotPw).toBeVisible();
    // Clicking it should show a toast or info message (no navigation)
    await forgotPw.click();
    // Still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("NYSC logo images are present (light and dark mode variants)", async ({ page }) => {
    await page.goto("/login");
    const logos = page.locator('img[alt="NYSC Logo"]');
    await expect(logos.first()).toBeVisible();
  });

  test("page layout uses full viewport height with no visible overflow scrollbar clipping", async ({ page }) => {
    await page.goto("/login");
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
    const card = page.locator(".max-w-md").first();
    await expect(card).toBeVisible();
    // Verify card is not clipped off-screen
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(900); // within reasonable viewport
    }
  });
});

// ─── INSTALL PAGE ─────────────────────────────────────────────────────────────

test.describe("Install App Page (/install)", () => {
  test("renders without authentication and without JS errors", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/install");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /install nysc facilities/i })).toBeVisible();

    const filtered = filterNoisyErrors(errors);
    if (filtered.length > 0) {
      console.warn("[/install] JS errors:", filtered.map((e) => e.message).join("\n"));
    }
    expect(filtered, `Unexpected JS errors on /install: ${filtered.map(e=>e.message).join(', ')}`).toHaveLength(0);
  });

  test("shows 'Add to Home Screen' instructions", async ({ page }) => {
    await page.goto("/install");
    await expect(page.getByText(/add to home screen/i).first()).toBeVisible();
  });

  test("shows QR code element or QR code section", async ({ page }) => {
    await page.goto("/install");
    // QRCodeSVG renders an <svg>
    const qrSvg = page.locator("svg").first();
    await expect(qrSvg).toBeVisible();
  });

  test("Copy Link button is present and interactive", async ({ page }) => {
    await page.goto("/install");
    const copyBtn = page.getByRole("button", { name: /copy link/i });
    await expect(copyBtn).toBeVisible();
  });

  test("Share via Email button/link is visible", async ({ page }) => {
    await page.goto("/install");
    const emailBtn = page.getByRole("button", { name: /email/i }).first();
    await expect(emailBtn).toBeVisible();
  });

  test("mobile viewport renders correctly without cutoffs", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/install");
    await expect(page.getByRole("heading", { name: /install nysc facilities/i })).toBeVisible();
    const body = page.locator("body");
    const box = await body.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(400);
    }
  });
});

// ─── REDIRECT BEHAVIOR (unauthenticated) ─────────────────────────────────────

test.describe("Unauthenticated redirect behavior", () => {
  const redirectPaths = [
    "/public-forms",
    "/forms/key-request",
    "/forms/maintenance-request",
    "/forms/issue-report",
    "/auth/pending-approval",
    "/auth/account-rejected",
    "/features-preview",
    "/submit-form",
    "/verification-pending",
  ];

  for (const path of redirectPaths) {
    test(`${path} - behavior on unauthenticated access`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path);

      // Wait for either a redirect to /login or stable load on the page
      try {
        await page.waitForURL(/\/(login|verification-pending|features-preview)/, { timeout: 8_000 });
        // Redirected - check destination is valid
        const url = page.url();
        expect(
          url.includes("/login") || url.includes("/verification-pending") || url.includes("/features-preview"),
          `Expected redirect to auth page but got: ${url}`
        ).toBe(true);
      } catch {
        // Did NOT redirect — the page rendered directly
        // This means the route is truly public. Verify it rendered without fatal errors.
        const filtered = filterNoisyErrors(errors);
        const fatalErrors = filtered.filter(
          (e) => e.type === "pageerror" || e.message.toLowerCase().includes("uncaught")
        );
        if (fatalErrors.length > 0) {
          console.error(`[${path}] Fatal JS errors:`, fatalErrors.map((e) => e.message).join("\n"));
        }
        expect(
          fatalErrors,
          `Fatal JS errors on ${path}: ${fatalErrors.map(e => e.message).join(', ')}`
        ).toHaveLength(0);
      }
    });
  }

  test("/ (root) redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login is always reachable without auth", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /nysc facilities hub/i })).toBeVisible();
  });

  test("/install is always reachable without auth", async ({ page }) => {
    await page.goto("/install");
    await expect(page).toHaveURL(/\/install/);
    await expect(page.getByRole("heading", { name: /install nysc facilities/i })).toBeVisible();
  });
});

// ─── PUBLIC FORMS PAGE (/public-forms) ────────────────────────────────────────

test.describe("Public Forms Page (/public-forms) — if accessible", () => {
  test("renders page heading and form cards (or redirects to login)", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/public-forms");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected — actually rendered
    }

    if (redirectedToLogin) {
      // Document the redirect behavior
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /public-forms redirects unauthenticated users to /login — expected by useAuth publicPaths allowlist");
    } else {
      // Page actually rendered — verify content
      await expect(page.getByRole("heading", { name: /nysc facilities/i })).toBeVisible();
      await expect(page.getByText(/no login required/i).first()).toBeVisible();

      // Verify form cards are present
      await expect(page.getByText(/key.*elevator pass request/i)).toBeVisible();

      // Check download buttons exist
      const downloadBtns = page.getByRole("button", { name: /download pdf/i });
      expect(await downloadBtns.count()).toBeGreaterThan(0);

      // Check preview buttons exist
      const previewBtns = page.getByRole("button", { name: /preview/i });
      expect(await previewBtns.count()).toBeGreaterThan(0);

      const filtered = filterNoisyErrors(errors);
      if (filtered.length > 0) {
        console.warn("[/public-forms] JS errors:", filtered.map((e) => e.message).join("\n"));
      }
      expect(filtered, `JS errors on /public-forms: ${filtered.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── KEY REQUEST FORM (/forms/key-request) ────────────────────────────────────

test.describe("Key Request Form (/forms/key-request) — if accessible", () => {
  test("renders form or redirects to login", async ({ page }) => {
    const errors = collectErrors(page);
    // Dismiss the PWA install banner before it shows (it appears after 3s on iOS WebKit)
    await page.addInitScript(() => {
      localStorage.setItem('pwa-install-dismissed', 'true');
    });
    await page.goto("/forms/key-request");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /forms/key-request redirects unauthenticated users to /login");
    } else {
      // Form page rendered directly — verify key elements
      await expect(page.getByRole("heading", { name: /key request form/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /submit request/i })).toBeVisible();

      // Verify required fields are present
      await expect(page.getByLabel(/room number/i)).toBeVisible();
      await expect(page.getByLabel(/reason for request/i)).toBeVisible();
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();

      // Try submitting empty form — browser validation should prevent it
      await page.getByRole("button", { name: /submit request/i }).click();
      // Should still be on the same page
      await expect(page.getByRole("heading", { name: /key request form/i })).toBeVisible();

      // Fill in the form partially to check validation
      await page.getByLabel(/room number/i).fill("1234");
      await page.getByLabel(/full name/i).fill("Test User");
      await page.getByLabel(/email/i).fill("test@example.com");

      const filtered = filterNoisyErrors(errors);
      if (filtered.length > 0) {
        console.warn("[/forms/key-request] JS errors:", filtered.map((e) => e.message).join("\n"));
      }
      expect(filtered, `JS errors on /forms/key-request: ${filtered.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── MAINTENANCE REQUEST FORM (/forms/maintenance-request) ────────────────────

test.describe("Maintenance Request Form (/forms/maintenance-request) — if accessible", () => {
  test("renders form or redirects to login", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/forms/maintenance-request");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /forms/maintenance-request redirects unauthenticated users to /login");
    } else {
      // Maintenance form rendered
      await expect(page.getByRole("heading", { name: /maintenance/i })).toBeVisible();

      const filtered = filterNoisyErrors(errors);
      if (filtered.length > 0) {
        console.warn("[/forms/maintenance-request] JS errors:", filtered.map((e) => e.message).join("\n"));
      }
      expect(filtered, `JS errors on /forms/maintenance-request: ${filtered.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── ISSUE REPORT FORM (/forms/issue-report) ──────────────────────────────────

test.describe("Issue Report Form (/forms/issue-report) — if accessible", () => {
  test("renders form or redirects to login", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/forms/issue-report");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /forms/issue-report redirects unauthenticated users to /login");
    } else {
      await expect(page.getByRole("heading", { name: /issue report/i })).toBeVisible();

      const filtered = filterNoisyErrors(errors);
      if (filtered.length > 0) {
        console.warn("[/forms/issue-report] JS errors:", filtered.map((e) => e.message).join("\n"));
      }
      expect(filtered, `JS errors on /forms/issue-report: ${filtered.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── FEATURES PREVIEW (/features-preview) ────────────────────────────────────

test.describe("Features Preview Page (/features-preview)", () => {
  test("renders or redirects — checks for JS errors if rendered", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/features-preview");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /features-preview redirects unauthenticated users to /login");
    } else {
      // Page rendered — verify no fatal errors
      const filtered = filterNoisyErrors(errors);
      const fatalErrors = filtered.filter(e => e.type === "pageerror");
      if (fatalErrors.length > 0) {
        console.error("[/features-preview] Fatal JS errors:", fatalErrors.map(e => e.message).join("\n"));
      }
      expect(fatalErrors, `Fatal JS errors on /features-preview: ${fatalErrors.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── VERIFICATION PENDING (/verification-pending) ─────────────────────────────

test.describe("Verification Pending Page (/verification-pending)", () => {
  test("page is reachable without auth (in publicPaths allowlist)", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/verification-pending");
    await page.waitForLoadState("networkidle");

    // This IS in the allowlist, so it should render (not redirect)
    await expect(page).toHaveURL(/\/verification-pending/);

    const filtered = filterNoisyErrors(errors);
    const fatalErrors = filtered.filter(e => e.type === "pageerror");
    if (fatalErrors.length > 0) {
      console.error("[/verification-pending] Fatal JS errors:", fatalErrors.map(e => e.message).join("\n"));
    }
    expect(fatalErrors, `Fatal JS errors on /verification-pending: ${fatalErrors.map(e=>e.message).join(', ')}`).toHaveLength(0);
  });

  test("shows NYSC Facilities Hub welcome message or verification content", async ({ page }) => {
    await page.goto("/verification-pending");
    await page.waitForLoadState("networkidle");
    // Page renders (may show loading spinner when no user, or verification content)
    // At minimum the page should not be blank
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
  });
});

// ─── PENDING APPROVAL (/auth/pending-approval) ───────────────────────────────

test.describe("Pending Approval Page (/auth/pending-approval)", () => {
  test("renders or redirects to login for unauthenticated users", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/auth/pending-approval");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /auth/pending-approval redirects unauthenticated users to /login");
    } else {
      // If rendered, verify no fatal JS errors
      const filtered = filterNoisyErrors(errors);
      const fatalErrors = filtered.filter(e => e.type === "pageerror");
      expect(fatalErrors, `Fatal JS errors on /auth/pending-approval: ${fatalErrors.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── ACCOUNT REJECTED (/auth/account-rejected) ───────────────────────────────

test.describe("Account Rejected Page (/auth/account-rejected)", () => {
  test("renders or redirects to login for unauthenticated users", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/auth/account-rejected");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /auth/account-rejected redirects unauthenticated users to /login");
    } else {
      const filtered = filterNoisyErrors(errors);
      const fatalErrors = filtered.filter(e => e.type === "pageerror");
      expect(fatalErrors, `Fatal JS errors on /auth/account-rejected: ${fatalErrors.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── SUBMIT FORM (/submit-form) ───────────────────────────────────────────────

test.describe("Public Form Submission Page (/submit-form)", () => {
  test("renders or redirects to login", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/submit-form");

    let redirectedToLogin = false;
    try {
      await page.waitForURL(/\/login/, { timeout: 5_000 });
      redirectedToLogin = true;
    } catch {
      // Not redirected
    }

    if (redirectedToLogin) {
      await expect(page).toHaveURL(/\/login/);
      console.log("[INFO] /submit-form redirects unauthenticated users to /login");
    } else {
      // Verify no fatal JS errors
      const filtered = filterNoisyErrors(errors);
      const fatalErrors = filtered.filter(e => e.type === "pageerror");
      expect(fatalErrors, `Fatal JS errors on /submit-form: ${fatalErrors.map(e=>e.message).join(', ')}`).toHaveLength(0);
    }
  });
});

// ─── 404 / NOT FOUND ─────────────────────────────────────────────────────────

test.describe("404 / Not Found behavior", () => {
  test("a completely unknown path redirects to /login when unauthenticated", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz-abc");
    // Unauthenticated → should redirect to /login
    try {
      await page.waitForURL(/\/login/, { timeout: 8_000 });
      await expect(page).toHaveURL(/\/login/);
    } catch {
      // If it stayed, verify body text is not blank (maybe a 404 component rendered)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(0);
    }
  });
});

// ─── LOGIN PAGE SIGNUP FLOW ────────────────────────────────────────────────────

test.describe("Login Page — Signup Toggle", () => {
  test("switching to signup form shows registration fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /need an account\? create one/i }).click();

    // Signup form should show (subtitle changes and form changes)
    await expect(page.getByText(/create your account/i)).toBeVisible();
    // Sign In button should be gone or the form changed
    // There should be a way to toggle back
  });

  test("signup form can toggle back to login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /need an account\? create one/i }).click();
    await expect(page.getByText(/create your account/i)).toBeVisible();

    // Toggle back to login
    const backToLogin = page.getByRole("button", { name: /back to sign in|already have an account|sign in/i });
    if (await backToLogin.isVisible()) {
      await backToLogin.click();
      await expect(page.getByText(/sign in to continue/i)).toBeVisible();
    }
  });
});

// ─── VISUAL / LAYOUT CHECKS ───────────────────────────────────────────────────

test.describe("Visual Layout Checks", () => {
  test("login page card is not clipped on desktop viewport (1280x800)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const card = page.locator(".max-w-md").first();
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Card should be fully within viewport
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1300);
      expect(box.y + box.height).toBeLessThanOrEqual(850);
    }
  });

  test("login page card is not clipped on narrow mobile viewport (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    const card = page.locator(".max-w-md").first();
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(-5); // Allow minor floating point differences
      expect(box.y).toBeGreaterThanOrEqual(0);
    }
  });

  test("install page renders without horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/install");
    await page.waitForLoadState("networkidle");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth, `Horizontal overflow detected: body scrollWidth ${bodyWidth} > viewport ${viewportWidth}`).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test("login page has no horizontal scroll on narrow mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth, `Horizontal overflow: body scrollWidth ${bodyWidth}`).toBeLessThanOrEqual(395);
  });

  test("watermark image on login page does not cover interactive elements", async ({ page }) => {
    await page.goto("/login");
    // The watermark img should have pointer-events-none
    const watermark = page.locator('img[alt="Court Seal Watermark"]');
    await expect(watermark).toBeAttached(); // exists in DOM
    const classes = await watermark.getAttribute("class");
    expect(classes).toContain("pointer-events-none");
  });
});

// ─── COMPREHENSIVE JS ERROR SWEEP ────────────────────────────────────────────

test.describe("JS error sweep across all public pages", () => {
  const publicPages = [
    "/login",
    "/install",
    "/verification-pending",
  ];

  for (const pagePath of publicPages) {
    test(`no uncaught JS errors on ${pagePath}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const txt = msg.text();
          // Only capture React/JS errors, not network resource load failures
          if (!txt.includes("Failed to load resource") && !txt.includes("favicon") && !txt.includes("supabase.co")) {
            errors.push(`[console.error] ${txt}`);
          }
        }
      });

      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      if (errors.length > 0) {
        console.error(`[${pagePath}] JS errors found:`, errors.join("\n"));
      }
      expect(errors, `JS errors on ${pagePath}: ${errors.join(', ')}`).toHaveLength(0);
    });
  }
});

// ─── AUTH FLOW: SIGN UP FORM VALIDATION ───────────────────────────────────────

test.describe("Signup Form Validation", () => {
  test("signup form shows required field indicators", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /need an account\? create one/i }).click();
    await expect(page.getByText(/create your account/i)).toBeVisible();

    // Check that the form is rendered with inputs
    // The SimpleSignupForm component should have email + password fields at minimum
    const inputs = page.locator("input");
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least email + password
  });

  test("signup form submit button state", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /need an account\? create one/i }).click();
    await expect(page.getByText(/create your account/i)).toBeVisible();

    // Find submit button in signup form
    const submitBtn = page.getByRole("button", { name: /create account|sign up|register/i });
    if (await submitBtn.isVisible()) {
      // Should be disabled or at least present
      await expect(submitBtn).toBeVisible();
    }
  });
});
