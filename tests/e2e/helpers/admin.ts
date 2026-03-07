import { expect, type Locator, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SESSION_PATH = path.resolve("tests/e2e/.auth/session.json");

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

export function hasAdminCredentials(): boolean {
  return Boolean(adminEmail && adminPassword);
}

async function dismissInstallPrompt(page: Page): Promise<void> {
  const closeBtn = page.getByRole("button", { name: /got it/i });
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
}

export async function loginAsAdmin(page: Page, targetPath = "/"): Promise<void> {
  if (!adminEmail || !adminPassword) {
    throw new Error("Missing PLAYWRIGHT_ADMIN_EMAIL or PLAYWRIGHT_ADMIN_PASSWORD.");
  }

  // Load the session saved by global-setup and inject it into sessionStorage before page
  // scripts run. The app uses sessionStorage for auth (storage: sessionStorage in supabase.ts)
  // and Playwright's storageState() only captures localStorage, so we inject manually here.
  const { key, session } = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
  await page.addInitScript(
    ({ k, s }: { k: string; s: unknown }) => {
      sessionStorage.setItem(k, JSON.stringify(s));
      localStorage.setItem("pwa-install-dismissed", "true");
    },
    { k: key, s: session }
  );

  await page.goto(targetPath === "/" ? "/" : targetPath);

  await expect(page).toHaveURL(/\/($|cmc-dashboard|court-officer-dashboard|court-aide-dashboard|spaces|operations|access-assignments|keys|inventory|lighting|admin)/);
  await expect(page.getByRole("navigation", { name: /mobile primary navigation/i })).toBeVisible();
}

export async function expectShellReady(page: Page): Promise<void> {
  await expect(page.getByRole("navigation", { name: /mobile primary navigation/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /toggle menu/i })).toBeVisible();
}

export async function openMobileMenu(page: Page): Promise<Locator> {
  await dismissInstallPrompt(page);
  await page.getByRole("button", { name: /more options/i }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("Menu");
  return sheet;
}

export async function navigateFromMobileMenu(
  page: Page,
  itemName: string,
  expectedPath: RegExp,
): Promise<void> {
  const sheet = await openMobileMenu(page);
  await sheet.getByRole("link", { name: itemName }).click();
  await expect(page).toHaveURL(expectedPath);
}
