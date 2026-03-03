

## Diagnosis: Admin user redirected to `/` on every navigation

### Investigation Summary

I've thoroughly reviewed the routing chain: `OnboardingGuard` → `Layout` → `ProtectedRoute` → `ModuleProtectedRoute`. For an admin user who is verified and approved, **none of these components should redirect to `/`**. The code logic is correct on paper.

### Possible Root Causes (ranked by likelihood)

1. **Stale build / caching** — The broken `@/integrations/supabase/types` import was just fixed. If the browser is still serving a cached/broken version, navigation won't work. **Try: Hard refresh (Ctrl+Shift+R) or clear browser cache.**

2. **`SIGNED_IN` event firing on token refresh** — Supabase sometimes fires `SIGNED_IN` during background token refreshes. The `handleRedirect` in `useAuth.tsx` (line 446-448) calls `handleRedirect(userData, true)` treating it as an explicit sign-in. While the redirect logic *should* be safe for admin on `/spaces`, a race condition could cause `window.location.pathname` to read `/` before the navigation completes.

3. **`useRolePermissions` returning stale/wrong role** — If `userRole` briefly returns `null` or a non-admin role during re-render, the `ProtectedRoute` `requireAdmin` check (on `/` route) could trigger a redirect loop.

### Plan: Add diagnostic logging to pinpoint the cause

Add `console.log` statements to three key locations so the logs appear automatically on the next message:

1. **`src/hooks/useAuth.tsx`** — Log every call to `handleRedirect` with the current path, role, and whether it decides to redirect
2. **`src/components/auth/ProtectedRoute.tsx`** — Log when `requireAdmin` check fails, showing `isAdmin`, `profile?.role`
3. **`src/routes/OnboardingGuard.tsx`** — Log when the guard triggers any redirect

These are temporary diagnostic logs (3 lines each). Once we identify the culprit, we remove them.

### Alternative quick fix (if cause #2)

In `useAuth.tsx` line 413, change the `SIGNED_IN` handler to skip redirect if the event is actually a token refresh:

```typescript
// Line 413: Add check for TOKEN_REFRESHED
if (event === 'SIGNED_IN' && newSession) {
```

Add a guard inside the redirect block (line 446):
```typescript
// Only redirect on actual sign-in, not token refresh
const isOnAuthPage = ['/login', '/auth/', '/onboarding/'].some(p => window.location.pathname.startsWith(p));
if (hasCompletedInitialAuth.current && isOnAuthPage) {
  handleRedirect(userData, true);
}
```

This ensures `handleRedirect` only fires post-sign-in when the user is on an auth page, not when they're already navigating the app.

