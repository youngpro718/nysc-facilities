

# Audit: "Flash Back to Dashboard" Bug

## Root Cause Found

The problem is in `src/hooks/useAuth.tsx`, lines 426-461. The Supabase auth listener handles `SIGNED_IN` events — but in Supabase JS v2, **token refreshes also fire `SIGNED_IN`**. Every time the token silently refreshes (roughly every hour, or on tab focus):

1. `SIGNED_IN` fires
2. Since `hasCompletedInitialAuth.current` is already `true`, the code calls `handleRedirect(userData, true)` — treating it as an **explicit sign-in**
3. `handleRedirect` with `isExplicitSignIn = true` checks the current path and may redirect:
   - If on `/` and role resolves as anything other than `admin` (even briefly) → redirect to `/dashboard`
   - If on `/dashboard` and role is `admin` → redirect back to `/`
   - This creates a **redirect loop** that manifests as a "flash"

This is especially triggered when:
- The user clicks a navigation button (changing path)
- A concurrent token refresh fires `SIGNED_IN`
- `handleRedirect` evaluates the new path against role and bounces them back

Additionally, the `SIGNED_IN` handler re-fetches the profile on every token refresh (line 449), which is wasteful and creates opportunities for race conditions where `isAdmin` or `profile` temporarily resets.

## Fix Plan

### 1. Stop treating token refreshes as explicit sign-ins (`useAuth.tsx`)

The `onAuthStateChange` handler at line 426 must distinguish between real sign-ins and token refreshes:

- Add handling for `TOKEN_REFRESHED` event: update session/user silently, **no redirect**
- For `SIGNED_IN`: only call `handleRedirect` if the user is on an auth-related page (`/login`, `/onboarding/`, `/auth/`), not if they're already navigating the app
- Skip redundant profile re-fetch if we already have profile data for the same user ID

### 2. Guard `handleRedirect` against unnecessary redirects (`useAuth.tsx`)

In the `handleRedirect` function (lines 271-330):
- Only redirect from `/login` and onboarding pages — never from arbitrary app pages
- Remove the "wrong dashboard" correction logic (lines 312-326) that bounces between `/` and `/dashboard` — the routing layer already handles this via `ProtectedRoute`

### 3. No changes needed elsewhere

- `OnboardingGuard` correctly skips re-checks via `hasCheckedRef`
- `ProtectedRoute` logic is sound
- Navigation config and route mappings are aligned
- Sidebar index-to-route mapping is correct

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Fix `onAuthStateChange` to handle `TOKEN_REFRESHED` silently; restrict `handleRedirect` to auth pages only; prevent redundant profile refetch on token refresh |

