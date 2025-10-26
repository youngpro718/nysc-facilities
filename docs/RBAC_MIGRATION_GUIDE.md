# RBAC Migration Guide

**Date:** October 26, 2025  
**Migration:** `012_add_rbac_roles.sql`  
**Purpose:** Add new RBAC roles to the database

---

## 🎯 **Overview**

This migration adds 3 new roles to support comprehensive role-based access control:
- **CMC** (Court Management Coordinator)
- **Court Aide** (Supply Staff)
- **Purchasing Staff**

---

## 📋 **Pre-Migration Checklist**

- [ ] Backup database
- [ ] Review current user roles
- [ ] Identify users who need new roles
- [ ] Test migration on development environment
- [ ] Notify affected users

---

## 🚀 **Migration Steps**

### **Step 1: Apply Migration**

**Via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `db/migrations/012_add_rbac_roles.sql`
3. Run the migration
4. Verify no errors

**Via Supabase CLI:**
```bash
supabase db push
```

**Via Direct SQL:**
```bash
psql $DATABASE_URL -f db/migrations/012_add_rbac_roles.sql
```

---

### **Step 2: Verify Migration**

Run this query to check current role distribution:

```sql
SELECT 
  role, 
  COUNT(*) as user_count,
  ARRAY_AGG(email ORDER BY email) as users
FROM public.profiles 
GROUP BY role 
ORDER BY user_count DESC;
```

Expected output:
- All existing roles should still be present
- No constraint violations
- Index created successfully

---

### **Step 3: Assign New Roles**

#### **Option A: Manual Assignment (Recommended for initial setup)**

```sql
-- Assign CMC role
UPDATE public.profiles 
SET role = 'cmc' 
WHERE email IN (
  'manager1@court.gov',
  'manager2@court.gov'
);

-- Assign Court Aide role
UPDATE public.profiles 
SET role = 'court_aide' 
WHERE email IN (
  'aide1@court.gov',
  'aide2@court.gov',
  'aide3@court.gov'
);

-- Assign Purchasing Staff role
UPDATE public.profiles 
SET role = 'purchasing_staff' 
WHERE email IN (
  'purchasing1@court.gov',
  'purchasing2@court.gov'
);
```

#### **Option B: Bulk Assignment by Department**

```sql
-- Assign based on department
UPDATE public.profiles p
SET role = 'court_aide'
FROM departments d
WHERE p.department_id = d.id
  AND d.name = 'Supply Department';

UPDATE public.profiles p
SET role = 'purchasing_staff'
FROM departments d
WHERE p.department_id = d.id
  AND d.name = 'Purchasing Department';
```

---

### **Step 4: Verify User Access**

After assigning roles, have users test their access:

**CMC Users:**
- [ ] Can access CMC Dashboard (`/cmc-dashboard`)
- [ ] Can access Court Operations
- [ ] Can submit supply requests
- [ ] Cannot access keys, occupants, spaces

**Court Aide Users:**
- [ ] Can access Court Aide Dashboard (`/court-aide-dashboard`)
- [ ] Can create supply orders
- [ ] Can fulfill supply requests
- [ ] Can manage inventory
- [ ] Cannot access court operations

**Purchasing Staff Users:**
- [ ] Can access Purchasing Dashboard (`/purchasing-dashboard`)
- [ ] Can view inventory (read-only)
- [ ] Can view supply room (read-only)
- [ ] Cannot create supply orders

---

## 🔄 **Rollback Plan**

If issues occur, rollback with:

```sql
-- Rollback: Remove new role constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Restore original constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin',
  'facilities_manager',
  'judge',
  'clerk',
  'sergeant',
  'court_officer',
  'bailiff',
  'court_reporter',
  'administrative_assistant',
  'supply_room_staff',
  'standard',
  'coordinator',
  'it_dcas',
  'viewer'
));

-- Revert users to old roles
UPDATE public.profiles SET role = 'admin' WHERE role = 'cmc';
UPDATE public.profiles SET role = 'supply_room_staff' WHERE role = 'court_aide';
UPDATE public.profiles SET role = 'standard' WHERE role = 'purchasing_staff';
```

