import { expect, test } from "@playwright/test";

test.describe("public mobile smoke", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /nysc facilities hub/i })).toBeVisible();
    await expect(page.getByText(/authorized use only/i)).toBeVisible();
  });

  test("install page renders core install guidance", async ({ page }) => {
    await page.goto("/install");
    await expect(page.getByRole("heading", { name: /install nysc facilities/i })).toBeVisible();
    await expect(page.getByText(/add to home screen/i).first()).toBeVisible();
  });
});
