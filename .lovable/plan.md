## Root cause

The `handle_new_user()` trigger fires on `auth.users` insert and tries:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES (NEW.id, v_assigned_role)
ON CONFLICT (user_id) DO UPDATE ...
```

But `public.user_roles` has **no unique constraint on `user_id`** (only a PK on `id`). Postgres rejects the `ON CONFLICT (user_id)` clause with *"no unique or exclusion constraint matching the ON CONFLICT specification"*, which surfaces to signup as **"Database error creating a new user."**

Additionally, the `user_roles_approved_roles_only` CHECK constraint whitelist is missing `court_liaison`, so any signup whose `requested_role` resolves to `court_liaison` would also fail.

## Fix (single migration)

1. De-duplicate any existing rows in `public.user_roles` per `user_id` (keep the newest), so a unique index can be added safely.
2. Add `UNIQUE (user_id)` on `public.user_roles` — this is what `ON CONFLICT (user_id)` needs.
3. Replace `user_roles_approved_roles_only` CHECK with one that also allows `court_liaison` (still excludes non-enum values like `system_admin`, which is intentionally not in the enum).
4. Leave `handle_new_user()` unchanged — it's correct once the unique constraint exists.

No frontend changes. No changes to auth flow, RLS, or other tables.

## Verification

- Run `SELECT auth.uid()` isn't needed; instead sign up a brand-new email from the login page and confirm the account is created and a `profiles` + `user_roles` row appear.
- Confirm existing 10 `user_roles` rows survive (no data loss).