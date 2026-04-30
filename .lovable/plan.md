
# Profile + Settings Audit (and Fix the RLS Bug Blocking Profile Saves)

## Critical bug found before the audit even starts

The console logs show profile saves are failing with:

```
ERROR Error updating profile: { code: "42501",
  message: "new row violates row-level security policy for table \"profiles\"" }
```

Root cause: `src/features/profile/components/profile/hooks/useProfileForm.ts` calls `.upsert()` on `profiles`. The RLS policies on `public.profiles` (verified in DB) are:

| Policy | CMD | Who |
|---|---|---|
| `profiles_self_update` | UPDATE | `id = auth.uid()` |
| `profiles_admin_insert` | INSERT | admin only |
| `profiles_admin_write` | ALL | admin only |
| `profiles_cmc_update` | UPDATE | privileged roles |
| `profiles_read` | SELECT | self / privileged / court_aide |

There is **no INSERT policy for self**, because every profile row is auto-created by the auth trigger at signup. PostgREST's `.upsert()` path runs `INSERT ... ON CONFLICT DO UPDATE`, which checks the INSERT policy first and blows up for non-admins. The fix is one line: switch to `.update().eq('id', user.id)`.

This is the only profile-write code path that uses `upsert` — the other writers (`EnhancedUserSettings`, `UserImportExport` admin import) already use `update` / `insert` correctly.

## Audit scope

Profile and Settings cover a lot of surface. We'll go feature by feature, fixing what's broken and confirming what works.

### A. Personal Info form (`/profile?tab=profile`)

1. Fix `useProfileForm.ts`: replace the `upsert({ id, ... })` call with `update({ ... }).eq('id', user.id)`. Drop the `id` from the payload (it's the WHERE clause now).
2. Verify in the live preview: change first name + phone, click Save Changes, no error toast, refresh page — values persist.
3. Sub-sections to check on the same tab:
   - `BasicInfoFields` — first/last name, username, phone
   - `WorkInfoFields` — department, title
   - `EmergencyContactFields` — JSON contact (writes through the same update)
   - `PreferencesFields` — time_zone, language, bio
   - `MyRoomSection` — room display only (read-only); verify it loads
   - Avatar upload (`useAvatarUpload`) — separate flow; confirm bucket `avatars` exists (it does), confirm upload + immediate preview.

### B. Settings tab (`/profile?tab=settings`)

The four sub-tabs in `EnhancedUserSettings`:

1. **Notifications**: email_notifications, desktop_notifications, notification_frequency, data_sharing_analytics → toggle each, click Save, refresh, persist.
2. **Display**: theme (light/dark/system), font_size, language, timezone, date_format, time_format → change one of each, save, persist; confirm theme actually applies via `EnhancedThemeProvider`.
3. **Security**: two_factor_enabled, session_timeout, login_notifications → these toggle but only persist preference; verify save round-trips. (2FA enrollment itself is out of scope unless the user asks.)
4. **Accessibility**: high_contrast, screen_reader_support, keyboard_navigation, motion_reduced → save + persist; confirm `motion_reduced` actually disables animations.
5. Reset-to-defaults button.
6. Confirm settings load on first visit (no error toast for missing `user_settings` JSON — code already handles `PGRST116`).

### C. Header / global affordances on the Profile page

- Mobile vs desktop layout swap (`useIsMobile`).
- Tab routing via `?tab=...` URL param — back/forward and deep-link both work.
- Admin-only "Admin Center" + "System Settings" buttons render only when `isAdmin`.
- `PageHeader` icon + title.

### D. Linked surfaces accessible from Profile

- `/system-settings` (admins only) — load page, no console errors.
- `/profile` deep links: `?tab=settings&sub=display`, `?tab=settings&sub=accessibility`.
- Sign-out from sidebar still works after a save (no stale session).

### E. Quiet console noise

The console shows three "Storage bucket not found" warnings (`courtroom-photos`, `term-pdfs`, `room-photos`) on every login, even though the buckets DO exist (verified). The check in `src/shared/utils/storage.ts:ensureBucketsExist` is racing with auth and producing false negatives. Low priority but worth a follow-up: gate the check on an authenticated session and downgrade to a single debug log when buckets exist.

## Test method

1. **Code fix** (Personal Info upsert → update) — single-line change, no migration needed.
2. **Browser verification** with the browser tool, signed-in standard user:
   - Profile tab: change first name, save, reload, confirm.
   - Settings → Notifications: flip a toggle, save, reload, confirm.
   - Settings → Display: change theme, confirm visual change + persistence.
   - Settings → Accessibility: enable motion_reduced, confirm animations subside.
   - Tab routing: hit `/profile?tab=settings`, confirm correct tab opens.
3. **Regression checks for other writers** (no code change, just a read-through):
   - Avatar upload flow.
   - Admin user import (writes profiles via INSERT — admin only, allowed by `profiles_admin_insert`).

## Out of scope for this pass

- Building a 2FA enrollment flow (toggle persists preference only).
- The bucket-existence check refactor (will be a follow-up).
- Admin-only screens beyond a smoke check of `/system-settings`.
- Any DB migration — the policies are correct; the client was wrong.

## Deliverables

- One code edit: `src/features/profile/components/profile/hooks/useProfileForm.ts` — `.upsert(...)` → `.update(...).eq('id', user.id)`.
- Browser-verified pass through Personal Info + all four Settings sub-tabs with a checklist of what worked, what didn't, and any new issues uncovered.
- A short summary at the end with: bug fixed, surfaces verified, follow-ups noted.

Approve to proceed.
