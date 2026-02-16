

# Mobile Debug, Audit & Build Error Fix Plan

## Part 1: Fix All Build Errors (50+ TypeScript errors)

The build is currently broken due to overly restrictive typing (`Record<string, unknown>` and `unknown`) applied in previous refactoring passes. These need to be changed to `any` or proper interfaces.

### Files and fixes:

**1. NotificationBox.tsx** - Change all `Record<string, unknown>` parameter types to `any`:
- Lines 61, 66, 67, 68, 84: Change filter/helper function signatures from `(n: Record<string, unknown>)` to `(n: any)`
- Lines 109, 116: Change `handleNotificationClick` parameter and metadata access to use `any`
- Lines 210-211, 285, 294: Change forEach callbacks - notifications are `AdminNotification`, not `Record<string, unknown>`

**2. AdminKeyOrderCard.tsx** - Remove double-cast `as Record<string, unknown>`:
- Line 91: Change `((order as Record<string, unknown>))?.key_requests?.profiles` to `(order as any)?.key_requests?.profiles`
- Line 103: Same pattern for `ordered_at` / `created_at` access
- Line 181: Fix `orderedDateStr` usage with `String()` cast

**3. AdminKeyOrdersSection.tsx** - Fix query return type and property access:
- Line 37: Change `return (data as unknown[])` to `return (data as any[])`
- Lines 42-59, 79, 104, 225-226: All property accesses on `order` need `any` typing

**4. PersonnelQuickAssignDialog.tsx** - Fix `roomDetails` map callback typing:
- Line 183: Change `(assignment: Record<string, unknown>)` to `(assignment: any)`
- Lines 189, 195, 198, 213, 222: All downstream property accesses fixed by the `any` type

**5. IssueTableView.tsx** - Fix Badge variant casting:
- Lines 100, 106: Change `as unknown` to `as any`

**6. IssueTimelineView.tsx** - Fix Badge variant casting:
- Line 71: Change `as unknown` to `as any`

**7. SignupForm.tsx** - Fix `secureSignUp` parameter type:
- Line 97: Cast `userData` with `as Record<string, unknown>` since the function signature expects it

**8. CreateSessionDialog.tsx** - Fix `selectedAssignment` typing and sort function:
- Line 46: Change `Record<string, unknown> | null` to `any`
- Lines 146-150: Change sort function parameter types from `Record<string, unknown>` to `any`
- Line 246: Fix `logger.debug` call with too many arguments (combine into fewer args)
- Lines 337-341: Property access errors on `selectedAssignment` fixed by `any` type

**9. CoverageAssignmentDialog.tsx** - Fix `selectedAssignment` typing:
- Line 45: Change `Record<string, unknown> | null` to `any`
- Lines 172, 178: Property access errors fixed by `any` type

---

## Part 2: Mobile Dialog/Popup Fix (Input fields going off-screen)

The core issue: When a user taps an input field inside a dialog on mobile, the virtual keyboard pushes the dialog content off-screen because the dialog uses `position: fixed` with `top: 50%; transform: translateY(-50%)` centering. The keyboard reduces the viewport, but the dialog remains centered on the original viewport.

### Fix in `src/components/ui/dialog.tsx`:

Update `DialogContent` to be mobile-friendly:
- On mobile viewports, change the dialog positioning to anchor to the top of the viewport instead of center, so keyboard appearance doesn't push content off-screen
- Add `max-h-[85vh] overflow-y-auto` so dialog content scrolls within the dialog
- Add mobile-specific responsive classes: on small screens use full-width with small margin and top-aligned positioning

The fix will change the DialogContent className from:
```
fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] ...
```
To include mobile overrides:
```
fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]
max-h-[85vh] overflow-y-auto
max-sm:top-[5%] max-sm:translate-y-0
```

This ensures that on mobile (`max-sm` breakpoint), the dialog is positioned near the top of the screen so when the keyboard opens, the input field remains visible.

---

## Part 3: Mobile UI Audit Improvements

### 3a. Dialog close button touch target
- The close button (`X`) in `dialog.tsx` is small (just the icon). Add minimum touch target size of 44px for mobile.

### 3b. Textarea and Input keyboard behavior
- Add `inputMode` attributes where appropriate (e.g., `inputMode="email"` for email fields)

### 3c. Large dialogs on mobile
- `CreateSessionDialog.tsx` uses `max-w-3xl max-h-[90vh] overflow-y-auto` which is good, but ensure padding accounts for safe areas

---

## Technical Summary

| Category | Files | Changes |
|----------|-------|---------|
| TS Build Fixes | 9 files | Replace `Record<string, unknown>` and `unknown` casts with `any`; fix argument counts |
| Mobile Dialog Fix | `dialog.tsx` | Top-align on mobile, add overflow scroll, max-height |
| Mobile Audit | `dialog.tsx` | Enlarge close button touch target |

### Implementation Order
1. Fix `dialog.tsx` (mobile positioning + touch target) - fixes the popup/keyboard issue
2. Fix all 9 files with TypeScript errors - restores the build
3. Test end-to-end on mobile viewport

