# UI Architecture Verification Checklist

**Project:** NYSC Facilities Management System  
**Version:** 1.0.0  
**Date:** October 25, 2025  
**QA Focus:** Core Routes Architecture Verification

---

## 📋 Overview

This checklist verifies that the four core routes follow proper architectural patterns:
1. **Routing works correctly**
2. **Layout loads properly**
3. **States are visible and managed correctly**
4. **No direct fetches from components** (data fetching delegated to hooks)

---

## 🎯 Four Core Routes

### **1. Admin Dashboard** (`/`)
- **Component:** `AdminDashboard.tsx`
- **Protection:** ProtectedRoute (requireAdmin)
- **Layout:** Yes (wrapped in Layout component)
- **Module:** N/A (core admin route)

### **2. Spaces Management** (`/spaces`)
- **Component:** `Spaces.tsx`
- **Protection:** ProtectedRoute + ModuleProtectedRoute
- **Layout:** Yes (wrapped in Layout component)
- **Module:** `spaces`

### **3. Operations Hub** (`/operations`)
- **Component:** `Operations.tsx`
- **Protection:** ProtectedRoute + ModuleProtectedRoute
- **Layout:** Yes (wrapped in Layout component)
- **Module:** `operations`

### **4. Court Operations** (`/court-operations`)
- **Component:** `CourtOperationsDashboard.tsx`
- **Protection:** ProtectedRoute + ModuleProtectedRoute
- **Layout:** Yes (wrapped in Layout component)
- **Module:** `court_operations`

---

## ✅ Verification Checklist

### **A. Routing Verification**

#### **A1. Route Configuration**
- [ ] Route is defined in `App.tsx`
- [ ] Route path is correct and follows naming convention
- [ ] Route is wrapped in appropriate protection (ProtectedRoute)
- [ ] Module protection is applied if needed (ModuleProtectedRoute)
- [ ] Route is nested under Layout component
- [ ] No duplicate route definitions exist

#### **A2. Navigation**
- [ ] Route is accessible via direct URL
- [ ] Route is accessible via navigation menu
- [ ] Navigation highlights active route correctly
- [ ] Browser back/forward buttons work correctly
- [ ] Route redirects work as expected (if applicable)
- [ ] Deep linking works (can bookmark and return)

#### **A3. Route Protection**
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Non-admin users are redirected appropriately
- [ ] Module-disabled users see appropriate error message
- [ ] Protected routes check authentication on mount
- [ ] Auth state changes trigger appropriate redirects

---

### **B. Layout Verification**

#### **B1. Layout Component Loading**
- [ ] Layout component renders without errors
- [ ] Header/navigation bar displays correctly
- [ ] Sidebar (if applicable) displays correctly
- [ ] Footer (if applicable) displays correctly
- [ ] Layout is responsive (mobile, tablet, desktop)
- [ ] Layout maintains state across route changes

#### **B2. Page Component Loading**
- [ ] Page component mounts successfully
- [ ] Page component renders without console errors
- [ ] Page component displays loading state initially
- [ ] Page component transitions to loaded state
- [ ] Page component handles error states gracefully
- [ ] Page component unmounts cleanly (no memory leaks)

#### **B3. Layout Integration**
- [ ] Page content fits within layout boundaries
- [ ] Scrolling works correctly (page vs layout scroll)
- [ ] Page title updates in browser tab
- [ ] Breadcrumbs (if applicable) display correctly
- [ ] Page-specific actions appear in correct location
- [ ] Layout doesn't re-render unnecessarily on page change

---

### **C. State Management Verification**

#### **C1. Loading States**
- [ ] Initial loading state is visible (skeleton/spinner)
- [ ] Loading state shows appropriate message
- [ ] Loading state doesn't flash (minimum display time)
- [ ] Loading state clears when data arrives
- [ ] Multiple loading states don't overlap confusingly
- [ ] Loading indicators are accessible (aria-labels)

