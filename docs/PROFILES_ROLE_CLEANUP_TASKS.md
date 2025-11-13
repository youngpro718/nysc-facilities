# Profiles.Role Cleanup Task List

## Overview

This document lists all remaining references to `profiles.role` found in the codebase after Phase 2 of the role migration. Tasks are categorized by priority and type.

**Search Date:** 2025-11-13
**Search Patterns:** `profiles.role`, `profile.role`, `role.*profiles`

---

## 🔴 CRITICAL - Database Schema Issues

### Task 1: Verify profiles.role Column Removal
**Status:** ⚠️ NEEDS VERIFICATION
**Files:** Database schema
**Description:** Conflicting information exists about whether `profiles.role` column still exists:
- Migration docs claim it was removed in Phase 1
- `USER_VERIFICATION_MIGRATION_COMPLETE.md` mentions a `sync_role_to_profile()` trigger that syncs `user_roles.role` → `profiles.role`

**Action Required:**
```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';

-- If it exists, check for the sync trigger
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'user_roles';
```

**Resolution Path:**
- [ ] Query database to confirm column status
- [ ] If column exists: Remove column and sync trigger
- [ ] If column doesn't exist: Remove references to sync trigger in docs
- [ ] Update `USER_VERIFICATION_MIGRATION_COMPLETE.md` accordingly

---

## 🟡 HIGH PRIORITY - Documentation Updates

### Task 2: Update Historical Migration Documentation
**Status:** 📝 TODO
**Files:**
- `docs/USER_VERIFICATION_MIGRATION_COMPLETE.md` (lines 18, 25, 163, 210)
- `docs/ROLE_DASHBOARD_TESTING.md` (lines 130, 151-195, 207)
- `docs/ROLE_MIGRATION_COMPLETE.md` (lines 5, 17-18, 57, 74, 103, 158, 181)

**Description:** These docs reference the old `profiles.role` column in examples and instructions.

**Action Required:**
- [ ] Add deprecation notices at top of older docs
- [ ] Update code examples to use `user_roles` table exclusively
- [ ] Add links to `ROLE_MIGRATION_PHASE2_COMPLETE.md` for current patterns
- [ ] Mark outdated sections clearly with ⚠️ OUTDATED warnings

### Task 3: Update Security Documentation
**Status:** 📝 TODO
**Files:**
- `docs/INFINITE_RECURSION_FIX.md` (lines 29, 45, 88)
- `docs/PROFILES_SECURITY_ENHANCEMENT.md` (lines 97, 354)
- `docs/SECURITY_AUDIT_REPORT_2025.md` (lines 72, 420)
- `docs/stories/story-008-rls-policies.md` (line 331)

**Description:** Security docs show examples with recursive RLS policies using `profiles.role`.

**Action Required:**
- [ ] Add warning banners explaining these are historical examples
- [ ] Show corrected versions using `user_roles` table
- [ ] Update all RLS policy examples to use `has_role()` security definer function
- [ ] Add reference to current security best practices

---

## 🟢 LOW PRIORITY - Database Migration Comments

### Task 4: Update Migration File Comments
**Status:** ℹ️ INFORMATIONAL
**Files:**
- `db/migrations/011_profiles_security_enhancement.sql` (lines 179-180)
- `db/migrations/012_add_rbac_roles.sql` (lines 36-37)

**Description:** Migration files contain SQL comments describing the old `profiles.role` column.

**Action Required:**
- [ ] **DO NOT MODIFY** these files (migrations are historical records)
- [ ] Add a header comment explaining this is legacy documentation
- [ ] Create a new migration to update column comments in the database:
  ```sql
  -- Remove outdated role column comment
  COMMENT ON COLUMN public.profiles.role IS NULL;
  -- Or update to show deprecation
  COMMENT ON COLUMN public.profiles.role IS '[DEPRECATED] This column has been removed. Roles are now in user_roles table.';
  ```

**Note:** These are historical migration files and should generally not be modified. Only update if the column comment still exists in the live database.

---

## ✅ COMPLETED - Code References

### Task 5: TypeScript/React Code References
**Status:** ✅ COMPLETED IN PHASE 2
**Files:**
- `src/services/profile.ts` - Deprecated old functions
- `src/services/profile/roleManagement.ts` - New module created
- `src/services/operations/operationsService.ts` - Removed role from query

**Description:** All active code references have been updated in Phase 2.

**Verification:**
- [x] Deprecated functions show console warnings
- [x] New role management module uses `user_roles` exclusively
- [x] TypeScript types updated with deprecation notices
- [x] No direct database queries for `profiles.role`

---

## 📋 Cleanup Checklist

### Immediate Actions (This Week)
- [ ] **Task 1:** Verify database schema status (CRITICAL)
- [ ] **Task 2:** Update migration documentation with deprecation warnings
- [ ] **Task 3:** Add warning banners to security docs

### Short-term Actions (Next 2 Weeks)
- [ ] Update all code examples in documentation
- [ ] Review and update RLS policy examples
- [ ] Create style guide for role access patterns

### Long-term Actions (Next Month)
- [ ] Consider archiving outdated documentation
- [ ] Create consolidated "Role Management Best Practices" guide
- [ ] Remove deprecated functions after grace period

---

## Search Results Summary

### By Category:
- **Database Migrations:** 2 files (comments only, historical)
- **Documentation:** 8 files (examples and historical context)
- **TypeScript/Code:** 4 files (already handled in Phase 2)

### By Priority:
- **Critical:** 1 task (database schema verification)
- **High:** 2 tasks (documentation updates)
- **Low:** 1 task (migration comments)
- **Completed:** 1 task (code references)

---

## Verification Commands

### Check for Profile Role References in Code:
```bash
# Search TypeScript/React files
grep -r "profiles.role\|profile.role" src/ --include="*.ts" --include="*.tsx"

# Search SQL files
grep -r "profiles.role" supabase/ db/ --include="*.sql"

# Search documentation
grep -r "profiles.role" docs/ --include="*.md"
```

### Database Verification:
```sql
-- Check column existence
\d public.profiles;

-- Check for triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%role%';

-- Check for policies referencing profiles.role
SELECT schemaname, tablename, policyname, pg_get_expr(qual, tablename::regclass)
FROM pg_policies
WHERE pg_get_expr(qual, tablename::regclass) LIKE '%profiles%role%';
```

---

## Related Documentation

- [Phase 1: Initial Migration](./ROLE_MIGRATION_COMPLETE.md)
- [Phase 2: Complete Refactoring](./ROLE_MIGRATION_PHASE2_COMPLETE.md)
- [Role Management Module](../src/services/profile/roleManagement.ts)
- [Permission System](../src/lib/permissions.ts)

---

## Notes

1. **Don't Delete Historical Docs:** Keep migration docs for reference even after updates
2. **Grace Period for Deprecated Code:** Allow 30 days before removing deprecated functions
3. **Database Comments:** Only update if column still exists in live database
4. **Testing Required:** Test all documentation examples before publishing updates

---

**Last Updated:** 2025-11-13
**Next Review:** After Task 1 (database verification) completion
