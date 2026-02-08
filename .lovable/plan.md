

# Audit: Signup, Onboarding, and Admin Verification Flow

## Issues Found

### 1. CRITICAL BUG: `requested_role` not passed to Supabase auth metadata

The signup forms (`SimpleSignupForm.tsx` and `SignupForm.tsx`) pass `requested_role` in `userData`, but `useSecureAuth.ts` maps it to `requested_access_level` (a legacy field name) and **never maps `requested_role`** into the sanitized metadata sent to Supabase.

- `SimpleSignupForm.tsx` line 67: `requested_role: formData.requestedRole`
- `SignupForm.tsx` line 91: `requested_role: requestedRole`
- `useSecureAuth.ts` line 169: Only maps `requested_access_level: userData.requested_access_level` (which is undefined since forms send `requested_role`)

**Result**: The DB trigger `handle_new_user` reads `NEW.raw_user_meta_data->>'requested_role'` but it's never set, so it always defaults to `'standard'` regardless of what the user picks.

**Fix**: In `useSecureAuth.ts`, add `requested_role: userData.requested_role` to the sanitized metadata object.

### 2. Verification request record never created during signup

The `handle_new_user` DB trigger creates the profile and a default `user_roles` entry, but it **does not** insert a row into `verification_requests`. The `AdminCenter` page fetches pending users from `profiles` (checking `verification_status = 'pending'`), which works. However, the `VerificationSection` and `UserManagementTab` components query `verification_requests` for pending items -- so they may show nothing if no verification_request row exists.

The `AdminCenter.tsx` approach (querying `profiles` directly for `verification_status`) is the correct one since it doesn't depend on `verification_requests`. The `UserManagementTab.tsx` queries `verification_requests` separately -- this is redundant but functional because it's used alongside a full profiles query.

**Recommendation**: Add `INSERT INTO verification_requests` in the `handle_new_user` trigger to ensure consistent data across all admin views.

### 3. `reject_user_verification` does NOT delete the user

The `reject_user_verification` function only updates `verification_requests.status` to `'rejected'` but does NOT update `profiles.verification_status` or `profiles.is_approved`. This means rejected users remain in the system as "pending" in the profiles table.

**Fix**: Add profile status update to the reject function:
```sql
UPDATE public.profiles
SET verification_status = 'rejected',
    is_approved = false,
    updated_at = NOW()
WHERE id = p_user_id;
```

### 4. Stats card references stale role name

In `UserManagementTab.tsx` line 615, the stats card filters by `role === "supply_room_staff"` which is a legacy role not in the current 4-role system. This counter will always show 0.

**Fix**: Replace with `role === "court_aide"` to match the current role hierarchy.

### 5. Admin approval defaults to 'standard' in VerificationSection

In `useVerificationMutations.ts` line 20, when approving a user, the role is hardcoded to `'standard'` rather than letting the admin choose or using the user's `requested_role`.

**Fix**: Pass the user's requested role or admin-selected role through the approval flow.

---

## Implementation Plan

### Step 1: Fix `requested_role` metadata propagation (useSecureAuth.ts)
Add `requested_role: userData.requested_role` to the sanitized user data object passed to `supabase.auth.signUp()`.

### Step 2: Database migration -- Fix `reject_user_verification` and `handle_new_user`
- Update `reject_user_verification` to also set `profiles.verification_status = 'rejected'`
- Update `handle_new_user` to insert a `verification_requests` row so all admin views show pending users consistently

### Step 3: Fix stale role reference (UserManagementTab.tsx)
Change `"supply_room_staff"` to `"court_aide"` in the stats card.

### Step 4: Fix hardcoded 'standard' role in VerificationSection approval
Update `useVerificationMutations.ts` to accept and pass the actual role instead of hardcoding `'standard'`.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/security/useSecureAuth.ts` | Add `requested_role` to sanitized metadata |
| `src/components/admin/UserManagementTab.tsx` | Fix stats card stale role reference |
| `src/components/profile/sections/verification/hooks/useVerificationMutations.ts` | Remove hardcoded 'standard' role |
| *Database migration* | Fix `reject_user_verification` to update profiles; fix `handle_new_user` to create verification_request |

