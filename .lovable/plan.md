

## Problem

Signup fails with "Database error saving new user" because the `handle_new_user()` trigger function tries to INSERT into `room_number` and `court_position` columns on `profiles`, but those columns do not exist in the database.

The auth logs confirm: `column "room_number" of relation "profiles" does not exist (SQLSTATE 42703)`.

## Fix

**Single migration** that:

1. Adds the two missing columns to `profiles`:
   - `room_number text`
   - `court_position text`

2. Recreates the `handle_new_user()` function (same logic from migration 022) so it's cleanly re-applied after the columns exist.

No frontend code changes needed for this fix.

## Build Errors

Separately, there are ~25 pre-existing TypeScript build errors across many feature files (Cannot find name `e`, missing modules, type mismatches). These are unrelated to the signup bug and existed before this change. They should be addressed in a follow-up pass — the signup fix is the priority.

