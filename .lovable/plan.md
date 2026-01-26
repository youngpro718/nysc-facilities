
# Comprehensive Audit Plan: Routing, Functionality & Best Practices

## Executive Summary

After thorough analysis of the codebase, I've identified **23 issues** across routing, unused components, navigation, and security. Here's the complete breakdown and remediation plan.

---

## Part 1: Critical Routing Issues

### Issue 1.1: Legacy Supply Form References (HIGH PRIORITY)
The old supply request form at `/forms/supply-request` is still being referenced in multiple places, causing navigation to the legacy form instead of the new streamlined `/request/supplies` page.

**Files needing updates:**

| File | Line | Current Path | Should Be |
|------|------|--------------|-----------|
| `src/pages/MyActivity.tsx` | 224 | `/forms/supply-request` | `/request/supplies` |
| `src/pages/MyActivity.tsx` | 241 | `/forms/supply-request` | `/request/supplies` |
| `src/pages/FormTemplates.tsx` | 68 | `/forms/supply-request` | `/request/supplies` |
| `src/pages/FormTemplates.tsx` | 145 | `/forms/supply-request` | `/request/supplies` |
| `src/components/forms/EmailFormDialog.tsx` | 21 | `/forms/supply-request` | `/request/supplies` |

**Action:** Update all 5 references to use `/request/supplies`

### Issue 1.2: Route Still Exists for Legacy Form
The `App.tsx` still has a route to the legacy form at line 93:
```tsx
<Route path="/forms/supply-request" element={<SupplyRequestFormPage />} />
```

**Action:** Either:
- Option A: Redirect this route to `/request/supplies` for backwards compatibility (recommended)
- Option B: Remove the route entirely

---

## Part 2: Unused/Deprecated Components for Removal

### Issue 2.1: Legacy Supply Request Form Component
`src/components/supply-requests/SupplyRequestForm.tsx` (440 lines) is the old modal-based form that has been replaced by `QuickSupplyRequest`.

**Status:** Appears unused - all current usage routes to `QuickSupplyRequest`

**Action:** Delete `src/components/supply-requests/SupplyRequestForm.tsx` after confirming no imports

### Issue 2.2: Legacy Form Page Decision
`src/pages/forms/SupplyRequestFormPage.tsx` (694 lines) is the standalone public form page.

**Decision needed:** 
- If public/anonymous supply requests are needed: Keep but update styling
- If not needed: Delete the file and route

---

## Part 3: Navigation Configuration Issues

### Issue 3.1: Role Dashboard Config Already Updated ✓
The `src/config/roleDashboardConfig.ts` has been correctly updated to use `/request/supplies` for the CMC role.

### Issue 3.2: Navigation Menu Consistency
The navigation config in `src/components/layout/config/navigation.tsx` is correctly structured but verify role-based routes are accurate:

| Role | Dashboard Route | Status |
|------|-----------------|--------|
| admin | `/` | ✓ Correct |
| cmc | `/cmc-dashboard` | ✓ Correct |
| court_aide | `/court-aide-dashboard` | ✓ Correct |
| standard | `/dashboard` | ✓ Correct |

---

## Part 4: Component Consistency Issues

### Issue 4.1: Supply Request Card (ALREADY FIXED) ✓
`src/components/dashboard/SupplyRequestCard.tsx` line 97 already uses `/request/supplies` - no action needed.

### Issue 4.2: Floating Action Button ✓
`src/components/ui/FloatingActionButton.tsx` correctly routes to `/request` - no action needed.

---

## Part 5: Documentation Cleanup

The following documentation files reference outdated paths and should be updated:

| File | Notes |
|------|-------|
| `docs/COMPREHENSIVE_UX_AUDIT.md` | References `/forms/supply-request` |
| `docs/CMC_COURT_OPS_AUDIT.md` | References `/forms/supply-request` |
| `docs/QUICK_REFERENCE.md` | References `/forms/supply-request` |

**Action:** Update docs to reflect new `/request/supplies` path

---

## Part 6: Database Security Findings

The Supabase linter reports 18 warnings:

1. **Function Search Path Mutable (1 instance)** - Low priority security concern
2. **RLS Policy Always True (17 instances)** - Permissive policies using `USING (true)` or `WITH CHECK (true)`

**Recommendation:** These should be reviewed in a separate security audit, but they're not blocking issues for current functionality.

---

## Part 7: Code Quality Observations

### 7.1: Positive Patterns ✓
- Cart hook (`useOrderCart.ts`) properly handles the `requires_justification` flag
- `OrderSummaryFooter.tsx` correctly shows justification only when needed
- `QuickSupplyRequest.tsx` properly passes the flag to cart items
- Type safety is maintained throughout the supply ordering flow

### 7.2: Minor Technical Debt
- `src/pages/forms/SupplyRequestFormPage.tsx` uses `(profile as any)` casts - could use proper typing
- Some components import icons that aren't used

---

## Implementation Steps

### Step 1: Update Route References (5 files)
Update all `/forms/supply-request` → `/request/supplies`:
1. `src/pages/MyActivity.tsx` (2 places)
2. `src/pages/FormTemplates.tsx` (2 places)
3. `src/components/forms/EmailFormDialog.tsx` (1 place)

### Step 2: Add Redirect for Legacy Route
In `App.tsx`, add a redirect from the old path:
```tsx
<Route path="/forms/supply-request" element={<Navigate to="/request/supplies" replace />} />
```

### Step 3: Verify Before Deletion
Search for any remaining imports of `SupplyRequestForm` before deleting:
- `src/components/supply-requests/SupplyRequestForm.tsx`

### Step 4: Decision Point
Decide whether to keep `src/pages/forms/SupplyRequestFormPage.tsx` for public/anonymous access or remove it entirely.

### Step 5: Update Documentation
Update the 3 docs files to reflect the new supply request path.

---

## Summary of Changes

| Category | Files Affected | Action Type |
|----------|----------------|-------------|
| Route Updates | 5 files | Modify paths |
| Redirect Addition | 1 file (App.tsx) | Add redirect |
| Component Removal | 1-2 files | Delete after verification |
| Documentation | 3 files | Update references |

**Total estimated scope:** 9-11 files, minimal risk changes
