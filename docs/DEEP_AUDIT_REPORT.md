# Deep Audit Report - NYSC Facilities App

**Generated:** November 25, 2025

---

## 🔴 Critical Issues

### 1. Hardcoded Supabase Credentials
**File:** `src/lib/supabase.ts` (lines 8-10)
```typescript
const SUPABASE_URL = 'https://fmymhtuiqzhupjyopfvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
**Risk:** Security vulnerability - credentials exposed in source code
**Fix:** Move to environment variables (`.env.local`)

### 2. 851 Uses of `any` Type
**Impact:** Type safety compromised, potential runtime errors
**Priority:** High (ongoing refactoring)
**Hotspots:**
- `src/components/profile/` - 50+ occurrences
- `src/hooks/` - 100+ occurrences
- `src/services/` - 40+ occurrences

---

## 🟠 High Priority Issues

### 3. Large Files Needing Refactoring

| File | Lines | Issue |
|------|-------|-------|
| `PersonnelProfilesTab.tsx` | 1,113 | Way too large, split into components |
| `CreateSessionDialog.tsx` | 925 | Complex dialog, extract form sections |
| `Operations.tsx` | 913 | Components extracted but not integrated |
| `EnhancedCourtAssignmentTable.tsx` | 877 | Split into smaller table components |
| `AdminManagementTab.tsx` | 855 | Extract user management sections |
| `AdminProfile.tsx` | 787 | Components extracted but not integrated |
| `SupplyRequestFormPage.tsx` | 694 | Multi-step form, extract steps |

### 4. 640 Console.log Statements in Production
**Impact:** Performance, security (data leakage), noise in console
**Fix:** Replace with proper logging service or remove

### 5. 25+ TODO/FIXME Comments
**Key TODOs:**
- `DailySessionsPanel.tsx`: Bulk insert to court_sessions table
- `FulfillmentSuccessScreen.tsx`: Email receipt functionality
- `FulfillmentSuccessScreen.tsx`: Print functionality
- `MobileIssuesList.tsx`: 5 unimplemented action handlers
- `useEnhancedPersonnelManagement.ts`: Invitation system

---

## 🟡 Medium Priority Issues

### 6. Duplicate Code Patterns

#### Issue Management Systems (2 parallel implementations)
- `src/components/issues/` - Core CRUD, mobile views, `useIssueList`
- `src/components/admin-issues/` - Admin views, Kanban, `useAdminIssuesData`
**Fix:** Consolidate into single system with role-based views

#### Supply Request Handling
- `src/pages/MySupplyRequests.tsx`
- `src/pages/admin/SupplyRequests.tsx`
- `src/components/supply/EnhancedSupplyManagement.tsx`
- `src/pages/SuppliesHub.tsx`
**Fix:** Already created SuppliesHub, need to deprecate old pages

### 7. Inconsistent Error Handling

**Good pattern (use this):**
```typescript
// src/services/core/supabaseClient.ts
export function handleSupabaseError(error: any, context: string): never {
  const message = error?.message || 'Unknown error occurred';
  console.error(`[Supabase Error - ${context}]:`, error);
  throw new Error(`${context}: ${message}`);
}
```

**Bad patterns found:**
- Silent failures (catch without re-throw or toast)
- Inconsistent error messages
- Missing error boundaries on some pages

### 8. Missing Loading States
Some pages show blank content while loading instead of skeletons:
- `src/components/court/LiveCourtGrid.tsx`
- `src/components/keys/lockbox/LockboxView.tsx`
- Several admin panels

### 9. Accessibility Issues
- Missing `aria-label` on icon-only buttons
- Missing `role` attributes on interactive elements
- Some forms missing proper label associations

---

## 🟢 Low Priority / Tech Debt

### 10. Unused Imports
Multiple files have unused imports that should be cleaned up.

### 11. Inconsistent File Naming
- Some use PascalCase: `UserDashboard.tsx`
- Some use kebab-case in folders: `court-operations/`
- Mix of `.ts` and `.tsx` for non-component files

### 12. Missing Tests
- No unit tests found
- No integration tests
- No E2E tests

### 13. Bundle Size Concerns
- Large component files increase bundle size
- Some heavy dependencies may not be tree-shaken properly

---

## 📊 Code Quality Metrics

| Metric | Count | Target |
|--------|-------|--------|
| `any` types | 851 | < 50 |
| `console.log` | 640 | 0 in prod |
| TODO comments | 25+ | 0 |
| Files > 500 lines | 20+ | < 5 |
| Files > 300 lines | 40+ | < 15 |

---

## 🎯 Recommended Action Plan

### Phase 1: Security (Immediate)
1. ✅ Move Supabase credentials to env vars (already noted)
2. Remove any sensitive data from console.logs

### Phase 2: Stability (This Week)
1. Add error boundaries to all route components
2. Standardize error handling with `handleSupabaseError`
3. Add loading skeletons to pages missing them

### Phase 3: Code Quality (Next 2 Weeks)
1. Refactor files > 500 lines
2. Integrate extracted Operations/AdminProfile components
3. Remove console.logs or replace with logging service
4. Address critical TODOs

### Phase 4: Type Safety (Ongoing)
1. Replace `any` with proper types
2. Generate Supabase types and use them
3. Add strict TypeScript checks

### Phase 5: Testing (Future)
1. Add unit tests for services
2. Add integration tests for critical flows
3. Add E2E tests for user journeys

---

## Files to Prioritize

### Immediate Refactoring Candidates
1. `src/components/occupants/PersonnelProfilesTab.tsx` (1,113 lines)
2. `src/components/court-operations/CreateSessionDialog.tsx` (925 lines)
3. `src/pages/Operations.tsx` (913 lines) - integrate extracted components
4. `src/components/court/EnhancedCourtAssignmentTable.tsx` (877 lines)

### Security Review Needed
1. `src/lib/supabase.ts` - credentials
2. `src/services/auth.ts` - auth flow
3. `src/hooks/useAuth.tsx` - session handling

### Performance Review Needed
1. Components with multiple `useQuery` calls
2. Components with large state objects
3. Real-time subscription handlers