#### **C2. Data States**
- [ ] Empty state displays when no data exists
- [ ] Empty state provides helpful message/actions
- [ ] Populated state displays data correctly
- [ ] Data updates reflect in UI immediately
- [ ] Stale data is indicated or refreshed
- [ ] Data pagination/infinite scroll works correctly

#### **C3. Error States**
- [ ] Network errors display user-friendly messages
- [ ] Permission errors display appropriate messages
- [ ] Validation errors display inline where relevant
- [ ] Error boundaries catch component errors
- [ ] Error states provide recovery actions
- [ ] Errors are logged for debugging

#### **C4. Interactive States**
- [ ] Form inputs show validation states
- [ ] Buttons show loading/disabled states
- [ ] Hover states work on interactive elements
- [ ] Focus states are visible for accessibility
- [ ] Selected/active states are clear
- [ ] Optimistic updates work correctly

---

### **D. Data Fetching Architecture**

#### **D1. No Direct Fetches in Components**
- [ ] Component does NOT import `supabase` directly
- [ ] Component does NOT call `supabase.from()` directly
- [ ] Component does NOT contain `fetch()` calls
- [ ] Component does NOT contain `axios` calls
- [ ] Component does NOT have async data logic
- [ ] Component delegates all data fetching to hooks

#### **D2. Custom Hooks Usage**
- [ ] Component uses custom hooks for data fetching
- [ ] Hooks follow naming convention (`use*`)
- [ ] Hooks are located in appropriate directory
- [ ] Hooks use React Query for server state
- [ ] Hooks return loading, error, and data states
- [ ] Hooks handle caching appropriately

#### **D3. React Query Integration**
- [ ] Component uses `useQuery` for GET operations
- [ ] Component uses `useMutation` for POST/PUT/DELETE
- [ ] Query keys are properly structured
- [ ] Query invalidation works on mutations
- [ ] Optimistic updates are implemented where needed
- [ ] Stale time and cache time are configured

#### **D4. Service Layer**
- [ ] Data access is abstracted in service files
- [ ] Services handle Supabase queries
- [ ] Services return properly typed data
- [ ] Services handle errors appropriately
- [ ] Services are reusable across components
- [ ] Services don't contain UI logic

---

## 🔍 Detailed Route Verification

### **Route 1: Admin Dashboard (`/`)**

#### **Routing**
- [ ] Accessible at root URL `/`
- [ ] Redirects to `/login` if not authenticated
- [ ] Redirects non-admins to `/dashboard`
- [ ] Loads within Layout component
- [ ] Navigation highlights "Dashboard" menu item

#### **Layout**
- [ ] Header displays with user info
- [ ] Navigation menu displays
- [ ] Page title shows "Admin Dashboard"
- [ ] Responsive on all screen sizes
- [ ] No layout shift on load

#### **States**
- [ ] Shows loading skeletons for stats cards
- [ ] Displays building overview cards
- [ ] Shows module cards (Spaces, Operations, etc.)
- [ ] Displays recent activity/notifications
- [ ] Handles empty state (no data)
- [ ] Shows error message if data fetch fails

#### **Data Fetching**
- [ ] No direct `supabase` imports in `AdminDashboard.tsx`
- [ ] Uses `useAdminDashboardData` hook
- [ ] Uses `useBuildingData` hook
- [ ] Uses `useUserData` hook
- [ ] All hooks use React Query
- [ ] Data refreshes on window focus (if configured)

#### **Verification Commands**
```bash
# Check for direct supabase imports
grep -r "from.*supabase" src/pages/AdminDashboard.tsx

# Check for custom hooks usage
grep -r "use[A-Z]" src/pages/AdminDashboard.tsx

# Check React Query usage
grep -r "useQuery\|useMutation" src/pages/AdminDashboard.tsx
```

---

### **Route 2: Spaces Management (`/spaces`)**

