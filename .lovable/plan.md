# Fix the signup "Database error" for all roles

## Root cause (confirmed in auth logs)

Every failing signup shows this exact database error:

```
duplicate key value violates unique constraint "user_roles_user_id_uidx"
```

Sequence of events on signup:

1. `handle_new_user` runs and inserts a **standard** role row for the new user.
2. For trusted domains (e.g. `@nycourts.gov`), the email auto-confirm step fires `handle_trusted_signup`, which tries to insert the requested role (court officer, admin, purchasing, etc.).
3. That insert uses `ON CONFLICT (user_id, role)` as its safety valve — but the table also has a stricter one-role-per-user unique index on `user_id` alone. Since "standard" ≠ "purchasing", the `(user_id, role)` clause doesn't match, the `user_id`-only index is violated, the whole transaction aborts, and Supabase surfaces it as a generic "Database error".

So the bug hits **every trusted-domain signup that requests any role other than standard** — exactly what you're seeing.

## Fix (one database migration)

1. **Correct the conflict target** in `handle_trusted_signup`: change the role insert to `ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now()` so it upgrades the existing "standard" row instead of colliding with it.
2. **Remove the redundant unique index** `user_roles_user_id_role_key (user_id, role)` — with one role per user enforced by `user_roles_user_id_uidx`, the second index is dead weight and the source of this confusion.
3. **Harden the confirm trigger** so a non-critical failure (e.g. the admin notification insert) can never abort account creation again: wrap the notification step in its own exception block that logs instead of raising.

## Full audit of the rest of the signup path (verified, no changes needed)

- `handle_new_user` (profile auto-creation): uses `ON CONFLICT` correctly on both inserts — safe.
- `approve_user_verification`: targets `ON CONFLICT (user_id)` — already correct.
- Frontend signup form passes `requested_role` through auth metadata — correct, no code changes required.
- Non-trusted-domain signups (no auto-role) return early — unaffected.

## Verification

After the migration, I'll re-run the trigger logic against a test scenario in SQL and confirm via the auth logs that signups for court officer / admin / purchasing complete without a 500.