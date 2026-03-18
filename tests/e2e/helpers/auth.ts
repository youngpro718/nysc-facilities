/**
 * Shared authentication utilities for role-based agent tests.
 *
 * The app stores its Supabase session in sessionStorage under the key "app-auth"
 * (see src/lib/supabase.ts).  We sign in via the Supabase SDK directly (bypasses
 * the UI form) and inject the raw session object into sessionStorage via
 * addInitScript so it lands BEFORE any page script runs.
 */

import { type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://fmymhtuiqzhupjyopfvi.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";

export const SUPABASE_STORAGE_KEY = "app-auth";

export const SCREENSHOTS_DIR = path.resolve(
  "tests/e2e/screenshots"
);

// ─── Session cache (per-process) ──────────────────────────────────────────────

const _cache = new Map<string, object>();

export async function getSession(
  email: string,
  password: string
): Promise<object | null> {
  if (_cache.has(email)) return _cache.get(email)!;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      console.error(`[auth] Sign-in failed for ${email}:`, error?.message);
      return null;
    }
    _cache.set(email, data.session);
    return data.session;
  } catch (err) {
    console.error("[auth] Unexpected sign-in error:", err);
    return null;
  }
}

// ─── Session injection ─────────────────────────────────────────────────────────

/**
 * Must be called BEFORE page.goto().  Injects the session into sessionStorage
 * and dismisses the PWA install prompt so it does not block test interactions.
 */
export async function injectSession(
  page: Page,
  session: object
): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
      localStorage.setItem("pwa-install-dismissed", "true");
    },
    { key: SUPABASE_STORAGE_KEY, value: JSON.stringify(session) }
  );
}

// ─── Credential helpers ────────────────────────────────────────────────────────

export function hasCredentials(
  email: string | undefined,
  password: string | undefined
): boolean {
  return Boolean(email && password);
}

// ─── Console error collector ───────────────────────────────────────────────────

export function collectErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
  });
  page.on("pageerror", (err) =>
    errors.push(`[pageerror] ${err.message}`)
  );
  return () => [...errors];
}

// ─── Screenshot helper ─────────────────────────────────────────────────────────

export async function snap(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(
    SCREENSHOTS_DIR,
    `${name.replace(/[^a-z0-9\-_]/gi, "_").toLowerCase()}.png`
  );
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[screenshot] ${file}`);
}

// ─── PWA install prompt dismisser ─────────────────────────────────────────────

export async function dismissInstallPrompt(page: Page): Promise<void> {
  const btn = page.getByRole("button", { name: /got it/i });
  if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await btn.click();
  }
}

// ─── Common assertions ─────────────────────────────────────────────────────────

export function isNotOnLogin(url: string): boolean {
  return !url.includes("/login");
}

/**
 * Returns a human-readable summary of body health checks.
 */
export async function bodyHealth(page: Page): Promise<{
  hasObjectObject: boolean;
  hasErrorBoundary: boolean;
  snippet: string;
}> {
  const text =
    (await page.locator("body").textContent().catch(() => "")) ?? "";
  return {
    hasObjectObject: text.includes("[object Object]"),
    hasErrorBoundary:
      /something went wrong|application error|error boundary/i.test(text),
    snippet: text.slice(0, 200).replace(/\s+/g, " "),
  };
}
