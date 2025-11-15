# CLEAN MIGRATION - STATUS UPDATE

## ✅ COMPLETED

### Phase 1: Database Cleanup
- ✅ Fixed broken user (jbitkowe@nycourts.gov) - changed from 'cmc' to 'admin'
- ✅ Added CHECK constraints to only allow 5 roles
- ✅ All 8 users now have valid roles and are synced

### Phase 2: Single Source of Truth
- ✅ Created `/src/config/roles.ts` with:
  - `UserRole` type (5 roles only)
  - `SYSTEM_ROLES` array with labels, descriptions, colors
  - Helper functions: `getRoleLabel()`, `getRoleBadgeClasses()`, etc.

### Phase 3: UI Components (Partial)
- ✅ Updated `UserManagementTab.tsx` - uses SYSTEM_ROLES
- ✅ Updated `EditUserDialog.tsx` - uses SYSTEM_ROLES
- ✅ Updated `AllUsersSection.tsx` - uses SYSTEM_ROLES

## ⚠️ NEEDS COMPLETION

### Phase 3: Remaining UI Components
Need to update these files to use `/src/config/roles.ts`:

1. **`useRolePermissions.ts`** - Remove old role permissions for invalid roles
   - Keep only: admin, facilities_manager, clerk, supply_room_staff, standard
   - Remove: cmc, court_aide, purchasing_staff, judge, sergeant, court_officer, bailiff, court_reporter, administrative_assistant

2. **`EnhancedPersonnelManagement.tsx`** - Update role dropdown

3. **`TitleAccessManager.tsx`** - Update role list

4. **Other files** (58 total found) - Search and replace:
   - Replace `AVAILABLE_ROLES` with `SYSTEM_ROLES`
   - Replace `CourtRole` type usage with `UserRole`
   - Remove references to invalid roles

### Phase 4: Build & Test
- Rebuild application
- Test role assignment in both UIs
- Test role display
- Test permissions

## 🔧 QUICK FIX TO COMPLETE

Run these commands:

```bash
# 1. Fix useRolePermissions.ts - remove invalid role mappings
# Edit the file to only include these 5 roles in rolePermissionsMap:
# - admin
# - facilities_manager  
# - clerk
# - supply_room_staff
# - standard

# 2. Search for all AVAILABLE_ROLES and replace with SYSTEM_ROLES
grep -r "AVAILABLE_ROLES" src/ --include="*.tsx" --include="*.ts"

# 3. Build
npm run build

# 4. Restart preview
pkill -f "vite preview" && npm run preview
```

## 📝 MANUAL EDITS NEEDED

### File: `/src/hooks/useRolePermissions.ts`

Remove these role mappings (lines 68-207):
- cmc
- court_aide
- purchasing_staff
- judge
- sergeant
- court_officer
- bailiff
- court_reporter
- administrative_assistant

Keep only:
- admin (lines 54-67)
- facilities_manager (lines 208-221)
- supply_room_staff (lines 222-235)
- clerk (lines 124-137)
- standard (lines 236-249)

Also update line 360 and 464-465 to remove invalid role checks.

## 🎯 EXPECTED RESULT

After completion:
- Only 5 roles appear in all dropdowns
- No TypeScript errors
- Database enforces 5 roles only
- All components use same role config
- Clean, maintainable codebase
