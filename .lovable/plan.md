# Fix Account Creation (Signup 500)

## Root cause

The Supabase auth log shows every `/signup` returning **500: Database error updating user** with:

```
ERROR: column "role" does not exist (SQLSTATE 42703)
```

The `public.prevent_profile_privilege_escalation` trigger (BEFORE UPDATE on `public.profiles`) still references `NEW.role` / `OLD.role`:

```sql
OR NEW.role IS DISTINCT FROM OLD.role
```

But `profiles.role` no longer exists — roles were moved to `public.user_roles`. Any UPDATE on `profiles` now throws.

This breaks signup because `handle_new_user` (trigger on `auth.users`) runs `INSERT ... ON CONFLICT (id) DO UPDATE ...` on `profiles`. The UPDATE path fires `prevent_profile_privilege_escalation`, which immediately fails with the missing-column error, rolling back the entire signup transaction.

A secondary issue: there are two identical AFTER UPDATE triggers on `auth.users` (`on_auth_user_email_confirmed` and `trg_auth_user_email_confirmed`) both calling `public.on_auth_user_email_confirmed()`. They double-fire `handle_trusted_signup()` on every email confirmation — wasteful and risks double-side-effects.

## Plan

### 1. Migration: repair the privilege-escalation trigger

Recreate `public.prevent_profile_privilege_escalation` without the broken `NEW.role`/`OLD.role` comparison. Role changes are already protected on the canonical `user_roles` table (via `audit_role_changes` / RLS), so removing this check does not regress security.

```sql
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_priv boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;  -- service role / trigger context
  END IF;

  SELECT public.is_admin() OR public.is_privileged() INTO is_priv;
  IF is_priv THEN
    RETURN NEW;
  END IF;

  IF NEW.is_approved          IS DISTINCT FROM OLD.is_approved
  OR NEW.is_suspended         IS DISTINCT FROM OLD.is_suspended
  OR NEW.access_level         IS DISTINCT FROM OLD.access_level
  OR NEW.verification_status  IS DISTINCT FROM OLD.verification_status
  OR NEW.mfa_enforced         IS DISTINCT FROM OLD.mfa_enforced
  OR NEW.enabled_modules      IS DISTINCT FROM OLD.enabled_modules
  OR NEW.feature_flags        IS DISTINCT FROM OLD.feature_flags
  OR NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed
  THEN
    RAISE EXCEPTION 'Not allowed to modify privileged profile fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
```

### 2. Migration: drop the duplicate auth trigger

Keep `on_auth_user_email_confirmed`, drop `trg_auth_user_email_confirmed`:

```sql
DROP TRIGGER IF EXISTS trg_auth_user_email_confirmed ON auth.users;
```

### 3. Verify

- Re-run a signup with a fresh email and an existing email; both should return 200 instead of 500.
- Confirm Supabase auth logs show no further `column "role" does not exist` errors.
- Confirm `handle_trusted_signup` runs exactly once on email confirmation.

## Notes / out of scope

- No frontend changes needed. `SimpleSignupForm` + `useSecureAuth` flow is correct.
- Other audit findings (rate-limit / sanitize RPCs) are present and functioning — not the cause.
- I'll also keep `prevent_profile_self_escalation` as-is; it already guards `role` safely via `to_jsonb(NEW) ? 'role'`.