---

## 📊 **Role Mapping Reference**

### **New Roles:**

| Role | Access | Dashboard |
|------|--------|-----------|
| `cmc` | Court operations only | `/cmc-dashboard` |
| `court_aide` | Supply orders, room, inventory | `/court-aide-dashboard` |
| `purchasing_staff` | View inventory & supply room | `/purchasing-dashboard` |

### **Legacy Role Mapping:**

| Old Role | New Role | Notes |
|----------|----------|-------|
| `coordinator` | `admin` | Full access maintained |
| `it_dcas` | `admin` | Full access maintained |
| `viewer` | `standard` | Basic access maintained |
| `supply_room_staff` | `court_aide` | Enhanced with supply orders |

---

## ⚠️ **Important Notes**

### **Breaking Changes:**
- None - all existing roles remain valid
- New roles are additive only

### **Backward Compatibility:**
- ✅ All existing roles still work
- ✅ Legacy role mapping function provided
- ✅ No user access disruption

### **Security:**
- ✅ Role constraint enforced at database level
- ✅ Permission checks in application code
- ✅ Route protection implemented

---

## 🧪 **Testing Checklist**

### **Database Level:**
- [ ] Migration runs without errors
- [ ] Constraint allows all new roles
- [ ] Index created successfully
- [ ] Helper function works

### **Application Level:**
- [ ] CMC users see correct dashboard
- [ ] Court Aide users see correct dashboard
- [ ] Purchasing users see correct dashboard
- [ ] Navigation shows correct items per role
- [ ] Route protection works correctly

### **Permission Level:**
- [ ] CMC can access court operations
- [ ] Court Aide can manage supply orders
- [ ] Purchasing can view but not edit
- [ ] Unauthorized access blocked

---

## 📞 **Support**

### **Common Issues:**

**Issue:** "Role constraint violation"
- **Solution:** Check role name spelling, must match exactly

**Issue:** "User can't access dashboard"
- **Solution:** Verify role assignment in database, check route protection

**Issue:** "Navigation not showing correct items"
- **Solution:** Clear browser cache, verify role in useRolePermissions hook

---

## 📈 **Post-Migration**

### **Monitoring:**
```sql
-- Check role distribution
SELECT role, COUNT(*) 
FROM public.profiles 
GROUP BY role;

-- Check users with new roles
SELECT email, role, created_at 
FROM public.profiles 
WHERE role IN ('cmc', 'court_aide', 'purchasing_staff')
ORDER BY created_at DESC;

-- Check for any null roles
SELECT COUNT(*) as null_roles 
FROM public.profiles 
WHERE role IS NULL;
```

### **Cleanup:**
```sql
-- Remove unused legacy roles (ONLY after confirming no users)
-- UPDATE public.profiles SET role = 'admin' WHERE role = 'coordinator';
-- UPDATE public.profiles SET role = 'admin' WHERE role = 'it_dcas';
-- UPDATE public.profiles SET role = 'standard' WHERE role = 'viewer';
```

---

## ✅ **Success Criteria**

- [ ] Migration applied successfully
- [ ] All users assigned appropriate roles
- [ ] Users can access their dashboards
- [ ] Navigation shows correct items
- [ ] Permissions enforced correctly
- [ ] No unauthorized access possible
- [ ] No errors in application logs

---

## 📚 **Additional Resources**

**Documentation:**
- RBAC Strategy: `docs/RBAC_STRATEGY.md`
- Implementation Guide: `docs/RBAC_IMPLEMENTATION_COMPLETE.md`
- Migration Script: `db/migrations/012_add_rbac_roles.sql`

**Code References:**
- Permissions: `src/hooks/useRolePermissions.ts`
- Navigation: `src/components/layout/config/navigation.tsx`
- Routes: `src/App.tsx`

---

**Migration Created:** October 26, 2025  
**Estimated Time:** 15-30 minutes  
**Risk Level:** Low (additive only, no breaking changes)  
**Rollback Available:** Yes