#### **Routing**
- [ ] Accessible at `/spaces`
- [ ] Requires admin authentication
- [ ] Requires `spaces` module enabled
- [ ] Shows module disabled message if not enabled
- [ ] Loads within Layout component
- [ ] Navigation highlights "Spaces" menu item

#### **Layout**
- [ ] Page header displays "Spaces Management"
- [ ] Tab navigation displays (Rooms, Infrastructure, Floor Plan)
- [ ] Building selector displays in header
- [ ] Action buttons display (Create Room, etc.)
- [ ] Responsive layout on mobile
- [ ] Floor plan viewer loads correctly

#### **States**
- [ ] Shows loading state for rooms list
- [ ] Displays room cards in grid layout
- [ ] Shows empty state when no rooms exist
- [ ] Displays building filter state
- [ ] Shows floor filter state
- [ ] Handles room creation/edit states
- [ ] Shows success/error toasts

#### **Data Fetching**
- [ ] No direct `supabase` imports in `Spaces.tsx`
- [ ] Uses `useSpaces` or `useRooms` hook
- [ ] Uses `useBuildings` hook
- [ ] Uses `useFloors` hook
- [ ] All hooks use React Query
- [ ] Mutations invalidate relevant queries
- [ ] Optimistic updates work for room edits

#### **Verification Commands**
```bash
# Check for direct supabase imports
grep -r "from.*supabase" src/pages/Spaces.tsx

# Check for custom hooks
grep -r "useSpaces\|useRooms\|useBuildings" src/pages/Spaces.tsx

# Check for direct fetches
grep -r "supabase.from\|fetch\|axios" src/pages/Spaces.tsx
```

---

### **Route 3: Operations Hub (`/operations`)**

#### **Routing**
- [ ] Accessible at `/operations`
- [ ] Requires admin authentication
- [ ] Requires `operations` module enabled
- [ ] Legacy `/issues` redirects to `/operations?tab=issues`
- [ ] Legacy `/maintenance` redirects to `/operations?tab=maintenance`
- [ ] Loads within Layout component
- [ ] Navigation highlights "Operations" menu item

#### **Layout**
- [ ] Page header displays "Operations Hub"
- [ ] Tab navigation displays (Issues, Maintenance, Supply Requests)
- [ ] Building filter displays
- [ ] Action buttons display per tab
- [ ] Responsive layout on mobile
- [ ] Tab state persists in URL

#### **States**
- [ ] Shows loading state for issues/maintenance
- [ ] Displays compact room cards (8 per row)
- [ ] Shows empty state when no issues exist
- [ ] Displays filter states (status, priority, building)
- [ ] Shows quick action hover states
- [ ] Handles issue creation/edit states
- [ ] Shows success/error toasts

#### **Data Fetching**
- [ ] No direct `supabase` imports in `Operations.tsx`
- [ ] Uses `useIssues` hook
- [ ] Uses `useMaintenanceSchedule` hook
- [ ] Uses `useSupplyRequests` hook
- [ ] Uses `useBuildingData` hook
- [ ] All hooks use React Query
- [ ] Mutations invalidate relevant queries

#### **Verification Commands**
```bash
# Check for direct supabase imports
grep -r "from.*supabase" src/pages/Operations.tsx

# Check for custom hooks
grep -r "useIssues\|useMaintenance\|useSupply" src/pages/Operations.tsx

# Check for direct fetches
grep -r "supabase.from\|fetch\|axios" src/pages/Operations.tsx
```

---

### **Route 4: Court Operations (`/court-operations`)**

#### **Routing**
- [ ] Accessible at `/court-operations`
- [ ] Requires admin authentication
- [ ] Requires `court_operations` module enabled
- [ ] Loads within Layout component
- [ ] Navigation highlights "Court Operations" menu item
- [ ] Gavel icon displays in navigation

