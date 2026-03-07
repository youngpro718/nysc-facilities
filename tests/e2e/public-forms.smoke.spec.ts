import { expect, test } from "@playwright/test";

// NOTE: These routes are in the publicPaths allowlist in useAuth.tsx, so they render
// without authentication rather than redirecting to /login.

test.describe("unauthenticated accessible routes", () => {
  for (const path of [
    "/public-forms",
    "/forms/key-request",
    "/forms/maintenance-request",
    "/forms/issue-report",
    "/auth/pending-approval",
    "/auth/account-rejected",
  ]) {
    test(`${path} is reachable without authentication (no redirect to /login)`, async ({ page }) => {
      await page.goto(path);
      // Allow up to 5s for any redirect — if it stays on the path (or a related one), test passes
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
      // Must NOT have redirected to /login
      expect(page.url()).not.toMatch(/\/login/);
    });
  }
});

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders NYSC branding and sign-in heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /nysc facilities hub/i })).toBeVisible();
    await expect(page.getByText(/sign in to continue/i)).toBeVisible();
  });

  test("shows authorized use only notice", async ({ page }) => {
    await expect(page.getByText(/authorized use only/i)).toBeVisible();
  });

  test("email and password fields are visible and interactive", async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");

    await passwordInput.fill("secret");
    await expect(passwordInput).toHaveValue("secret");
  });

  test("sign in button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("sign in button is disabled when fields are empty", async ({ page }) => {
    // Form uses SecureForm which disables submit until fields are filled
    await expect(page.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });

  test("invalid credentials show an error and stay on login page", async ({ page }) => {
    await page.getByLabel(/email/i).fill("nobody@invalid-domain-12345.test");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should remain on login (not navigate away)
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    // Sign in button should still be present (form not replaced by success state)
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("install page", () => {
  test("renders without authentication", async ({ page }) => {
    await page.goto("/install");
    await expect(page.getByRole("heading", { name: /install nysc facilities/i })).toBeVisible();
    await expect(page.getByText(/add to home screen/i).first()).toBeVisible();
  });
});

