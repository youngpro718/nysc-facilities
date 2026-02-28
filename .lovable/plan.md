

# Full Application Audit

## 1. BUGS & FUNCTIONAL ISSUES

### BUG: Court Officer dashboard stats never load (HIGH)
`src/pages/RoleDashboard.tsx` -- The `courtroomStats` query is only enabled when `userRole === 'cmc'` (line 159), but the court_officer dashboard config references `activeCourtrooms` as a stat. Similarly, no queries fetch `totalKeysIssued`, `keysCheckedOut`, or `lockboxStatus` data for the court_officer role. All 4 stat cards will show 0.

**Fix:** Add key/lockbox queries with `enabled: userRole === 'court_officer'` and wire up the stats values.

### BUG: Recent activity sort is a no-op (LOW)
`src/pages/RoleDashboard.tsx` line 222: `activities.sort((a, b) => 0)` -- the comparator always returns 0, so the sort does nothing. Should sort by timestamp.

### BUG: `user_roles` has duplicate/redundant RLS policies (MEDIUM)
The `user_roles` table has 11 policies including 4 overlapping `ALL` policies and 4 overlapping `SELECT` policies. This creates confusion and potential performance issues. Should be consolidated to a clean set (1 SELECT for own role, 1 ALL for admins, 1 for service_role).

### BUG: `admin/supply-requests` route missing `requireAdmin` (MEDIUM)
Line 221 of `App.tsx` -- the admin supply requests page only checks `ModuleProtectedRoute` for `supply_requests` module, but doesn't require admin. Any user with the `supply_requests` module (standard, court_aide) could potentially access the admin supply management view.

---

## 2. SECURITY ISSUES

### SEC: 185 files use `@ts-nocheck` (HIGH)
This suppresses all TypeScript type checking, masking potential runtime errors, null reference crashes, and type mismatches. Many of these are in core components (UserDashboard, supply components, layout components, profile sections).

**Fix:** Incrementally remove `@ts-nocheck` and fix type errors. Prioritize auth, profile, and supply-related files.

### SEC: `user_roles` has permissive `ALL` policy with `qual:true` (HIGH)
The `service_role_access` policy grants unrestricted `ALL` operations when `qual = true`. While labeled "service role," the linter flags it because `WITH CHECK (true)` is overly broad. If this policy applies to the `anon` or `authenticated` role instead of just `service_role`, it's a privilege escalation vector.

**Fix:** Verify this policy's target role. If it targets `authenticated`, restrict it immediately.

### SEC: `auth_rate_limits` and `security_rate_limits` have `ALL` with `true` (MEDIUM)
Both tables allow unrestricted writes. An attacker could manipulate rate limit tracking to bypass rate limiting.

### SEC: `pdf_extraction_logs` has `ALL` with `true` for service role (LOW)
Acceptable if only service_role, but should be verified.

### SEC: Hardcoded Supabase anon key in `src/lib/supabase.ts` (LOW)
Line 8 has the anon key as a fallback string. While anon keys are public by design, having them hardcoded in two places (`.env` and source code) creates maintenance risk.

### SEC: `dangerouslySetInnerHTML` used in ChartStyle (LOW)
Used with validated color values via `SAFE_COLOR_RE`, which is acceptable. No user input flows through.

---

## 3. ARCHITECTURE & CODE QUALITY

### ARCH: Duplicate Supabase client files (MEDIUM)
Both `src/lib/supabase.ts` (617 lines, the real one) and `src/integrations/supabase/client.ts` exist. The `client.ts` file is auto-generated but uses a different env var name (`VITE_SUPABASE_PUBLISHABLE_KEY`). Confusing for maintainers.

### ARCH: `src/lib/supabase.ts` is a monolith (MEDIUM)
This single file contains: Supabase client config, supply request CRUD, lighting fixture queries, auth service, and more. Should be split into domain-specific service files.

### ARCH: `roleDashboardConfig.ts` type doesn't include all roles (LOW)
`DashboardRole` type is `'cmc' | 'court_officer' | 'court_aide' | 'purchasing_staff'` -- `purchasing_staff` is not a real role in the system (not in `SYSTEM_ROLES`). Dead config that could confuse developers.

### ARCH: DevModeWrapper stores/reads preview role via localStorage (LOW)
While only accessible to admins, the localStorage-based preview is client-side only. This is documented and intentional for dev mode, but worth noting it provides no server-side protection.

---

## 4. UI/UX ISSUES

### UX: Login page forces light theme globally (MEDIUM)
`LoginPage.tsx` lines 18-25 forcibly removes dark/blue/green/purple classes and sets light. When navigating away, it restores the old `className`, but this can cause a flash of wrong theme.

### UX: Bottom tab bar limited to 4 items + "More" (LOW)
Court officer navigation has 4 nav items + separator + Profile = 6 items. The bottom bar shows 4 + "More" overflow. This is fine for most roles, but admin has 10 items, meaning the "More" menu does heavy lifting. Consider if this is optimal for admin mobile UX.

### UX: `RoleDashboard` header buttons may overflow on mobile (MEDIUM)
Lines 275-293 show primary and secondary action buttons side-by-side with no responsive wrapping. On small screens the "Building Layout" and "Key Management" buttons may clip.

**Fix:** Add `flex-wrap` or stack vertically on mobile.

### UX: Standard user has no "Request Key" in navigation (LOW)
The UserDashboard has a "Request Key" quick action button, but the standard user navigation only shows Dashboard, My Activity, Profile. The key request dialog opens inline, so this works, but there's no way to access key requests from My Activity. Minor discoverability gap.

---

## 5. DATABASE ISSUES

### DB: 10 permissive RLS policies flagged by linter (MEDIUM)
Multiple `INSERT` policies use `WITH CHECK (true)` on audit/log tables. This is intentional for append-only audit logging, but should be documented. The `auth_rate_limits` and `security_rate_limits` `ALL` policies are more concerning.

### DB: 1 function with mutable search_path (MEDIUM)
One database function doesn't set `search_path = public`, which could be exploited via search path hijacking per the project's own security standards.

---

## 6. RECOMMENDED FIXES (Priority Order)

1. **Add court_officer stat queries** to `RoleDashboard.tsx` -- key assignments, lockbox counts, courtroom data
2. **Fix activity sort** comparator in `RoleDashboard.tsx`
3. **Verify `user_roles` RLS `service_role_access` policy** targets only `service_role`, not `authenticated`
4. **Add `requireAdmin` or role gate** to `/admin/supply-requests` route
5. **Consolidate duplicate `user_roles` RLS policies** (11 -> 3-4 clean policies)
6. **Fix RoleDashboard mobile header overflow** with responsive layout
7. **Fix mutable search_path** on flagged database function
8. **Tighten `auth_rate_limits`/`security_rate_limits`** ALL policies
9. **Remove `purchasing_staff`** from `DashboardRole` type (dead code)
10. **Begin incremental `@ts-nocheck` removal** starting with auth and security-critical files

