## Goal
Make Admin Center → **System** tab leaner, and fix the "Failed to delete user" error.

## 1. Fix user deletion (root cause)

`admin_delete_user(p_user_id uuid)` RPC still references two tables that were removed when CMC scheduling was deleted:
- `public.court_sessions`
- `public.coverage_assignments`

Postgres aborts the whole function on the first missing relation, so every delete fails before any rows are touched. That's why the toast says "Failed to delete".

**Migration:** rewrite `admin_delete_user` with those four `UPDATE ... SET ... = NULL` lines removed. Everything else in the function stays identical (same SECURITY DEFINER, same admin/self-delete guards, same 5-phase cleanup). After the migration, deleting a user from Admin Center → Users will work end-to-end.

No frontend change needed for the delete flow — the call site (`handleDeleteUser` in `AdminCenter.tsx`) already handles success/error correctly.

## 2. Simplify the System tab

Current System tab has three cards:

```text
┌─ Install App on Phones (QR) ─────────┐  ← keep
├─ Module Management ──────────────────┤  ← keep, trim list
└─ Database Management ────────────────┘  ← remove
    Export tables to Excel
    Import from Excel
    Backup history dialog
    Retention policy editor
```

**Remove — Database Management card.**
Reason: backup/export/import/retention is power-user tooling that nobody on the team actually uses day-to-day, and it's the single biggest source of clutter on this screen. Supabase already handles backups. We'll delete the card from `SystemSettingsContent` and drop the `DatabaseSection` import. The `DatabaseSection.tsx` file and its helpers stay in the repo (no dead-code purge in this pass) but are no longer mounted.

**Keep — Install App QR card.** Useful for onboarding officers to their phones.

**Keep — Module Management,** but tighten the list. Audit `MODULE_CONFIG` in `ModuleManagement.tsx` and remove toggles for modules that are now always-on or no longer exist as separate features. Specifically drop the `operations` entry (it duplicates Issues/Maintenance/Supply Requests which already have their own toggles per the terminology unification rule). Leave the rest as-is for now.

## 3. Out of scope
- Users tab layout (already cleaned up recently)
- Admin Dashboard page (`/admin`)
- Verification Appeals component
- Deleting `DatabaseSection.tsx` source files
- Any DB schema changes beyond the `admin_delete_user` rewrite

## Files touched
- **Migration:** redefine `public.admin_delete_user(uuid)` without `court_sessions` / `coverage_assignments` references.
- **Edit:** `src/features/admin/pages/AdminCenter.tsx` — remove Database Management card + `DatabaseSection` import.
- **Edit:** `src/features/profile/components/profile/ModuleManagement.tsx` — drop the `operations` entry from `MODULE_CONFIG`.
