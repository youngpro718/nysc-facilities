/**
 * Creates E2E test accounts for each role category.
 * Run once: node scripts/create-test-users.mjs
 *
 * After this runs, the SQL in create-test-users.sql must be applied to:
 *   - approve each user
 *   - set verification_status = 'verified'
 *   - assign roles in user_roles
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";

const TEST_PASSWORD = "TestNYSC2025!";

const TEST_USERS = [
  {
    email: "test-cmc@nycourts-test.com",
    role: "cmc",
    first_name: "Test",
    last_name: "CMC",
    label: "CMC",
  },
  {
    email: "test-aide@nycourts-test.com",
    role: "court_aide",
    first_name: "Test",
    last_name: "Aide",
    label: "Court Aide",
  },
  {
    email: "test-user@nycourts-test.com",
    role: "standard",
    first_name: "Test",
    last_name: "User",
    label: "Standard User",
  },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

console.log("Creating E2E test users...\n");

for (const u of TEST_USERS) {
  process.stdout.write(`  [${u.label}] ${u.email} ... `);
  const { data, error } = await supabase.auth.signUp({
    email: u.email,
    password: TEST_PASSWORD,
    options: {
      data: {
        first_name: u.first_name,
        last_name: u.last_name,
      },
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("already registered")) {
      console.log("already exists ✓");
    } else {
      console.log(`FAILED — ${error.message}`);
    }
  } else {
    console.log(`created (id: ${data.user?.id}) ✓`);
  }
}

console.log(`
All done. Now run the SQL in scripts/approve-test-users.sql via the Supabase MCP
to approve, verify, and assign roles to these accounts.

Password for all test accounts: ${TEST_PASSWORD}
`);
