

# Comprehensive Application Audit

## 1. Security Issues (High Priority)

### 1A. `log_security_event` function overload ambiguity
**Status**: Actively causing console warnings on every login.
Three overloads exist with conflicting signatures (`text` vs `uuid` for `resource_id`). Supabase cannot resolve which to call, so security events silently fail to log.
**Fix**: Drop the redundant overload(s), keeping only one canonical signature (e.g., `text`-based), or rename one variant.

### 1B. Overly permissive RLS policies (WITH CHECK = true)
The linter flagged 6 tables with `WITH CHECK (true)` or `USING (true)` on non-SELECT operations:
- `audit_logs` (INSERT for `authenticated`)
- `audit_sensitive_access` (INSERT for `public` -- anyone can insert!)
- `court_assignment_audit_log` (INSERT for `authenticated`)
- `key_audit_logs` (INSERT for `authenticated`)
- `room_assignment_audit_log` (INSERT for `authenticated`)
- `security_audit_log` (INSERT for `public` -- anyone can insert!)

The audit/security tables allowing `public` role inserts is especially dangerous -- unauthenticated users can flood these tables.
**Fix**: Restrict INSERT policies to `authenticated` at minimum; ideally restrict to `service_role` or use SECURITY DEFINER functions for logging.

### 1C. Leaked password protection disabled
Supabase's built-in leaked password protection is off. This allows users to sign up with passwords known to be in breach databases.
**Fix**: Enable in Supabase Dashboard > Auth > Settings.

### 1D. Postgres security patches available
The database version has pending security patches.
**Fix**: Upgrade Postgres via Supabase Dashboard.

### 1E. Functions missing `search_path` configuration
Some database functions lack explicit `search_path`, which can be exploited via search path hijacking.
**Fix**: Audit all public functions and add `SET search_path = public` where missing.

---

## 2. Functional Issues (Medium Priority)

### 2A. Duplicate Supabase client file
`src/integrations/supabase/client.ts` uses `localStorage` while `src/lib/supabase.ts` uses `sessionStorage`. The integrations version appears unused but could cause confusion if accidentally imported.
**Fix**: Add a prominent warning or delete the integrations file if truly unused.

### 2B. OnboardingGuard duplicated MFA block
Lines 147-197 in `OnboardingGuard.tsx` contain the same MFA enforcement code block pasted twice (both commented out). This is dead code clutter.
**Fix**: Remove the duplicate commented block.

### 2C. Email verification not enforced
Both `OnboardingGuard` and `useAuth` have email verification checks commented out with "skeleton-only" notes. Users can sign up and access the app without verifying their email.
**Fix**: Decide whether to enforce email verification and either enable or remove the skeleton code.

### 2D. AdminRealtime connection failure
Console shows `[AdminRealtime] Connection failed: CHANNEL_ERROR`. This suggests the realtime subscription for admin notifications is failing, likely due to missing RLS policies on the subscribed table or a configuration issue.
**Fix**: Investigate which table the realtime channel subscribes to and ensure appropriate RLS policies exist.

---

## 3. Code Quality Issues (Lower Priority)

### 3A. Excessive `as any` casts
Multiple files use `as any` type casts (ProtectedRoute, SignupForm, ProfileOnboarding, IssueData, etc.). These bypass TypeScript safety and can hide bugs.
**Fix**: Gradually replace with proper type definitions.

### 3B. DevModeWrapper uses localStorage for role checking
`App.tsx` line 334 reads `preview_role` from `localStorage` to determine admin status. While this is only for the DevModePanel display (not access control), the logic is convoluted -- `realRole` is computed but never used correctly.
**Fix**: Simplify the DevModeWrapper logic.

### 3C. `useIssueData` has heavy data transformation
The `useIssueData` hook does extensive manual type transformation of the issue data. This is fragile and will break if the schema changes.
**Fix**: Create proper TypeScript types that match the DB schema and use Supabase's generated types.

### 3D. Tailwind ambiguous class warning
Dev server logs show `duration-[180ms]` class is ambiguous. Minor but creates noise.
**Fix**: Use `duration-[180ms]` with escaped brackets or switch to a Tailwind preset value.

---

## 4. Performance Considerations

### 4A. OnboardingGuard makes 3 sequential network calls
It calls `getUser()`, then `getSession()`, then fetches the role -- while `useAuth` also does similar fetches. This means on every page load, the auth state is checked redundantly.
**Fix**: Consider sharing auth state between OnboardingGuard and AuthProvider to avoid duplicate calls.

### 4B. Inventory images are bundled as binary assets
The 10 generated `.jpg` files in `src/assets/inventory/` are bundled into the JS bundle via Vite imports. If they're large, this bloats the initial bundle.
**Fix**: Verify file sizes. If large, move to Supabase Storage or use external URLs instead.

---

## 5. UX Improvement Opportunities

### 5A. "Checking module access..." loading state
When navigating to module-protected routes, users see a plain text "Checking module access..." without a spinner. This feels unpolished compared to other loading states.
**Fix**: Add a spinner/skeleton consistent with other loading states.

### 5B. Admin Center link shown to non-admins in module disabled screen
`ModuleProtectedRoute` always shows an "Admin Center" button, even if the user doesn't have admin access. Clicking it would redirect them away.
**Fix**: Conditionally show the Admin Center button only for admin users.

### 5C. No offline/error state for inventory images
If an inventory item name doesn't match any keyword, it falls back to `default.jpg`. There's no visual indicator that this is a generic fallback vs. an actual photo.
**Fix**: Consider adding a subtle badge or different styling for generic images vs. uploaded photos.

---

## Recommended Priority Order

1. Fix `log_security_event` overload (causing active errors)
2. Tighten `public` role RLS policies on audit tables
3. Enable leaked password protection
4. Fix AdminRealtime connection error
5. Remove duplicate MFA code block
6. Clean up auth flow (decide on email verification)
7. Address performance (duplicate auth checks)
8. Code quality improvements (types, eslint suppressions)
9. UX polish items

