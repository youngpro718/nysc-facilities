# Mobile login → wrong dashboard: root cause + fix

## What's happening

The console logs from your mobile session show the actual culprit (not a UI bug):

```
[ERROR] [authService.fetchUserProfile] Error fetching user roles: TypeError: Load failed
[ERROR] [authService.fetchUserProfile] Error fetching profile:    TypeError: Load failed
```

On mobile Safari, on first sign-in the browser fires ~30 parallel requests (Spaces preload, issues, sessions, roles, profile, etc.). Several of those `fetch()` calls abort with `TypeError: Load failed` — a known Safari behavior when too many concurrent requests are kicked off during a page transition / right after auth token rotation.

In `src/lib/supabase.ts` → `authService.fetchUserProfile`, when those errors happen the code does this:

```ts
if (rolesResult.error) { logger.error(...); }   // swallowed
if (profileResult.error) { logger.error(...); } // swallowed
const role = rolesResult.data?.role || 'standard';   // ← defaults to standard
const isAdmin = role === 'admin' || role === 'system_admin'; // false
```

`useAuth` then calls `handleRedirect`, which calls `getDashboardForRole('standard')` → `/dashboard`. So an admin who is on mobile and hits a flaky load gets dropped on the standard user dashboard.

It looks like "the admin dashboard is broken on mobile," but the admin dashboard never gets a chance to load — the user is misrouted as `standard` because their role fetch failed and the failure was silently treated as "no role."

## The fix

### 1. Stop defaulting to `standard` on fetch failure
`src/lib/supabase.ts` — `fetchUserProfile`:
- If `rolesResult.error` or `profileResult.error` is set, **throw** instead of returning a fabricated profile.
- Return a discriminated result (`{ ok: true, profile, isAdmin } | { ok: false, error }`) so callers can distinguish "user really has no role" from "network failed."

### 2. Retry the role/profile fetch
Add a small retry helper (3 attempts, 250 ms / 750 ms backoff) around the two queries. Mobile Safari almost always succeeds on attempt 2.

Serialize the two queries on the first attempt as well — running them with `Promise.all` is what's saturating Safari's connection pool during the auth handshake. Sequential is ~50 ms slower but reliable.

### 3. Don't redirect until we have a real role
`src/features/auth/hooks/useAuth.tsx`:
- In both `initializeAuth` and the `onAuthStateChange` SIGNED_IN branch, if `fetchUserProfile` throws, **do not** call `handleRedirect`. Keep `isLoading=true`, show a toast ("Couldn't verify your account, retrying…"), and re-attempt once. If it still fails, sign out and send the user back to `/login` with an error rather than guessing their role.
- Only flip `isAdmin` / `userRole` / `profile` to "empty" values on explicit SIGNED_OUT, never on a fetch error.

### 4. Protect the dashboard router itself
`getDashboardForRole(undefined)` currently returns `/dashboard`. Change `useAuth.handleRedirect` so it bails out (no navigation) when `userData.profile` is null — that way a transient failure can never silently bounce an admin off `/`.

### 5. Quiet the secondary noise
The same "Load failed" storm is causing the `get_enhanced_room` warnings and `useUserIssues` errors you see in the log. They're symptoms of the same Safari connection-pool saturation; once `fetchUserProfile` retries cleanly they go away, but we'll also add a 2-attempt retry to `useUserIssues` for resilience.

## Files to change

- `src/lib/supabase.ts` — rewrite `fetchUserProfile`: sequential + retry + throw on error.
- `src/features/auth/hooks/useAuth.tsx` — don't redirect on failure; retry once; preserve prior auth state.
- `src/routes/roleBasedRouting.ts` — leave behavior, but document that `undefined` role must not be passed by callers.
- `src/features/dashboard/hooks/useUserIssues.ts` — wrap the fetch with a 2-attempt retry.

## What I will NOT change

- No DB / RLS changes — your role data is fine, the failure is purely client-side network.
- No new dependencies.
- No UI changes to the dashboards themselves.

## How we'll verify

After the change, on mobile:
1. Log in as admin → should land on `/` (admin dashboard) every time, even with a slow connection.
2. Console should no longer show `[authService.fetchUserProfile] Error fetching user roles` followed by a redirect to `/dashboard`.
3. If the network is truly down, you should see a "Couldn't verify your account" toast and stay on `/login` instead of being shown the standard dashboard.
