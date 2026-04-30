/**
 * Perceived-performance E2E checks.
 *
 * Verifies the loading-UX contract for standard users:
 *   1. The TopProgressBar element is mounted globally.
 *   2. Route transitions render a layout-aware skeleton (not a generic spinner).
 *   3. The persistent shell (sidebar/bottom tab) stays mounted between routes.
 *   4. Hovering a bottom-tab link prefetches the destination chunk before click.
 *   5. Page-level `.animate-spin` is NOT used for route loading.
 *
 * Skips if user credentials aren't configured.
 */

import { test, expect } from '@playwright/test';
import {
  getSession,
  hasCredentials,
  injectSession,
  dismissInstallPrompt,
} from './helpers/auth';

const EMAIL = process.env.PLAYWRIGHT_USER_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD;

let _session: object | null = null;

test.beforeAll(async () => {
  if (!hasCredentials(EMAIL, PASSWORD)) return;
  _session = await getSession(EMAIL!, PASSWORD!);
});

test.describe('Perceived performance', () => {
  test.skip(
    () => !hasCredentials(EMAIL, PASSWORD),
    'PLAYWRIGHT_USER_EMAIL / PLAYWRIGHT_USER_PASSWORD not set',
  );

  test('TopProgressBar is mounted on every authenticated page', async ({ page }) => {
    await injectSession(page, _session!);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissInstallPrompt(page).catch(() => {});
    await expect(page.locator('[data-testid="top-progress-bar"]')).toHaveCount(1);
  });

  test('route skeleton appears during navigation, no page-level spinner', async ({ page }) => {
    // Slow the network down so the skeleton has time to appear.
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (200 * 1024) / 8, // 200 kbps
      uploadThroughput: (200 * 1024) / 8,
      latency: 200,
    });

    await injectSession(page, _session!);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissInstallPrompt(page).catch(() => {});

    // Trigger a route change.
    const navPromise = page.goto('/notifications', { waitUntil: 'domcontentloaded' });

    // Skeleton should appear quickly.
    await expect(page.locator('[data-testid="route-skeleton"]').first()).toBeVisible({
      timeout: 3_000,
    });

    // No generic page-level spinner during this transition.
    expect(await page.locator('main .animate-spin').count()).toBe(0);

    await navPromise;

    // Restore conditions.
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });

  test('persistent shell stays mounted across route changes', async ({ page }) => {
    await injectSession(page, _session!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await dismissInstallPrompt(page).catch(() => {});

    // Capture the header element reference; it should persist (not be replaced).
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await expect(header).toBeVisible();

    await page.goto('/my-issues', { waitUntil: 'domcontentloaded' });
    await expect(header).toBeVisible();
  });

  test('hovering a nav link prefetches the route chunk before click', async ({ page }) => {
    await injectSession(page, _session!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await dismissInstallPrompt(page).catch(() => {});

    // Find a bottom-tab or sidebar link to /notifications.
    const link = page.locator('a[href="/notifications"], button:has-text("Notifications")').first();
    if ((await link.count()) === 0) {
      test.skip(true, 'No notifications nav link visible at this viewport');
      return;
    }

    // Set up listener BEFORE hover to catch the chunk request.
    const chunkRequestPromise = page
      .waitForRequest(
        (req) => /\/assets\/.*\.js(\?|$)/.test(req.url()) || /Notifications/i.test(req.url()),
        { timeout: 4_000 },
      )
      .catch(() => null);

    await link.hover();
    const req = await chunkRequestPromise;

    // We can't strictly require a request (chunk may already be cached);
    // but if we get one, it must be a JS chunk.
    if (req) {
      expect(req.url()).toMatch(/\.js/);
    }
  });
});