#### **Layout**
- [ ] Page header displays "Court Operations"
- [ ] Tab navigation displays (Status, Shutdowns, Assignments, Terms, Maintenance)
- [ ] Upload Term button displays
- [ ] Courtroom list displays (32 courtrooms)
- [ ] Responsive layout on mobile
- [ ] Tab state persists in URL

#### **States**
- [ ] Shows loading state for courtrooms
- [ ] Displays courtroom status cards
- [ ] Shows empty state when no terms exist
- [ ] Displays term selection state
- [ ] Shows assignment dropdown states (justice, clerks, sergeant)
- [ ] Handles term upload states
- [ ] Shows success/error toasts

#### **Data Fetching**
- [ ] No direct `supabase` imports in `CourtOperationsDashboard.tsx`
- [ ] Uses `useCourtRooms` hook
- [ ] Uses `useCourtTerms` hook
- [ ] Uses `useCourtAssignments` hook
- [ ] Uses `useCourtPersonnel` hook
- [ ] All hooks use React Query
- [ ] Mutations invalidate relevant queries
- [ ] Personnel dropdowns populated from hooks

#### **Verification Commands**
```bash
# Check for direct supabase imports
grep -r "from.*supabase" src/pages/CourtOperationsDashboard.tsx

# Check for custom hooks
grep -r "useCourt" src/pages/CourtOperationsDashboard.tsx

# Check for direct fetches
grep -r "supabase.from\|fetch\|axios" src/pages/CourtOperationsDashboard.tsx
```

---

## 🧪 Testing Procedures

### **Manual Testing**

#### **Test 1: Route Access**
1. Open browser in incognito mode
2. Navigate to route URL directly
3. Verify redirect to `/login`
4. Login with test credentials
5. Verify redirect to intended route
6. Verify layout loads correctly

#### **Test 2: Navigation Flow**
1. Login as admin user
2. Click navigation menu item
3. Verify route changes
4. Verify URL updates
5. Verify page content loads
6. Click browser back button
7. Verify previous page loads

#### **Test 3: Loading States**
1. Open DevTools Network tab
2. Throttle network to "Slow 3G"
3. Navigate to route
4. Verify loading skeleton displays
5. Wait for data to load
6. Verify loading state clears
7. Verify data displays correctly

#### **Test 4: Error States**
1. Open DevTools Network tab
2. Block network requests to Supabase
3. Navigate to route
4. Verify error message displays
5. Verify error provides recovery action
6. Unblock network
7. Verify retry works

#### **Test 5: Module Protection**
1. Login as user with module disabled
2. Navigate to module route
3. Verify module disabled message
4. Verify no data fetching occurs
5. Enable module in admin profile
6. Verify route becomes accessible

### **Automated Testing**

#### **Component Tests**
```typescript
// Example test for AdminDashboard
describe('AdminDashboard', () => {
  it('renders without crashing', () => {
    render(<AdminDashboard />);
  });

  it('shows loading state initially', () => {
    render(<AdminDashboard />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('displays data after loading', async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Building Overview')).toBeInTheDocument();
    });
  });

  it('does not import supabase directly', () => {
    const fileContent = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
    expect(fileContent).not.toContain('from "@/lib/supabase"');
  });
});
```

#### **Integration Tests**
```typescript
// Example integration test
describe('Spaces Route Integration', () => {
  it('loads spaces page with data', async () => {
    const { user } = await loginAsAdmin();
    await user.click(screen.getByText('Spaces'));
    
    await waitFor(() => {
      expect(screen.getByText('Spaces Management')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('rooms-grid')).toBeInTheDocument();
  });
});
```

---

## 📊 Verification Results Template

### **Route:** [Route Name]
**Date Tested:** [Date]  
**Tester:** [Name]  
**Environment:** [Dev/Staging/Production]

