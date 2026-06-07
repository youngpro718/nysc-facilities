import { expect, test } from "@playwright/test";
import {
  expectShellReady,
  hasAdminCredentials,
  loginAsAdmin,
  navigateFromMobileMenu,
} from "./helpers/admin";

test.describe("authenticated admin smoke", () => {
  test.skip(!hasAdminCredentials(), "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run admin smoke tests.");

  test("admin can sign in and reach the shell", async ({ page }) => {
    await loginAsAdmin(page);
    await expectShellReady(page);
  });

  test("bottom tab routes remain usable on iPhone WebKit", async ({ page }) => {
    await loginAsAdmin(page);

    await expectShellReady(page);

    await page.getByRole("button", { name: "Spaces" }).click();
    await expect(page).toHaveURL(/\/spaces$/);
    await expect(page.locator('[data-tour="space-list"]')).toBeVisible();

    await page.getByRole("button", { name: "Issues" }).click();
    await expect(page).toHaveURL(/\/operations\?tab=issues$/);
    await expect(page.getByRole("heading", { name: /operations/i })).toBeVisible();

    await page.getByRole("button", { name: "Maintenance" }).click();
    await expect(page).toHaveURL(/\/operations\?tab=maintenance$/);
    await expect(page.getByRole("heading", { name: /operations/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /maintenance/i })).toHaveAttribute("data-state", "active");
  });

  test("more menu routes open their core admin destinations", async ({ page }) => {
    await loginAsAdmin(page);

    await navigateFromMobileMenu(page, "Keys", /\/keys$/);
    await expect(page.getByRole("heading", { name: /key management/i })).toBeVisible();
    await expect(page.locator('[data-tour="keys-tabs"]')).toBeVisible();

    await navigateFromMobileMenu(page, "Inventory", /\/inventory$/);
    await expect(page.getByRole("heading", { name: /^inventory$/i })).toBeVisible();
    await expect(page.locator('[data-tour="inventory-search"]')).toBeVisible();

    await navigateFromMobileMenu(page, "Lighting", /\/operations\?tab=lighting$/);
    await expect(page.getByRole("heading", { name: /operations/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /lighting/i })).toHaveAttribute("data-state", "active");

    await navigateFromMobileMenu(page, "Admin Center", /\/admin$/);
    await expect(page.getByRole("heading", { name: /admin center/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /users/i })).toHaveAttribute("data-state", "active");
  });

  test("clicking a room card on mobile opens the room drawer", async ({ page }) => {
    await loginAsAdmin(page, "/spaces");

    // Wait for the mobile room list to load (skeletons disappear, first h3 appears)
    const firstRoomHeading = page.locator('h3').first();
    await expect(firstRoomHeading).toBeVisible({ timeout: 15_000 });

    // Grab the room name so we can verify the drawer shows the right room
    const roomName = await firstRoomHeading.textContent();

    // Click the first room card
    await firstRoomHeading.click();

    // Drawer should open — vaul renders as role="dialog"
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible({ timeout: 5_000 });

    // The DrawerTitle (sr-only) should contain the room name
    await expect(drawer).toContainText(roomName ?? "");
  });

  test("spaces and lighting mobile surfaces expose their primary views", async ({ page }) => {
    await loginAsAdmin(page, "/spaces");

    await expect(page.locator('[data-tour="space-list"]')).toBeVisible();

    await page.goto("/lighting");
    await expect(page.getByRole("heading", { name: /operations/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /lighting/i })).toHaveAttribute("data-state", "active");
  });
});
