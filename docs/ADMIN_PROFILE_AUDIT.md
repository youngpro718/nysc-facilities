# AdminProfile.tsx Full Audit Report

**File:** `src/pages/AdminProfile.tsx`  
**Lines:** 788  
**Generated:** November 25, 2025

---

## 🔴 Critical Issues

### 1. File Size - 788 Lines
This file is too large and violates single-responsibility principle. Should be split into:
- `AdminProfileHeader.tsx` - Header, QR code, install app section
- `UserManagementTab.tsx` - User list, filtering, actions (lines 440-746)
- `UserStatsCards.tsx` - Statistics cards (lines 462-536)
- `PendingUsersAlert.tsx` - Pending approval banner (lines 538-565)
- `UserListCard.tsx` - Individual user card component (lines 617-742)

### 2. Console.log Statements in Production
```typescript
// Line 122-126
console.log('Loaded users with roles:', usersWithRoles.map(u => ({ 
  name: `${u.first_name} ${u.last_name}`, 
  email: u.email,
  role: u.role 
})));

// Line 222
console.log('RPC Response:', { data, error });

// Line 246
console.log('Role updated successfully for user:', userId, 'to role:', newRole);
```
**Risk:** Leaks user data to browser console

### 3. Direct Supabase Calls Instead of Hooks
Lines 102-126 make direct Supabase calls. Should use React Query hooks for:
- Caching
- Automatic refetching
- Loading states
- Error handling

---

## 🟠 High Priority Issues

### 4. Duplicate Statistics Calculation
Statistics are calculated inline multiple times:
```typescript
// Line 412-414 (tab badge)
users.filter(u => u.verification_status === 'pending' || !u.is_approved).length

// Line 492 (card)
users.filter(u => u.verification_status === 'pending' || !u.is_approved).length

// Line 505 (card)
users.filter(u => u.verification_status === 'verified' && u.is_approved && !u.is_suspended).length

// Line 518 (card)
users.filter(u => u.is_suspended).length

// Line 531 (card)
users.filter(u => u.role === 'admin').length

// Line 539, 549 (alert)
users.filter(u => u.verification_status === 'pending' || !u.is_approved).length
```
**Fix:** Calculate once with useMemo

### 5. Missing Error Boundaries
No error boundary wrapping the component. If any child component throws, the entire admin panel crashes.

### 6. No Loading Skeleton
Lines 607-609 show a simple spinner. Should use proper skeleton UI for better UX.

### 7. Hardcoded Role Colors
Lines 719-726 have hardcoded color mapping. Should use a constant or utility function.

---

## 🟡 Medium Priority Issues

### 8. Type Safety Issues
```typescript
// Line 119 - Type assertion
department: (profile as any).department,

// Line 230 - Unsafe type check
if (data && typeof data === 'object' && 'success' in data && !data.success)
```

### 9. Missing Accessibility
- No `aria-label` on icon-only buttons (lines 320-327, 577-585)
- No keyboard navigation for user cards
- No screen reader announcements for status changes

### 10. Inefficient Re-renders
- `filteredUsers` recalculates on every render (line 256)
- User cards don't have proper memoization
- Statistics cards trigger re-renders on filter change

### 11. Magic Numbers/Strings
```typescript
// Line 236 - Magic number
await new Promise(resolve => setTimeout(resolve, 500));

// Line 360 - Magic number
size={180}
```

### 12. Unused Imports
```typescript
// Line 1 - Some icons may be unused
import { ChevronLeft, Download, Copy, Check, Users, Shield, FileText, Settings as SettingsIcon, Activity, AlertTriangle, QrCode, AlertCircle, Search, RefreshCw, MoreVertical, Edit, Mail, KeyRound, UserX, UserCheck, Ban, CheckCircle, Clock, Unlock } from 'lucide-react';
```
`Edit`, `KeyRound`, `AlertCircle` appear unused.

### 13. Missing Breadcrumb
No `<Breadcrumb />` component for consistent navigation.

---

## 🟢 Low Priority / Code Style

### 14. Inconsistent Naming
- `handleManualRefresh` vs `handleApproveUser` (some have "handle" prefix, some don't)
- `loadUsers` vs `loadCurrentUser` (both are async but naming doesn't indicate)

### 15. Long JSX Blocks
The user card JSX (lines 617-742) is 125 lines. Should be extracted.

### 16. Inline Styles
```typescript
// Line 443
className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
```
Should use CSS classes or Tailwind config.

### 17. Missing PropTypes/Interface for Sub-components
The inline user card rendering doesn't have a proper interface.

---

## 📊 Metrics Summary

| Metric | Current | Target |
|--------|---------|--------|
| File lines | 788 | < 300 |
| Console.logs | 3 | 0 |
| `any` types | 2 | 0 |
| Inline filters | 6 | 1 (memoized) |
| Magic numbers | 2 | 0 |

---

## 🎯 Recommended Refactoring Plan

### Phase 1: Extract Components (Immediate)
1. Create `src/components/admin/users/UserStatsCards.tsx`
2. Create `src/components/admin/users/PendingUsersAlert.tsx`
3. Create `src/components/admin/users/UserListCard.tsx`
4. Create `src/components/admin/users/UserSearchBar.tsx`

### Phase 2: Create Custom Hook
Create `src/hooks/admin/useUserManagement.ts`:
```typescript
export function useUserManagement() {
  // All user fetching, filtering, and mutations
  // Returns: users, stats, filters, actions
}
```

### Phase 3: Performance Optimization
1. Memoize statistics calculations
2. Add React.memo to user cards
3. Use virtualization for long user lists

### Phase 4: Code Cleanup
1. Remove console.logs
2. Add error boundaries
3. Add loading skeletons
4. Add breadcrumb
5. Fix accessibility issues

---

## Files to Create

```
src/components/admin/users/
├── index.ts
├── UserStatsCards.tsx
├── PendingUsersAlert.tsx
├── UserListCard.tsx
├── UserSearchBar.tsx
└── UserManagementTab.tsx

src/hooks/admin/
├── useUserManagement.ts
└── useUserFilters.ts
```

---

## Estimated Effort

| Task | Time |
|------|------|
| Extract components | 2-3 hours |
| Create custom hook | 1-2 hours |
| Performance optimization | 1 hour |
| Code cleanup | 1 hour |
| **Total** | **5-7 hours** |
