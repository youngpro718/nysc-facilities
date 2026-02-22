

# Mobile UI/UX Audit -- Findings and Improvement Plan

## Issues Found

### 1. Page Titles Too Large on Mobile (High Impact)
Multiple pages use `text-3xl` for headings without mobile scaling. On a 390px screen, "Space Management", "Maintenance", "Form Template Builder" etc. are oversized and waste vertical space.

**Affected pages**: Spaces.tsx, MaintenanceDashboard.tsx, FormTemplates.tsx, FormIntake.tsx, RoleDashboard.tsx, Users.tsx, FeaturesPreview.tsx, Operations.tsx, RoutingRules.tsx, FormTemplatesAdmin.tsx  
**Fix**: Change `text-3xl` to `text-xl sm:text-3xl` across all page headers. Keys.tsx already does this correctly (`text-xl sm:text-2xl`).

---

### 2. Missing `pb-safe` on Most Pages (Medium Impact)
Only Keys.tsx and ProfileOnboarding.tsx use `pb-safe` for safe area bottom padding. Every other page relies only on the Layout's `pb-24 md:pb-0` which handles the bottom tab bar but not the iOS home indicator. Content on pages with long scroll can get clipped behind the bottom bar.

**Fix**: The Layout already has `pb-24 md:pb-0 safe-area-bottom` on `<main>`, which should cover most cases. However, some pages with fixed-height containers (like `LockboxView`'s `h-[calc(100vh-400px)]`) can clip content. Convert these to `max-h-` or `min-h-` with `pb-safe` inside.

---

### 3. Help Button and FAB Stacking (Already Fixed)
The Help button was moved to `bottom-36 md:bottom-6` in the last round. This is correct -- the FAB is at `bottom-24`, so they stack properly. No further action needed.

---

### 4. Lockbox Info Bar Overflows on Small Screens (Medium Impact)
In `LockboxSelector.tsx`, the info bar (line 59-75) has 3 badges ("X In", "X Out", "X Total") plus a location label all in one row. On narrow screens (320-375px), these badges can overflow or get squeezed.

**Fix**: Wrap the badges below the location on mobile using `flex-col sm:flex-row` and make badge row scroll or wrap.

---

### 5. Fixed-Height Lockbox Container (Low-Medium Impact)
`LockboxView.tsx` line 161: `h-[calc(100vh-400px)]` is a rigid height that doesn't account for mobile header/tab bar differences and can cut off content or leave excess space.

**Fix**: Change to `min-h-[300px] max-h-[calc(100vh-350px)] sm:max-h-[calc(100vh-400px)]` for flexible sizing.

---

### 6. MobileCardView Quick Action Labels Hidden (Low Impact)
In `MobileCardView.tsx` line 160: `<span className="hidden sm:inline">{action.label}</span>` -- action labels are always hidden on mobile, making buttons icon-only without any tooltip. This can reduce discoverability.

**Fix**: Add `aria-label` to the button using `action.label` so screen readers can announce it. The icon-only design is acceptable for mobile but needs the accessibility attribute.

---

### 7. MobileActionSheet Missing Safe Area Bottom Padding (Low Impact)
The bottom sheet content in `MobileActionSheet.tsx` has `pb-6` but no `pb-safe`. On iPhones with home indicators, the Cancel button can be partly obscured.

**Fix**: Change `pb-6` to `pb-6 pb-safe` (or use `pb-safe` with a min of 24px).

---

### 8. Spaces Page Uses `space-y-8` (Excessive Mobile Spacing)
`Spaces.tsx` uses `space-y-8` which adds 32px between sections on mobile -- too much vertical space for small screens.

**Fix**: Change to `space-y-4 sm:space-y-8`.

---

### 9. Bottom Tab Bar Label Truncation on 320px Screens
The BottomTabBar uses `text-[10px] xs:text-[11px]` which is good, but on 320px screens with 5 columns (4 tabs + More), labels like "Supply Room" or "Supply Requests" will truncate. The labels adaptively hide per the project memory, which is correct.

**Status**: Already handled -- no change needed.

---

## Implementation Plan

### File Changes

| File | Change |
|------|--------|
| `src/pages/Spaces.tsx` | `text-3xl` to `text-xl sm:text-3xl`, `space-y-8` to `space-y-4 sm:space-y-8` |
| `src/pages/MaintenanceDashboard.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/FormTemplates.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/FormIntake.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/RoleDashboard.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/Users.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/FeaturesPreview.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/Operations.tsx` | Page title `text-3xl` to `text-xl sm:text-3xl` (stat numbers stay `text-3xl`) |
| `src/pages/admin/RoutingRules.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/admin/FormTemplatesAdmin.tsx` | `text-3xl` to `text-xl sm:text-3xl` |
| `src/pages/InstallApp.tsx` | Already has `text-3xl sm:text-4xl`, change to `text-2xl sm:text-4xl` |
| `src/components/keys/lockbox/LockboxSelector.tsx` | Stack location and badges vertically on mobile |
| `src/components/keys/lockbox/LockboxView.tsx` | Replace rigid `h-[calc(100vh-400px)]` with flexible height |
| `src/components/mobile/MobileActionSheet.tsx` | Add `pb-safe` to bottom sheet |
| `src/components/mobile/MobileCardView.tsx` | Add `aria-label={action.label}` to quick action buttons |

### Order of Implementation
1. Batch update all page titles (10 files, same pattern)
2. Fix LockboxSelector mobile layout
3. Fix LockboxView height
4. Fix MobileActionSheet safe area
5. Fix MobileCardView accessibility
6. Fix Spaces.tsx spacing

