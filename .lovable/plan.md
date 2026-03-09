

# Fix: Login Screen Refresh Loop

## Root Cause

There is a **redirect loop** between two components:

1. **`useAuth`** (line 306-311): When an authenticated user is on `/login`, it redirects them to their role dashboard.
2. **`OnboardingGuard`** (line 97-100): When the profile fetch fails (network timeout, Supabase hiccup, etc.), it redirects the user **back to `/login`** — even though the user IS authenticated.

This creates: `/login` → (useAuth: "you're logged in!") → `/dashboard` → (OnboardingGuard: "profile failed, go login!") → `/login` → repeat forever.

## Fix

**File: `src/routes/OnboardingGuard.tsx`**

- When the profile fetch fails but the user HAS a valid session, **do not redirect to `/login`**. Instead, show an error state with a "Retry" button, or fall through and let the user proceed.
- This breaks the loop because the guard no longer bounces authenticated users back to the login page on transient errors.

Specifically:
- Change the `catch (profileError)` block (around line 95-100) to show an inline error with a retry button instead of `navigate('/login')`.
- Add a `retryCount` ref to auto-retry once before showing the error UI.

**One file, one fix.**

