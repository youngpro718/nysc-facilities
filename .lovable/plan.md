Plan to fix this cleanly:

1. Make the profile save prove it actually wrote
- Update the profile submit logic to wait for an authenticated session, not just `getUser()`.
- Save `department` and resolved `title`, then request the updated row back with `.select(...).single()`.
- If Supabase returns no updated row or an RLS/auth issue, show the real error instead of a generic success.

2. Remove hidden validation blockers
- Keep validation only for visible, meaningful profile fields.
- Add an invalid-submit toast so if something blocks saving, the user sees exactly what needs attention.
- Prevent old/hidden fields like emergency contact/time zone/language from silently blocking department/job title saves.

3. Refresh the supply banner immediately after save
- Invalidate the `profileCompleteness` React Query cache after saving the profile.
- Refresh/reset the form with the saved values so the UI reflects what is actually in the database.
- This should stop the “Finish your profile so orders reach you” banner from lingering due to cached profile data.

4. Make the supply prompt less confusing
- Ensure the banner lists the exact missing items only.
- Since supply ordering mainly needs a delivery location, the banner should not imply job title is required for orders unless it truly is.

Files expected to change:
- `src/features/profile/components/profile/hooks/useProfileForm.ts`
- `src/features/profile/components/profile/schemas/profileSchema.ts`
- `src/features/profile/components/profile/PersonalInfoForm.tsx`
- `src/features/supply/hooks/useProfileCompleteness.ts` and/or `ProfileIncompleteBanner.tsx` if the banner copy/check needs tightening

Validation after implementation:
- Use the live preview with the existing signed-in session.
- Change Department and Job Title, save, confirm success toast.
- Reopen the profile/supply order surface and confirm the banner no longer appears when the needed fields are saved.