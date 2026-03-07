import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const STORAGE_STATE_PATH = "tests/e2e/.auth/admin.json";

// Read from environment (same values used by the app via .env.local)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_BpZQ2LlObzVYqbzrQAF0Cw_4RkiTPAj";

// Custom storage key set in src/lib/supabase.ts: auth: { storageKey: 'app-auth' }
const SUPABASE_STORAGE_KEY = "app-auth";

export default async function globalSetup(config: FullConfig) {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

  if (!email || !password) {
    // No credentials — skip setup, admin tests will be skipped anyway
    return;
  }

  // Sign in via Supabase SDK directly — bypasses the UI form and its rate limiting
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Supabase sign-in failed: ${error?.message ?? "no session returned"}`);
  }

  // Playwright's storageState() only captures localStorage, not sessionStorage.
  // The app uses sessionStorage for auth (src/lib/supabase.ts: storage: sessionStorage).
  // Solution: save the raw session to a JSON file; each test injects it via addInitScript
  // into sessionStorage BEFORE page scripts run, so Supabase finds it on init.
  const authDir = path.dirname(STORAGE_STATE_PATH);
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(
    path.join(authDir, "session.json"),
    JSON.stringify({ key: SUPABASE_STORAGE_KEY, session: data.session })
  );

  // Also save a minimal storageState for the webkit-iphone-admin project config
  // (it requires a valid storageState path — we write an empty one)
  fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));

  console.log("[global-setup] Admin session saved to", path.join(authDir, "session.json"));
}
