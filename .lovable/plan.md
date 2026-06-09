
## Goal

Make signup → first useful screen take as few taps as possible, remove "personalization" fluff that doesn't serve the corporate use case, and make sure every role's dashboard shows only what that role actually needs. Ship something we can hand to real users this week.

## Direction check (what I'd change vs. keep)

**Keep**
- Email/password + admin approval gate. That's the contract with the courts.
- Auto-approval for `@nycourts.gov` court officers (already in place).
- Per-role dashboards driven by `roleDashboardConfig.ts` — that pattern is right.

**Drop**
- The 4-step post-verification "Onboarding Wizard" (Welcome → Profile → Features → Complete). It's the main reason signup feels slow.
- The `ProfileStep` that asks for department/title/phone *again* after signup already collected name + title.
- The `OnboardingChecklist` auto-popup on dashboards. Tour stays opt-in from Help only.
- "Tell us about yourself" tone, emoji role icons, "This appears on your profile and activity feed" copy. Replace with neutral corporate phrasing.

## Part 1 — Signup: 3 steps → 2 steps

`src/features/auth/components/auth/SimpleSignupForm.tsx`

- **Step 1 — Account**: work email + password (unchanged).
- **Step 2 — Identity + Role** (merged): First name, Last name, Role selector. Drop the optional Job Title field — title isn't used for routing (roles are admin-assigned) and just adds a field to skip. Drop emoji icons on role cards; use small lucide icons that match the rest of the app.
- Copy changes: "Create your account" / "Your details" / no "This appears on your profile" line.
- Button label on submit: "Create account" (not "Request access").

Net: one fewer screen, one fewer field, more corporate tone.

## Part 2 — Kill the post-verification wizard

- Remove the `OnboardingWizard` mount from wherever it auto-launches for new users. Verified users land **directly** on their role dashboard via `OnboardingGuard` + `getDashboardForRole`.
- Keep `OnboardingWizard.tsx` + steps on disk **only** if "Take the tour" in Help still launches it; otherwise delete the wizard + `ProfileStep`/`WelcomeStep`/`FeaturesStep`/`CompleteStep` files. I'll confirm during implementation and remove what's dead.
- `useOnboarding` already no longer auto-shows the tour, but it still reads/writes `onboarding_completed`/`onboarding_skipped`. Simplify it to: expose `startOnboarding` (manual launch) and nothing else. Remove the localStorage `ONBOARD_AFTER_SIGNUP*` bookkeeping that no longer has a consumer.
- Remove `OnboardingChecklist` from dashboards (or hide it behind an explicit Help action). It's classic SaaS "personalization" the user said they don't want.

## Part 3 — Profile page: remove personalization fluff

`src/features/profile/pages/Profile.tsx` + `profileSchema.ts`

Keep only what the org actually needs:
- Name, work email (read-only), phone, department, title, avatar.

Remove from the profile UI:
- Bio / "about you" textarea.
- Language picker, time zone picker (single-org, one timezone — server-side default is fine).
- Emergency contact block (HR concern, not facilities-app concern).
- Any "preferences" / "customize dashboard" surface (`DashboardCustomizationProvider` UI entry points). The provider can stay for admins; just don't expose the customize UI to standard/court roles.

DB columns stay — we're just hiding them from the UI so we don't have to migrate anything.

## Part 4 — Per-role dashboard pass

Quick audit + fixes against `roleDashboardConfig.ts` and the actual dashboard pages:

**court_officer** (`/court-officer-dashboard`)
- Current: 4 stat cards, Today's Activity, Active/Recent assignment toggle, My Reported Issues, Quick Actions, Term Sheet preview.
- Verdict: good. One fix — `lockboxStatus` and `activeCourtrooms` stats aren't wired to live data on this page; either wire them or drop them so the strip matches what the page actually shows (Total / Checked Out / Available / Pending Requests).

**court_liaison** (`/term-sheet` as landing)
- Verdict: landing them directly on Term Sheet is right (it's their job). Verify the Term Sheet page has the "My Issues" + "My Supply Requests" counters from the config visible at the top; if not, add a slim stat strip.

**purchasing** (`/inventory` as landing)
- Verdict: works. Add a 3-stat header strip (Low Stock / Pending Requests / Reorder Recs) using the existing config so it matches the dashboard contract.

**court_aide** (`/court-aide-dashboard`)
- Verdict: keep. Confirm the 4 stats (Available Tasks / My Active / Supply Requests / Low Stock) all bind to real queries — drop any that are stubbed.

**standard** (`/dashboard`)
- This is everyone without a specialized role. Strip to: My Issues, My Supply Requests, Report an Issue, Request Supplies. Remove generic "BuildingsGrid", building activities, KPI strips — none of that is useful to a standard user.

**admin / facilities_manager / system_admin** (`/`)
- Out of scope for this pass. Already dense; we'll tune separately if needed.

## Part 5 — Verify the speed claim

After the changes, measure: signup form submit → dashboard render. Target: ≤ 3 screens total (Account → Details+Role → email-verify wait → dashboard). For trusted-domain officers: 3 screens (no wizard, no checklist, no profile prompt).

## Out of scope

- Changing the admin approval flow itself.
- Touching the admin dashboards.
- Removing DB columns for the dropped profile fields (UI hide only).
- Email-template / branding changes.

## Technical notes

- Files likely edited: `SimpleSignupForm.tsx`, `useOnboarding.ts`, `Profile.tsx`, `profileSchema.ts`, `CourtOfficerDashboard.tsx`, `RoleDashboard.tsx` (for liaison/purchasing strip), `UserDashboard.tsx`, dashboard pages that mount `OnboardingChecklist`.
- Files likely deleted: `OnboardingWizard.tsx`, `steps/ProfileStep.tsx`, `steps/WelcomeStep.tsx`, `steps/FeaturesStep.tsx`, `steps/CompleteStep.tsx`, `OnboardingChecklist.tsx` (if no remaining consumer).
- No DB migration required.
- No new dependencies.
