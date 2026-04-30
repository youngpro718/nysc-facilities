
# Audit Continuation — Findings & Fixes

## Status check on the previous fix
No more `42501` errors in your live console. The Personal Info save bug is resolved.

## New issues found during the Settings + Storage audit

### 1. Accessibility tab is hidden from non-admin users (real a11y bug)
`EnhancedUserSettings.tsx` lines 557 + 573 gate the Accessibility tab behind `isAdmin`. That hides **screen reader support, keyboard navigation, reduce motion, and high contrast** from every standard user — exactly the people most likely to need them. There's no security reason for this; the underlying column is `user_settings` JSON on their own profile row.

**Fix:** Always show the Accessibility tab. Switch the TabsList from `grid-cols-3 / grid-cols-4` to always `grid-cols-4`. Remove the `isAdmin &&` wrapper around the `<TabsContent value="accessibility">`.

### 2. Session-Timeout control is admin-only but rendered inside the Security tab
Line 346 hides the session timeout select behind `isAdmin`. That's fine — it's an org-policy setting. No change needed; just confirming this is intentional.

### 3. Export / Reset buttons are admin-only
Lines 503–514. Reasonable: standard users shouldn't reset their own settings to a different default unintentionally. Leave as-is.

### 4. False-negative "Storage bucket not found" warnings on every login
`src/shared/utils/storage.ts:ensureBucketsExist` calls `supabase.storage.listBuckets()`, which requires the **service role**. For anon/authenticated users it returns an empty array, so the bucket check always reports "not found" — even though the buckets `courtroom-photos`, `term-pdfs`, `room-photos` exist (verified server-side). Three warnings per login, plus more on space-edit dialogs.

**Fix:** Convert `ensureBucketsExist` to a no-op (keep the export so callers — `initializeStorage`, `EditSpaceDialog` — compile unchanged). Real bucket existence is proven on first upload; if a bucket is genuinely missing, the upload path already surfaces a clear error.

### 5. Avatar upload — verified safe
`useAvatarUpload` writes to the `avatars` bucket (public, exists). No changes needed.

### 6. MyRoomSection — verified safe
Reads `useOccupantAssignments`; "Request Room" inserts into `staff_tasks` with `requested_by` and `created_by` set to the current user. RLS-compliant.

## Plan

1. Edit `EnhancedUserSettings.tsx`:
   - TabsList → always `grid-cols-4`.
   - Always render the Accessibility `TabsTrigger` and `TabsContent` (remove the two `isAdmin` gates around them).

2. Edit `src/shared/utils/storage.ts`:
   - Replace `ensureBucketsExist` body with a documented no-op explaining why (`listBuckets` needs service role).

3. Smoke-check `/system-settings` and `/admin` route load through code (read-only — no edits anticipated).

4. Final audit summary at the end.

No DB migrations. No new dependencies. Two file edits.

Approve to proceed.
