/**
 * Live Audit Confirmation Tests
 * Purpose: Confirm specific findings from the code-level audit with real browser behavior.
 * Run with: npx playwright test tests/e2e/live-audit-confirm.spec.ts --config=playwright.audit.config.ts --headed --project=desktop-audit
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:8080";
const TEST_EMAIL = "testaudit123@mailtest.com";
const TEST_PASSWORD = "Welcome123!";

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT-1: Account creation + onboarding flow
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT-1 — Account Creation & Onboarding", () => {
  test("signup form is reachable from login page", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    // Look for a sign up link or tab
    const signupLink = page
      .getByRole("link", { name: /sign up|create account|register/i })
      .or(page.getByRole("button", { name: /sign up|create account|register/i }))
      .or(page.getByText(/sign up|create account|don.t have an account/i));

    const signupVisible = await signupLink.first().isVisible().catch(() => false);
    console.log(`[AUDIT-1] Sign up link visible on login page: ${signupVisible}`);

    // Take screenshot for evidence
    await page.screenshot({ path: "playwright-report/audit1-login-page.png", fullPage: true });

    // If signup exists, navigate to it
    if (signupVisible) {
      await signupLink.first().click();
      await page.waitForLoadState("networkidle");
      console.log(`[AUDIT-1] Navigated to: ${page.url()}`);
      await page.screenshot({ path: "playwright-report/audit1-signup-page.png", fullPage: true });
    } else {
      console.log("[AUDIT-1] WARNING: No sign up link found on login page");
    }
  });

  test("create a new account and observe full signup + onboarding", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    // Find and click signup
    const signupTrigger = page
      .getByRole("link", { name: /sign up|register/i })
      .or(page.getByRole("button", { name: /sign up|register/i }))
      .or(page.getByText(/sign up|create account/i).first());

    const canSignup = await signupTrigger.isVisible().catch(() => false);

    if (!canSignup) {
      // Try direct URL variants
      for (const url of ["/signup", "/register", "/auth/signup", "/auth/register"]) {
        await page.goto(`${BASE}${url}`);
        await page.waitForLoadState("networkidle");
        if (!page.url().includes("/login")) {
          console.log(`[AUDIT-1] Found signup at: ${page.url()}`);
          break;
        }
      }
    } else {
      await signupTrigger.click();
      await page.waitForLoadState("networkidle");
    }

    console.log(`[AUDIT-1] Current URL: ${page.url()}`);
    await page.screenshot({ path: "playwright-report/audit1-before-signup.png", fullPage: true });

    // Try to find email + password fields
    const emailField = page
      .getByRole("textbox", { name: /email/i })
      .or(page.locator('input[type="email"]'));
    const passwordField = page.locator('input[type="password"]').first();
    const confirmPasswordField = page.locator('input[type="password"]').nth(1);

    const emailVisible = await emailField.isVisible().catch(() => false);
    console.log(`[AUDIT-1] Email field visible: ${emailVisible}`);

    if (emailVisible) {
      await emailField.fill(TEST_EMAIL);
      await passwordField.fill(TEST_PASSWORD);

      // Check if confirm password exists
      const confirmVisible = await confirmPasswordField.isVisible().catch(() => false);
      if (confirmVisible) {
        await confirmPasswordField.fill(TEST_PASSWORD);
      }

      // Check for role selector
      const roleSelector = page
        .getByRole("combobox", { name: /role/i })
        .or(page.locator("select[name='role']"))
        .or(page.getByLabel(/role/i));
      const roleVisible = await roleSelector.isVisible().catch(() => false);
      console.log(`[AUDIT-1] Role selector visible during signup: ${roleVisible}`);

      await page.screenshot({ path: "playwright-report/audit1-filled-signup.png", fullPage: true });

      // Submit
      const submitBtn = page
        .getByRole("button", { name: /sign up|create|register|submit/i })
        .first();
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      console.log(`[AUDIT-1] After submit URL: ${page.url()}`);
      await page.screenshot({ path: "playwright-report/audit1-after-signup.png", fullPage: true });

      // What page are we on?
      const pageText = await page.locator("body").innerText().catch(() => "");
      if (pageText.includes("verify") || pageText.includes("email")) {
        console.log("[AUDIT-1] FINDING: Email verification screen shown after signup ✓");
      } else if (pageText.includes("pending") || pageText.includes("approval")) {
        console.log("[AUDIT-1] FINDING: Pending approval screen shown after signup");
      } else if (pageText.includes("onboarding") || pageText.includes("profile")) {
        console.log("[AUDIT-1] FINDING: Onboarding screen shown immediately after signup (no email verification)");
      } else {
        console.log(`[AUDIT-1] FINDING: Unknown post-signup state. URL: ${page.url()}`);
        console.log(`[AUDIT-1] Page contains: ${pageText.substring(0, 300)}`);
      }
    } else {
      console.log("[AUDIT-1] WARNING: Could not find email field on signup page");
    }
  });

  test("check if onboarding can be skipped", async ({ page }) => {
    // Login with admin to check onboarding behavior, or inspect the page directly
    await page.goto(`${BASE}/onboarding`);
    await page.waitForLoadState("networkidle");
    console.log(`[AUDIT-1] /onboarding URL: ${page.url()}`);

    await page.screenshot({ path: "playwright-report/audit1-onboarding-direct.png", fullPage: true });

    const bodyText = await page.locator("body").innerText().catch(() => "");
    const hasSkip = /skip|later|remind me/i.test(bodyText);
    console.log(`[AUDIT-1] Skip option visible on onboarding: ${hasSkip}`);
    if (hasSkip) {
      console.log("[AUDIT-FINDING] CONFIRMED: Onboarding has a skip option");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT-2: HIGH-3 — Public key request form requires no auth
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT-2 — Public Forms Without Authentication (HIGH-3)", () => {
  test("key request form accessible without login", async ({ page }) => {
    // Start from a clean state (no cookies)
    await page.context().clearCookies();

    await page.goto(`${BASE}/forms/key-request`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    console.log(`[AUDIT-2] /forms/key-request redirected to: ${finalUrl}`);

    await page.screenshot({ path: "playwright-report/audit2-key-request-form.png", fullPage: true });

    if (finalUrl.includes("/login") || finalUrl.includes("/auth")) {
      console.log("[AUDIT-2] FINDING: Key request form DOES redirect to login (protected) ✓");
    } else if (finalUrl.includes("/forms/key-request") || finalUrl.includes("/key-request")) {
      console.log("[AUDIT-2] CONFIRMED AUDIT FINDING HIGH-3: Key request form is accessible WITHOUT authentication");

      // Document what fields are shown
      const inputs = await page.locator("input, select, textarea").count();
      console.log(`[AUDIT-2] Form has ${inputs} input fields`);

      const bodyText = await page.locator("body").innerText().catch(() => "");
      console.log(`[AUDIT-2] Form content preview: ${bodyText.substring(0, 400)}`);
    } else {
      console.log(`[AUDIT-2] Unexpected URL: ${finalUrl}`);
    }
  });

  test("issue report form accessible without login", async ({ page }) => {
    await page.context().clearCookies();

    await page.goto(`${BASE}/forms/issue-report`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    console.log(`[AUDIT-2] /forms/issue-report: ${finalUrl}`);

    await page.screenshot({ path: "playwright-report/audit2-issue-report.png", fullPage: true });

    if (finalUrl.includes("/login")) {
      console.log("[AUDIT-2] Issue report redirects to login ✓");
    } else {
      console.log("[AUDIT-2] FINDING: Issue report form accessible WITHOUT authentication");
    }
  });

  test("maintenance request form accessible without login", async ({ page }) => {
    await page.context().clearCookies();

    await page.goto(`${BASE}/forms/maintenance-request`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    console.log(`[AUDIT-2] /forms/maintenance-request: ${finalUrl}`);
    await page.screenshot({ path: "playwright-report/audit2-maintenance.png", fullPage: true });

    if (finalUrl.includes("/login")) {
      console.log("[AUDIT-2] Maintenance request redirects to login ✓");
    } else {
      console.log("[AUDIT-2] FINDING: Maintenance request form accessible WITHOUT authentication");
    }
  });

  test("check /public-forms route", async ({ page }) => {
    await page.context().clearCookies();

    await page.goto(`${BASE}/public-forms`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    console.log(`[AUDIT-2] /public-forms: ${finalUrl}`);
    await page.screenshot({ path: "playwright-report/audit2-public-forms.png", fullPage: true });
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log(`[AUDIT-2] Public forms content: ${bodyText.substring(0, 300)}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT-3: Admin login + supply order empty delivery location (CRITICAL-3)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT-3 — Supply Order Empty Delivery (CRITICAL-3)", () => {
  async function loginAsAdmin(page: Page) {
    const email = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "jduchate@gmail.com";
    const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "welcome";

    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    const emailField = page
      .getByRole("textbox", { name: /email/i })
      .or(page.locator('input[type="email"]'));
    const passwordField = page.locator('input[type="password"]').first();

    await emailField.fill(email);
    await passwordField.fill(password);

    const loginBtn = page
      .getByRole("button", { name: /sign in|log in|login/i })
      .first();
    await loginBtn.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    console.log(`[AUDIT-3] After login URL: ${page.url()}`);
    await page.screenshot({ path: "playwright-report/audit3-after-login.png", fullPage: true });
  }

  test("admin can log in and reach dashboard", async ({ page }) => {
    await loginAsAdmin(page);

    const isOnDashboard =
      !page.url().includes("/login") && !page.url().includes("/auth");
    console.log(`[AUDIT-3] Admin login successful: ${isOnDashboard}`);
    expect(isOnDashboard).toBe(true);
  });

  test("supply order page — check if delivery location is required", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to supply order page
    const supplyUrls = [
      "/supply/order",
      "/supply-room",
      "/supply/request",
      "/supply",
      "/request-hub",
    ];

    for (const url of supplyUrls) {
      await page.goto(`${BASE}${url}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      if (!page.url().includes("/login")) {
        console.log(`[AUDIT-3] Found supply page at: ${page.url()}`);
        break;
      }
    }

    await page.screenshot({ path: "playwright-report/audit3-supply-page.png", fullPage: true });

    // Look for supply order / request new order button
    const orderBtn = page
      .getByRole("button", { name: /new order|request supplies|order supplies|quick order|place order/i })
      .or(page.getByRole("link", { name: /new order|request supplies/i }));

    const orderBtnVisible = await orderBtn.first().isVisible().catch(() => false);
    console.log(`[AUDIT-3] Order button visible: ${orderBtnVisible}`);

    if (orderBtnVisible) {
      await orderBtn.first().click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "playwright-report/audit3-order-form.png", fullPage: true });
    }

    // Check for delivery location field
    const deliveryField = page
      .getByLabel(/delivery location|deliver to|location/i)
      .or(page.getByPlaceholder(/delivery location|deliver to/i))
      .or(page.locator('input[name*="delivery"], textarea[name*="delivery"]'));

    const deliveryVisible = await deliveryField.first().isVisible().catch(() => false);
    console.log(`[AUDIT-3] Delivery location field visible: ${deliveryVisible}`);

    if (!deliveryVisible) {
      console.log("[AUDIT-3] CONFIRMED CRITICAL-3: No delivery location field visible in supply order UI");
    } else {
      // Check if it's required
      const isRequired = await deliveryField.first().getAttribute("required").catch(() => null);
      const ariaRequired = await deliveryField.first().getAttribute("aria-required").catch(() => null);
      console.log(`[AUDIT-3] Delivery field required attr: ${isRequired}, aria-required: ${ariaRequired}`);
    }
  });

  test("supply order — attempt to add item to cart and reach checkout", async ({ page }) => {
    await loginAsAdmin(page);

    // Try to reach the supply order page
    const urls = ["/supply/order", "/supply-room/order", "/order-supplies", "/supply"];
    for (const url of urls) {
      await page.goto(`${BASE}${url}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(800);
      if (!page.url().includes("/login")) break;
    }

    await page.screenshot({ path: "playwright-report/audit3-supply-checkout-start.png", fullPage: true });

    // Look for any add-to-cart button
    const addBtn = page
      .getByRole("button", { name: /add to cart|add|request/i })
      .first();
    const addVisible = await addBtn.isVisible().catch(() => false);

    if (addVisible) {
      await addBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: "playwright-report/audit3-after-add.png", fullPage: true });

      // Look for checkout / submit button
      const checkoutBtn = page
        .getByRole("button", { name: /checkout|submit order|place order|submit request/i })
        .first();
      const checkoutVisible = await checkoutBtn.isVisible().catch(() => false);
      console.log(`[AUDIT-3] Checkout button visible after adding item: ${checkoutVisible}`);

      if (checkoutVisible) {
        await checkoutBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: "playwright-report/audit3-checkout.png", fullPage: true });

        // Is delivery location asked now?
        const bodyText = await page.locator("body").innerText().catch(() => "");
        const asksDelivery = /delivery location|deliver to|where.*deliver|location/i.test(bodyText);
        console.log(`[AUDIT-3] Checkout screen asks for delivery location: ${asksDelivery}`);

        if (!asksDelivery) {
          console.log("[AUDIT-3] CONFIRMED CRITICAL-3: Checkout does NOT collect delivery location");
        }
      }
    } else {
      console.log("[AUDIT-3] Could not find add-to-cart button — supply order flow may need different navigation");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT-4: Role enforcement — key request approval without admin check
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT-4 — Key Request Approval Page", () => {
  async function loginAsAdmin(page: Page) {
    const email = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "jduchate@gmail.com";
    const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "welcome";

    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    const emailField = page
      .getByRole("textbox", { name: /email/i })
      .or(page.locator('input[type="email"]'));
    await emailField.fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole("button", { name: /sign in|log in|login/i }).first().click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  }

  test("admin can reach key requests page", async ({ page }) => {
    await loginAsAdmin(page);

    const keyRequestUrls = [
      "/admin/key-requests",
      "/admin/keys",
      "/keys/requests",
      "/admin",
    ];

    for (const url of keyRequestUrls) {
      await page.goto(`${BASE}${url}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(800);

      const bodyText = await page.locator("body").innerText().catch(() => "");
      if (/key request|key approval|approve.*key|reject.*key/i.test(bodyText)) {
        console.log(`[AUDIT-4] Key requests page found at: ${page.url()}`);
        await page.screenshot({ path: "playwright-report/audit4-key-requests.png", fullPage: true });
        break;
      }
    }

    // Look for approve/reject buttons
    const approveBtn = page.getByRole("button", { name: /approve/i }).first();
    const approveVisible = await approveBtn.isVisible().catch(() => false);
    console.log(`[AUDIT-4] Approve button visible: ${approveVisible}`);

    if (approveVisible) {
      console.log("[AUDIT-4] Key request approval UI is rendered — check code for role guard inside handleAction()");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT-5: Standard user experience after signup
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT-5 — Unauthenticated Navigation Boundaries", () => {
  test("protected routes redirect to login when not authenticated", async ({ page }) => {
    await page.context().clearCookies();

    const protectedRoutes = [
      "/",
      "/dashboard",
      "/supply",
      "/keys",
      "/admin",
      "/operations",
      "/spaces",
    ];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const redirected = page.url().includes("/login") || page.url().includes("/auth");
      console.log(`[AUDIT-5] ${route} → ${page.url()} | redirected to login: ${redirected}`);

      if (!redirected) {
        console.log(`[AUDIT-5] WARNING: ${route} accessible without authentication!`);
        await page.screenshot({
          path: `playwright-report/audit5-unauth-${route.replace(/\//g, "_")}.png`,
          fullPage: true,
        });
      }
    }
  });
});
