# Faster Court-Officer Onboarding

Goal: a court officer with a trusted email goes from "Create account" → email click → working app in under 60 seconds, with zero duplicate data entry.

## What changes (plain English)

1. **Auto-approve trusted email domains.** When someone signs up with an approved court email domain (e.g. `@nycourts.gov`, `@nycourts.gov.in`, configurable), their account is marked verified immediately on email confirmation — no admin wait. Admins still get a notification with a one-click "Revoke" action.
2. **Everyone else still waits for admin.** The pending-approval page stays the same for unknown domains.
3. **Drop the redundant profile page.** Signup already collects first/last/title/role, so the standalone profile step disappears for users who completed signup. (Guard still redirects there only for legacy accounts missing data.)
4. **Skip the in-app tour by default.** First login goes straight to the dashboard. The tour moves to the Help menu as "Take the tour", and we surface a single inline "New here? Tour the app" link on the dashboard for 7 days.
5. **Tighten the signup form copy.** Role step says "Court officers from approved emails get in instantly" so the user knows what to expect.
6. **Faster guard.** `OnboardingGuard` already fans out in parallel; we'll trim the redundant `getSession` call after `getUser` and short-circuit the role lookup when the profile says verified.

## Resulting flow for a court officer

```text
Signup (3 quick steps, ~20s)
   ↓
Email verification link
   ↓
Trusted domain? ──yes──> Dashboard (auto-approved, admin notified)
   ↓ no
Pending approval screen ──> admin approves ──> Dashboard
```

## Technical details

### Database
- New table `trusted_email_domains` (`domain text pk`, `auto_role app_role`, `created_by`, `created_at`). Seed with `nycourts.gov` mapped to `court_officer`. Admin-only RLS + grants.
- New SECURITY DEFINER function `public.handle_trusted_signup(p_user_id uuid)`:
  - Looks up the user's email domain.
  - If it matches `trusted_email_domains` and the user's `requested_role` matches the domain's `auto_role`, sets `profiles.verification_status = 'verified'`, `is_approved = true`, inserts into `user_roles`, and writes an `admin_notifications` row with type `auto_approved_signup`.
- Trigger `on_auth_user_confirmed` on `auth.users` (AFTER UPDATE of `email_confirmed_at`) calls `handle_trusted_signup` so approval happens the instant the verification link is clicked.

### Frontend
- `OnboardingGuard.tsx`: remove the secondary `getSession` call (use the user from `getUser`); skip the role query when `profile.verification_status === 'verified'` and the only remaining check is MFA (still disabled).
- `App.tsx`: keep `/onboarding/profile` route for legacy accounts but stop linking to it from signup flows. Update `SimpleSignupForm.handleSubmit` success path: route trusted-domain users to `/` instead of `/verification-pending` once their email is verified; everyone else still goes to `/verification-pending`.
- `VerifyEmail.tsx`: after confirming the token, re-fetch profile; if `verification_status === 'verified'`, navigate straight to `/`.
- `SimpleSignupForm.tsx`: small copy tweak on step 3 ("Court officers from approved emails get in instantly. Others wait for admin review.").
- `Layout.tsx`: change `showOnboarding` default to `false` for new users; expose `startOnboarding()` from the help menu and add a dismissible "Take the tour" banner on the dashboard for accounts <7 days old.

### Admin notification
- `admin_notifications.type = 'auto_approved_signup'` rendered in the existing admin bell with actions "View profile" and "Revoke access" (calls existing `set_user_approval_status` RPC with `'rejected'`).

### Files touched
- New migration: `db/migrations/066_trusted_email_domains.sql`
- `src/routes/OnboardingGuard.tsx`
- `src/features/auth/components/auth/SimpleSignupForm.tsx`
- `src/features/auth/pages/auth/VerifyEmail.tsx`
- `src/components/layout/Layout.tsx`
- `src/features/admin/services/adminNotifications.ts` (render new type)
- `src/features/help/components/...` (add "Take the tour" entry)

## Out of scope
- Changing the role taxonomy or what court officers can access (Keys/Spaces/Term Sheet stays).
- Email template restyling.
- MFA enforcement (still commented out in the guard).

## Open follow-ups after build
- Admin UI to add/remove trusted domains (small settings page) — can ship in a follow-up.
- Analytics event "signup_to_first_action" so we can measure the speedup.
