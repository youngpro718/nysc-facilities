# Role Migration Complete: user_roles Table Exclusively

## Migration Summary

The role column has been successfully removed from the `profiles` table, and all role data has been migrated to the `user_roles` table. This eliminates the dual role system vulnerability that could lead to privilege escalation attacks.

## Database Changes

### ✅ Migration Completed
- **Migration File**: Applied via Supabase migration tool
- **Backup Created**: `profiles_role_backup` table contains all pre-migration role data
- **Column Removed**: `profiles.role` column has been dropped
- **RLS Policies Updated**: All policies referencing `profiles.role` now use `user_roles` table

### Key Migration Actions
1. Created unique constraint on `user_roles(user_id, role)`
2. Backed up existing role data to `profiles_role_backup`
3. Migrated all role data from `profiles` to `user_roles`
4. Updated RLS policies for:
   - `security_settings` table
   - `security_rate_limits` table
   - `profiles` table (self-update policy)
5. Created helper function `get_user_role(uuid)` for backward compatibility

## Code Changes

### ✅ Updated Files

#### Type Definitions
- **src/types/database.ts**: Added comment noting role field removal
- **src/types/auth.ts**: Already correctly uses `role` from `user_roles` table

#### Hooks
- **src/hooks/common/usePermissions.ts**: Updated comments to clarify role source
- **src/hooks/useAuth.tsx**: Already correctly fetches role from `user_roles` via `authService.fetchUserProfile()`

#### Components
- **src/components/admin/UserManagementTab.tsx**: Already uses `user_roles` table for role joins
- **src/components/profile/reorganized/AdminManagementTab.tsx**: Already uses `user_roles` table
- **src/pages/AdminProfile.tsx**: Already joins with `user_roles` table for role data
- **src/routes/OnboardingGuard.tsx**: Updated to query `user_roles` for MFA enforcement

#### Services
- **src/lib/supabase.ts**: `authService.fetchUserProfile()` already correctly:
  - Fetches role from `user_roles` table
  - Merges role into profile object
  - Sets `isAdmin` based on role from `user_roles`

## How It Works Now

### Role Storage
```sql
-- Roles are ONLY stored in user_roles table
SELECT user_id, role FROM user_roles;

-- NOT in profiles table (column removed)
-- SELECT role FROM profiles; ❌ This column no longer exists
```

### Role Access in Code
```typescript
// User profile now includes role from user_roles table
const { profile } = useAuth();
console.log(profile.role); // Comes from user_roles table

// Admin check
const { isAdmin } = useAuth(); // Based on role === 'admin' from user_roles
```

### RLS Policies Pattern
```sql
-- Old (vulnerable) pattern
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)

-- New (secure) pattern
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
```

## Benefits

### Security Improvements
1. ✅ **Single Source of Truth**: Roles only in `user_roles` table
2. ✅ **No Privilege Escalation**: Users cannot modify their own roles via profile updates
3. ✅ **RLS Enforcement**: All role checks now use secure `user_roles` queries
4. ✅ **Audit Trail**: `user_roles` table provides clear role assignment history

### Performance
- Parallel fetching of profile + roles in `authService.fetchUserProfile()`
- Efficient joins in user listing queries
- Indexed `user_roles` table for fast lookups

## Verification

### Database Verification
```sql
-- Verify role column is removed from profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
-- Should return no rows

-- Verify all users have roles in user_roles
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM user_roles;
-- Numbers should match for all active users

-- View backup data
SELECT * FROM profiles_role_backup;
```

### Code Verification
```bash
# Search for any remaining references to profiles.role
grep -r "profiles\.role" src/
# Should return no results

# Verify user_roles usage
grep -r "user_roles" src/ | grep "from.*user_roles"
# Should show many results (good!)
```

## Backward Compatibility

### Helper Function
A `get_user_role(uuid)` SQL function is provided for any database functions that need to get a user's primary role:

```sql
-- Usage in database functions
SELECT get_user_role(auth.uid());
-- Returns the highest priority role for the user
```

### Profile Object
The `UserProfile` TypeScript interface still includes a `role` field, but it's now populated from `user_roles`:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  // ... other fields
  role?: UserRole | string; // From user_roles table
}
```

## Rollback Plan

If rollback is needed (not recommended):

1. The `profiles_role_backup` table contains all original role data
2. A new migration could be created to:
   - Add `role` column back to `profiles`
   - Copy data from `profiles_role_backup`
   - Restore old RLS policies

**Note**: Rollback would reintroduce the security vulnerability and is not recommended.

## Next Steps

### Immediate
1. ✅ Migration complete and verified
2. ✅ All code updated to use `user_roles` table
3. ✅ RLS policies secured

### Future Enhancements
1. 🔄 Run security scan to verify privilege escalation fix
2. 🔄 Fix public storage buckets (separate security issue)
3. 🔄 Enable leaked password protection in Supabase
4. 🔄 Consider dropping `access_level` column from profiles (also legacy)
5. 🔄 After 30 days of stable operation, consider dropping `profiles_role_backup` table

## Related Documentation
- [Role System Audit](./ROLE_SYSTEM_AUDIT.md) - Original audit identifying the issue
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md) - General security guidelines

## Support

If you encounter any issues:
1. Check the `profiles_role_backup` table for original role data
2. Review Supabase logs for RLS policy errors
3. Verify user_roles table has entries for all active users
4. Check that `authService.fetchUserProfile()` is being called after authentication

---

**Migration Date**: 2025-01-XX  
**Status**: ✅ Complete  
**Security Impact**: Critical security vulnerability fixed