| Category | Item | Status | Notes |
|----------|------|--------|-------|
| Routing | Route accessible | ✅/❌ | |
| Routing | Protection works | ✅/❌ | |
| Layout | Layout loads | ✅/❌ | |
| Layout | Responsive | ✅/❌ | |
| States | Loading state | ✅/❌ | |
| States | Data state | ✅/❌ | |
| States | Error state | ✅/❌ | |
| Data | No direct fetches | ✅/❌ | |
| Data | Uses custom hooks | ✅/❌ | |
| Data | React Query integration | ✅/❌ | |

**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

**Issues Found:**
1. [Issue description]
2. [Issue description]

**Recommendations:**
1. [Recommendation]
2. [Recommendation]

---

## 🔧 Common Issues & Solutions

### **Issue 1: Direct Supabase Imports**
**Problem:** Component imports `supabase` directly  
**Detection:** `grep -r "from.*supabase" src/pages/`  
**Solution:** Create custom hook, move query to hook  
**Example:**
```typescript
// ❌ Bad - Direct import in component
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('rooms').select('*');

// ✅ Good - Use custom hook
const { data, isLoading } = useRooms();
```

### **Issue 2: Missing Loading States**
**Problem:** Component shows blank screen while loading  
**Detection:** Manual testing with slow network  
**Solution:** Add loading skeleton/spinner  
**Example:**
```typescript
// ✅ Good - Show loading state
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

### **Issue 3: No Error Handling**
**Problem:** Component crashes on data fetch error  
**Detection:** Block network and test  
**Solution:** Add error boundary and error states  
**Example:**
```typescript
// ✅ Good - Handle errors
if (error) {
  return (
    <ErrorMessage 
      error={error} 
      onRetry={() => refetch()}
    />
  );
}
```

### **Issue 4: Module Protection Not Working**
**Problem:** Route accessible when module disabled  
**Detection:** Disable module and test access  
**Solution:** Wrap route in ModuleProtectedRoute  
**Example:**
```typescript
// ✅ Good - Module protection
<Route path="/spaces" element={
  <ProtectedRoute requireAdmin>
    <ModuleProtectedRoute moduleKey="spaces">
      <Spaces />
    </ModuleProtectedRoute>
  </ProtectedRoute>
} />
```

---

## 📈 Success Criteria

### **Route is considered VERIFIED when:**
- ✅ All routing checks pass (A1-A3)
- ✅ All layout checks pass (B1-B3)
- ✅ All state checks pass (C1-C4)
- ✅ All data fetching checks pass (D1-D4)
- ✅ No direct `supabase` imports in component
- ✅ All data fetching uses custom hooks
- ✅ All hooks use React Query
- ✅ Loading, error, and empty states work
- ✅ Route protection works correctly
- ✅ Layout loads without errors
- ✅ Responsive on all screen sizes
- ✅ No console errors or warnings

### **Project is considered ARCHITECTURE-COMPLIANT when:**
- ✅ All four core routes pass verification
- ✅ No components have direct data fetching
- ✅ All data access goes through hooks
- ✅ All hooks use React Query
- ✅ Service layer properly abstracts Supabase
- ✅ Consistent patterns across all routes
- ✅ Proper error handling everywhere
- ✅ Loading states implemented consistently

---

## 📞 Support & Resources

### **Documentation**
- **Brownfield Analysis:** `/docs/BROWNFIELD_ANALYSIS.md`
- **Architecture Diagrams:** `/docs/ARCHITECTURE_DIAGRAM.md`
- **Quick Reference:** `/docs/QUICK_REFERENCE.md`

### **Code Examples**
- **Custom Hooks:** `/src/hooks/`
- **Services:** `/src/services/`
- **Components:** `/src/components/`
- **Pages:** `/src/pages/`

### **Testing Resources**
- **React Testing Library:** https://testing-library.com/react
- **React Query Testing:** https://tanstack.com/query/latest/docs/react/guides/testing
- **Vitest:** https://vitest.dev/

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-25 | Initial checklist created |

---

**QA Lead:** QA Team  
**Last Updated:** October 25, 2025  
**Status:** Active  
**Next Review:** November 1, 2025
