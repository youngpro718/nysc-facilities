

# Mobile Audit & Fixes for Recent Changes

## Issues Found

### 1. ItemRow touch targets too small
**File:** `src/components/supply/ItemRow.tsx`
- The +/- buttons are `h-7 w-7` (28px) — below the 44px iOS touch target requirement
- The "Add" button uses default `size="sm"` with no min-height
- Fix: Increase stepper buttons to `h-9 w-9` (36px min, with touch-manipulation), and add `min-h-[44px]` to the Add button

### 2. OrderCart FAB overlaps bottom tab bar inconsistently
**File:** `src/components/supply/OrderCart.tsx`
- The cart trigger uses `bottom-28 right-3` which is correct per architecture standards, but on the Sheet content it uses `pb-20 sm:pb-6` — the `pb-20` is a rough guess. Should use `pb-safe` or the established safe-area pattern
- Fix: Use `pb-nav-safe` on the SheetContent for mobile to clear the tab bar + safe area properly

### 3. Admin SupplyRequests filter row wraps awkwardly on mobile
**File:** `src/pages/admin/SupplyRequests.tsx`
- The search input has `min-w-[200px]` which forces a full row on small screens, then the two selects share the second row with `w-[calc(50%-0.25rem)]` — this is fine but the search bar could use `min-w-0` on very small screens
- The expanded detail grid uses `grid-cols-2` which can get cramped on phones with longer text
- Fix: Make the expanded details grid `grid-cols-1 sm:grid-cols-2`

### 4. EnhancedSupplyTracker compact row cramped on mobile
**File:** `src/components/user/EnhancedSupplyTracker.tsx`
- The Receipt button + Badge + chevron on completed cards creates a crowded right side on mobile. The "Receipt" text label takes unnecessary space
- Fix: On mobile, show only the Receipt icon (no text label) to save horizontal space

### 5. Court Officer key assignments table header doesn't work on mobile
**File:** `src/pages/CourtOfficerDashboard.tsx`
- The 3-column grid layout (`grid-cols-[1fr_auto_auto]`) with "Person / Room / Duration" headers is too wide on small phones — the Room badge with icon + text and Duration column compete for space
- Fix: Hide the table header on mobile, and stack the Room/Duration info below the person name on small screens

### 6. CMC Dashboard health strip legend wraps poorly
**File:** `src/pages/CMCDashboard.tsx`
- The 3-item legend (`Active · Maintenance · Inactive`) uses `gap-4` which can push items to a second line on narrow phones
- Fix: Use `gap-2 sm:gap-4` and smaller text on mobile

### 7. CourtAideWorkCenter container padding
**File:** `src/pages/CourtAideWorkCenter.tsx`
- Uses `container mx-auto px-4` while other dashboards use `px-3 sm:px-0` — inconsistent with the pattern
- Fix: Align to `px-3 sm:px-0` to match CMC and Court Officer dashboards

## Files to Modify

| File | Fix |
|------|-----|
| `src/components/supply/ItemRow.tsx` | Enlarge touch targets on +/- and Add buttons |
| `src/components/supply/OrderCart.tsx` | Fix Sheet bottom padding for mobile safe area |
| `src/pages/admin/SupplyRequests.tsx` | Expanded details grid → single column on mobile |
| `src/components/user/EnhancedSupplyTracker.tsx` | Icon-only Receipt button on mobile |
| `src/pages/CourtOfficerDashboard.tsx` | Responsive key assignments layout |
| `src/pages/CMCDashboard.tsx` | Tighten health legend spacing on mobile |
| `src/pages/CourtAideWorkCenter.tsx` | Align container padding with other dashboards |

