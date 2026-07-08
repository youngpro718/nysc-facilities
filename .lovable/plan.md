## What's happening

Signup now succeeds at the auth layer, but no `profiles` row is created — so the admin "pending verification" list stays empty.

Root cause: `public.profiles` has a `UNIQUE` index on `email` (`idx_profiles_email`). An orphan profile with `email = jduchate@nycourts.gov` exists under a **different** `id` (`272dfe36-…`) with no matching `auth.users` row. When the new signup fires `handle_new_user()`, the `INSERT … ON CONFLICT (id)` doesn't help — the conflict is on `email`, not `id` — so the insert throws `23505`. Because we recently wrapped the profile insert in `EXCEPTION WHEN OTHERS`, signup completes but the profile is silently skipped. Only the `user_roles` row gets created, and the admin queue (which reads `profiles` where `verification_status = 'pending'`) never sees the user.

## Fix (single migration + one data patch)

1. **Data cleanup** — delete orphan profiles (rows in `profiles` with no matching row in `auth.users`). These are safe to drop; they can't ever log in.
2. **Backfill** the profile for `jduchate@nycourts.gov` (auth id `2b42aa8c-…`) so admin verification sees it.
3. **Harden `handle_new_user()`** — before inserting the profile, delete any orphan profile whose `email = NEW.email` and whose `id` is not in `auth.users`. This guarantees the unique-email index never blocks a legitimate new signup.
4. Keep the existing `EXCEPTION WHEN OTHERS` guard but also `RAISE WARNING` with the full `SQLERRM` for future diagnostics.

No frontend changes. No auth flow changes. No RLS changes.

## Verification

- Confirm `jduchate@nycourts.gov` now appears in the admin verification queue.
- Sign up a new test account with a fresh email → confirm a `profiles` row is created with `verification_status = 'pending'` and appears in the admin queue.
- Run the "orphan-with-same-email" scenario (manually leave a stale profile and try re-signup) → confirm signup + profile creation succeed.