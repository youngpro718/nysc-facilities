# 🎯 ROLE-BASED DASHBOARD TESTING GUIDE

## ✅ What Was Fixed

### Problem
- Role changes weren't visible because dashboards weren't aligned with roles
- System only checked `access_level` (legacy) instead of `role` (new)
- No role-based routing - everyone went to same dashboard

### Solution
- Created `/src/utils/roleBasedRouting.ts` - maps each role to its dashboard
- Updated `useAuth.tsx` - redirects to role-specific dashboard after login
- Updated `ProtectedRoute.tsx` - checks `role` instead of `access_level`
- Updated `UserProfile` type - added `role` field

---

## 📊 ROLE → DASHBOARD MAPPING

| Role | Dashboard Path | Dashboard Name |
|------|---------------|----------------|
| **admin** | `/` | Admin Dashboard |
| **facilities_manager** | `/` | Facilities Dashboard (Admin UI) |
| **clerk** | `/court-operations` | Court Operations Dashboard |
| **supply_room_staff** | `/inventory` | Inventory Dashboard |
| **standard** | `/dashboard` | User Dashboard |

---

## 🧪 HOW TO TEST ROLE CHANGES

### Method 1: Change Role & Re-login (RECOMMENDED)

1. **As Admin:**
   - Go to "User Enhanced Management" or "Admin → User Management"
   - Select a user (e.g., John)
   - Click "Edit Role"
   - Change from "Standard User" to "Court Manager"
   - Save

2. **Log out and log back in as that user:**
   - The user will be redirected to `/court-operations` (Court Operations Dashboard)
   - Navigation menu will show court-specific options

3. **Change to different role:**
   - Change John to "Supply Room Staff"
   - Log out and log back in
   - Should redirect to `/inventory` (Inventory Dashboard)

### Method 2: Check Database Directly

```sql
-- Check user's current role
SELECT 
  p.email,
  p.role as profile_role,
  ur.role::text as user_roles_role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'john@example.com';
```

### Method 3: Check Browser Console

After logging in, open DevTools Console and look for:
```
[useAuth] User coming from login, redirecting to role-based dashboard
  role: "clerk"
  dashboard: "/court-operations"
```

---

## 🎭 TESTING EACH ROLE

### Test 1: Admin Role
**Steps:**
1. Change user to "Administrator"
2. Log in as that user
3. **Expected:** Redirects to `/` (Admin Dashboard)
4. **Expected:** Full navigation menu with all options
5. **Expected:** Can access all pages

### Test 2: Facilities Manager Role
**Steps:**
1. Change user to "Facility Coordinator"
2. Log in as that user
3. **Expected:** Redirects to `/` (same as admin)
4. **Expected:** Full admin-level access
5. **Expected:** Can manage spaces, operations, etc.

### Test 3: Court Manager (Clerk) Role
**Steps:**
1. Change user to "Court Manager"
2. Log in as that user
3. **Expected:** Redirects to `/court-operations`
4. **Expected:** Navigation shows court-related options
5. **Expected:** Can manage courts, keys, occupants
6. **Expected:** Cannot access spaces or facilities pages

### Test 4: Supply Room Staff Role
**Steps:**
1. Change user to "Supply Room Staff"
2. Log in as that user
3. **Expected:** Redirects to `/inventory`
4. **Expected:** Navigation shows inventory/supply options
5. **Expected:** Can manage inventory, supply requests, orders
6. **Expected:** Cannot access spaces, courts, or admin pages

### Test 5: Standard User Role
**Steps:**
1. Change user to "Standard User"
2. Log in as that user
3. **Expected:** Redirects to `/dashboard` (User Dashboard)
4. **Expected:** Limited navigation menu
5. **Expected:** Can only report issues, make requests
6. **Expected:** Cannot access admin, inventory, or court pages

---

## 🔍 VERIFICATION CHECKLIST

After changing a role, verify:

- [ ] User can log in successfully
- [ ] User is redirected to correct dashboard (see table above)
- [ ] Navigation menu shows appropriate options for role
- [ ] User can access pages allowed for their role
- [ ] User CANNOT access pages not allowed for their role
- [ ] Database shows role in both `profiles.role` and `user_roles.role`
- [ ] Both values are synced (same role in both tables)

---

## 🐛 TROUBLESHOOTING

### "I changed the role but dashboard didn't change"

**Solution:**
1. Log out completely
2. Clear browser cache (`Cmd + Shift + Delete`)
3. Log back in
4. Check browser console for redirect logs

### "User still sees old dashboard"

**Possible causes:**
1. Browser cache - clear it
2. Role not synced - check database:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'user@example.com';
   SELECT role FROM user_roles WHERE user_id = (SELECT id FROM profiles WHERE email = 'user@example.com');
   ```
3. Old session - log out and back in

### "Getting 'Access Denied' errors"

**Solution:**
1. Check if user's role is valid (one of the 5 allowed)
2. Check if `verification_status = 'verified'`
3. Check browser console for errors
4. Verify role exists in `user_roles` table

---

## 📝 QUICK TEST SCRIPT

Run this to test all 5 roles:

```sql
-- Test user: john@example.com

-- Test 1: Admin
UPDATE profiles SET role = 'admin' WHERE email = 'john@example.com';
UPDATE user_roles SET role = 'admin' WHERE user_id = (SELECT id FROM profiles WHERE email = 'john@example.com');
-- Log in → Should go to /

-- Test 2: Facilities Manager
UPDATE profiles SET role = 'facilities_manager' WHERE email = 'john@example.com';
UPDATE user_roles SET role = 'facilities_manager' WHERE user_id = (SELECT id FROM profiles WHERE email = 'john@example.com');
-- Log in → Should go to /

-- Test 3: Court Manager
UPDATE profiles SET role = 'clerk' WHERE email = 'john@example.com';
UPDATE user_roles SET role = 'clerk' WHERE user_id = (SELECT id FROM profiles WHERE email = 'john@example.com');
-- Log in → Should go to /court-operations

-- Test 4: Supply Room Staff
UPDATE profiles SET role = 'supply_room_staff' WHERE email = 'john@example.com';
UPDATE user_roles SET role = 'supply_room_staff' WHERE user_id = (SELECT id FROM profiles WHERE email = 'john@example.com');
-- Log in → Should go to /inventory

-- Test 5: Standard User
UPDATE profiles SET role = 'standard' WHERE email = 'john@example.com';
UPDATE user_roles SET role = 'standard' WHERE user_id = (SELECT id FROM profiles WHERE email = 'john@example.com');
-- Log in → Should go to /dashboard
```

---

## ✅ SUCCESS CRITERIA

A role change is successful when:

1. ✅ Role appears correctly in both UI dropdowns
2. ✅ Role is saved to `user_roles` table
3. ✅ Role is synced to `profiles.role`
4. ✅ User is redirected to correct dashboard after login
5. ✅ Navigation menu matches role permissions
6. ✅ User can access allowed pages
7. ✅ User cannot access forbidden pages

---

**🚀 The system now properly routes users to role-specific dashboards!**

**Test by changing a user's role and logging in as them to see the different dashboard.**
