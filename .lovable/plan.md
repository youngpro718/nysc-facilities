

## Problem Analysis

Two distinct issues on iPhone:

1. **Header overlaps the status bar / Dynamic Island**: The sticky header (`h-14`, line 136 in Layout.tsx) uses `sticky top-0` but has no top safe-area padding. Since `viewport-fit=cover` is enabled in the HTML, content extends behind the status bar notch area.

2. **Cart button hidden behind bottom tab bar**: The `OrderCart` trigger button is positioned at `fixed bottom-20` (80px), but the `BottomTabBar` is ~56px + safe-area-inset-bottom (~34px on iPhone) = ~90px total. The button sits behind the tab bar. Additionally, the Sheet content may also be clipped at the bottom.

## Implementation Plan

### 1. Fix header safe-area overlap (Layout.tsx)

- Add `pt-[env(safe-area-inset-top)]` to the sticky header on mobile so it clears the status bar / Dynamic Island
- Change `top-0` to account for safe area so the sticky behavior still works correctly

**File**: `src/components/layout/Layout.tsx`, line 136
- Change the header className to include `safe-area-top` (which applies `padding-top: env(safe-area-inset-top)`)

### 2. Fix cart button positioning (OrderCart.tsx)

- Increase `bottom-20` to `bottom-24` or use a calc with safe-area-inset-bottom so the cart FAB clears the bottom tab bar + home indicator
- Add `pb-safe` or safe-area bottom padding to the `SheetContent` so the submit/clear buttons aren't clipped

**File**: `src/components/supply/OrderCart.tsx`, line 74
- Change `bottom-20` to `bottom-28` (7rem = 112px) to clear the tab bar + safe area
- Add safe-area bottom padding to `SheetContent` (line 81)

### 3. Adjust FloatingActionButton for consistency (FloatingActionButton.tsx)

- The FAB at `bottom-[4.5rem]` (72px) has the same issue — raise it to match the cart button fix

**File**: `src/components/ui/FloatingActionButton.tsx`, line 32
- Change `bottom-[4.5rem]` to `bottom-28`

