

## Fix: Prevent horizontal overflow on mobile supply ordering screen

The issue is that long item names (e.g., "Avery Easy Peel Address Labels") combined with the Add button and star icon cause the row content to overflow horizontally on narrow screens. The page container and inner components lack `overflow-x: hidden`, so content spills past the viewport edge.

### Changes

**1. Lock horizontal overflow on the page container**

File: `src/pages/request/SupplyOrderPage.tsx`, line 20. Add `overflow-x-hidden` to the outer div to prevent any child from causing horizontal scroll.

**2. Lock horizontal overflow on QuickSupplyRequest**

File: `src/components/supply/QuickSupplyRequest.tsx`, line 95. Add `overflow-x-hidden` to the root `div`.

**3. Constrain InlineItemRow mobile layout to prevent overflow**

File: `src/components/supply/InlineItemRow.tsx`:
- Line 59: Add `overflow-hidden` to the top row container so the name + metadata area can't push the row wider than the card.
- Line 119: Add `justify-between w-full` to the mobile controls row (row 2) so the Add button and star stay within bounds.
- Line 149-160: On the mobile Add button, ensure it doesn't grow unbounded — add `shrink-0` so the text area takes the truncation instead.

These three layers (page → component → row) ensure nothing can escape the viewport width on mobile.

