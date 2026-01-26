# CMC Dashboard & Court Operations Audit

## CMC Dashboard (`/cmc-dashboard`)

### Current State - IMPROVED ✅

**Changes Made:**
- ✅ Added "Request Supplies" button in header
- ✅ Fixed quick actions to include proper supply request links
- ✅ Stats cards now show real data from database
- ✅ Cards are clickable and navigate to relevant pages
- ✅ Added badges showing active counts

**Quick Actions (4 total):**
1. **Court Operations** → `/court-operations`
2. **Report Issue** → `/my-issues`
3. **Request Supplies** → `/request/supplies`
4. **My Supply Requests** → `/my-supply-requests`

**Stats Cards:**
- Active Courtrooms (static for now)
- My Issues (real count from database)
- My Supply Requests (real count from database)
- Upcoming Terms (static for now)

### Remaining Improvements
- [ ] Fetch real courtroom counts from database
- [ ] Fetch upcoming terms from database
- [ ] Add recent activity from actual database events
- [ ] Add notification bell for new updates

---

## Court Operations Dashboard (`/court-operations`)

### Current State

**Tabs:**
1. **Today's Status** - Shows today's court sessions
2. **Daily Sessions** - Session management
3. **Full Assignments** - Personnel assignments (glows when attention needed)
4. **Management Tools** - Staff absences, live grid, conflict detection

**Issues Identified:**
- ❌ No quick way to request supplies from this page
- ❌ No link back to CMC dashboard
- ❌ "Open Live Grid" button could be more prominent
- ❌ No summary stats at top of page

### Recommended Improvements
- [ ] Add "Request Supplies" button to header
- [ ] Add breadcrumb navigation
- [ ] Add summary stats (sessions today, issues, etc.)
- [ ] Consider consolidating with CMC dashboard features

---

## Role Permissions for CMC

From `useRolePermissions.ts`:
```typescript
cmc: {
  spaces: null,
  issues: 'write',
  occupants: 'read',
  inventory: null,
  supply_requests: 'write',  // Can create supply requests
  supply_orders: null,
  keys: 'write',
  lighting: null,
  maintenance: null,
  court_operations: 'write',
  operations: 'write',
  dashboard: 'read',
}
```

**CMC Can:**
- ✅ Create and view supply requests
- ✅ Report and track issues
- ✅ Manage court operations
- ✅ Request keys
- ✅ View occupant info

**CMC Cannot:**
- ❌ Manage inventory directly
- ❌ Fulfill supply orders
- ❌ Manage spaces
- ❌ Manage lighting

---

## Navigation for CMC Role

From `getRoleBasedNavigation`:
```typescript
if (userRole === 'cmc') {
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'Court Operations', icon: Gavel },
    { title: 'My Requests', icon: FileText },
    { title: 'My Issues', icon: MessageSquare },
    { type: "separator" },
    { title: 'Profile', icon: User },
  ];
}
```

### Navigation Issues
- ❌ "My Requests" is ambiguous - could be keys or supplies
- ❌ No direct link to supply request form in nav

### Recommended Navigation Update
```typescript
if (userRole === 'cmc') {
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'Court Operations', icon: Gavel },
    { title: 'Request Supplies', icon: Package },
    { title: 'My Supply Requests', icon: FileText },
    { title: 'My Issues', icon: MessageSquare },
    { type: "separator" },
    { title: 'Profile', icon: User },
  ];
}
```

---

## Summary of Changes Made

### CMC Dashboard
1. Added real data fetching for supply requests and issues
2. Added "Request Supplies" button in header
3. Fixed quick actions with proper routes
4. Made stats cards clickable
5. Added badges for active items
6. Updated grid layout for 4 quick actions

### Files Modified
- `src/pages/CMCDashboard.tsx`

### Files to Update (Future)
- `src/config/routes.ts` - Update CMC navigation
- `src/pages/CourtOperationsDashboard.tsx` - Add supply request button
