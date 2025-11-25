# Onboarding, Profile & Admin Acceptance System Audit

## Overview

This document audits the complete user lifecycle from signup to full access.

---

## Current User Flow

```
1. User Signs Up (SignupForm.tsx)
   ↓
2. Email Verification Required (auth.ts)
   ↓
3. Profile Auto-Created (handle_new_user trigger)
   ↓
4. User Verifies Email
   ↓
5. Profile Onboarding (ProfileOnboarding.tsx) - if needed
   ↓
6. WAITING FOR ADMIN APPROVAL (verification_status: 'pending')
   ↓
7. Admin Approves User (AdminProfile.tsx → approve_user_verification RPC)
   ↓
8. User Gets Access (verification_status: 'verified', is_approved: true)
```

---

## Key Components

### 1. Signup (`src/components/auth/SignupForm.tsx`)

**Fields Collected:**
- First Name (required)
- Last Name (required)
- Email (required)
- Password (required)
- Title (optional)
- Phone (optional)
- Department (optional - dropdown)
- Court Position (optional)
- Emergency Contact (optional)
- Avatar (optional)

**Issues:**
- ✅ Good: Collects comprehensive info upfront
- ❌ Department is optional but should probably be required
- ❌ Room number/office location not collected

### 2. Email Verification (`src/services/auth.ts`)

**Flow:**
1. `signUp()` creates user with `emailRedirectTo: /auth/verify`
2. `signIn()` blocks login if `email_confirmed_at` is null
3. User must click email link to verify

**Issues:**
- ✅ Good: Enforces email verification
- ❌ No resend verification email option visible

### 3. Profile Auto-Creation (Database Trigger)

**Trigger:** `handle_new_user()` on `auth.users` INSERT

**Creates Profile With:**
- `id` = user ID
- `email` = user email
- `full_name` = from metadata
- `role` = 'viewer' (default)
- `onboarded` = false
- `mfa_enforced` = false

**Issues:**
- ❌ Old schema uses `role` column but app uses `user_roles` table
- ❌ Doesn't set `verification_status` or `is_approved`
- ❌ Doesn't copy first_name, last_name from signup

### 4. Profile Onboarding (`src/pages/onboarding/ProfileOnboarding.tsx`)

**Collects:**
- First Name (required)
- Last Name (required)
- Title (optional)
- Department (optional)

**Issues:**
- ❌ Duplicates signup fields - why collect again?
- ❌ Missing room number, phone, building
- ❌ Should pre-fill from signup data

### 5. Onboarding Guard (`src/routes/OnboardingGuard.tsx`)

**Checks:**
1. Session exists → redirect to /login
2. Email verified → redirect to /auth/verify
3. Profile complete (first_name, last_name) → redirect to /onboarding/profile
4. MFA enforced → redirect to /auth/mfa-setup

**Issues:**
- ✅ Good: Proper flow control
- ❌ Doesn't check `is_approved` status

### 6. Admin Approval (`src/pages/AdminProfile.tsx`)

**Admin Can:**
- View pending users
- Approve users (`approve_user_verification` RPC)
- Reject users
- Assign roles
- Unlock accounts

**Issues:**
- ❌ No notification to admin when new user signs up
- ❌ No notification to user when approved/rejected
- ❌ Approval buried in Admin Profile page

---

## Profile Schema (from `src/services/profile.ts`)

```typescript
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  building: string | null;
  onboarded: boolean;
  mfa_enforced: boolean;
  created_at: string;
  updated_at: string;
  username?: string | null;
  avatar_url?: string | null;
  theme?: string | null;
  phone?: string | null;
  department?: string | null;
  title?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  time_zone?: string | null;
  language?: string | null;
  is_approved?: boolean;
  verification_status?: string;
  access_level?: string;
  enabled_modules?: any;
  user_settings?: any;
  is_suspended?: boolean;
  onboarding_completed?: boolean;
}
```

**Key Fields for Approval:**
- `verification_status`: 'pending' | 'verified' | 'rejected'
- `is_approved`: boolean
- `access_level`: 'read' | 'write' | 'admin'

---

## Role System

### User Roles Table (`user_roles`)
- `user_id` → profiles.id
- `role`: 'admin' | 'facilities_manager' | 'cmc' | 'court_aide' | 'purchasing_staff' | 'standard'

### Old Profile Role Column (deprecated)
- `role`: 'coordinator' | 'sergeant' | 'it_dcas' | 'viewer'

**Issues:**
- ❌ Two role systems exist (confusing)
- ❌ Old migration uses `role` column
- ❌ App uses `user_roles` table

---

## Recommended Improvements

### Phase 1: Fix Immediate Issues

1. **Fix Profile Auto-Creation Trigger**
   - Set `verification_status = 'pending'`
   - Set `is_approved = false`
   - Copy `first_name`, `last_name` from signup metadata

2. **Remove Duplicate Onboarding**
   - If signup collects name, don't ask again
   - Only show onboarding if profile is incomplete

3. **Add Room Number to Signup**
   - Required for delivery location
   - Pre-fills supply request form

### Phase 2: Improve Admin Workflow

1. **Pending Users Dashboard**
   - Dedicated page for pending approvals
   - Show count in admin nav
   - Email notification to admin on new signup

2. **User Notifications**
   - Email user when approved
   - Email user when rejected (with reason)

3. **Bulk Approval**
   - Select multiple users
   - Approve/reject in batch

### Phase 3: Streamline Onboarding

1. **Progressive Profile**
   - Collect minimum at signup (name, email)
   - Prompt for more info on first login
   - Allow skip with reminder

2. **Department Assignment**
   - Admin assigns department during approval
   - Or user selects from dropdown

3. **Building/Room Assignment**
   - Required for facilities access
   - Admin can override

---

## Files to Modify

### Database
- `db/migrations/XXX_fix_profile_trigger.sql` - Fix auto-creation

### Components
- `src/components/auth/SignupForm.tsx` - Add room number
- `src/pages/onboarding/ProfileOnboarding.tsx` - Simplify or remove
- `src/routes/OnboardingGuard.tsx` - Check is_approved

### Pages
- `src/pages/AdminProfile.tsx` - Improve pending users UI
- NEW: `src/pages/admin/PendingApprovals.tsx` - Dedicated page

### Hooks
- `src/hooks/useOnboarding.ts` - Simplify logic

---

## Current Status Checks

### useOnboarding.ts Logic:
```typescript
// Admins bypass verification
if (profile?.access_level === 'admin') → skip onboarding

// Must be verified first
if (profile?.verification_status !== 'verified') → block onboarding

// Check completion
if (profile?.onboarding_completed || profile?.onboarding_skipped) → skip
```

### OnboardingGuard.tsx Logic:
```typescript
// 1. Check session
// 2. Check email verified
// 3. Check profile complete (first_name, last_name)
// 4. Check MFA if required
```

**Missing:** Check `is_approved` before allowing access!

---

## Summary

The current system has:
- ✅ Email verification
- ✅ Admin approval workflow
- ✅ Role-based permissions
- ❌ Duplicate data collection (signup vs onboarding)
- ❌ Missing room/building in signup
- ❌ No notifications for approval status
- ❌ Confusing dual role systems
- ❌ Pending users not prominently displayed
