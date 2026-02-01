
# Mobile Supply Ordering Audit

## Problem Statement

On mobile devices at `/request/supplies`, the quantity controls (add/subtract buttons and quantity display) are not visible or are being cut off. This prevents users from adding items to their cart on narrow screens.

## Root Cause Analysis

After examining the code, the issue stems from the `InlineItemRow` component's flex layout combined with container constraints on narrow mobile screens:

### Layout Breakdown

```text
Container width: 320-390px
- Container padding (px-4): -32px
- Row padding (p-3): -24px  
- Flex gaps (gap-3 x2): -24px
= Available: ~230-300px

Fixed-width elements:
- Favorite button: 32px
- Quantity controls: 110px (when item in cart)
- Total fixed: ~142px

Remaining for item info: ~88-158px

Problem: Item info section contains:
- SKU badge (variable width)
- Item name (can be long)
- Warning icons
- Stock info + category badges
```

The combination of badges, long item names, and multiple metadata elements in the info section creates horizontal overflow on narrow screens, pushing quantity controls out of view.

---

## Solution Overview

1. **Optimize InlineItemRow for Mobile** - Stack layout vertically on narrow screens
2. **Add Mobile-Specific Compact Mode** - Reduce metadata shown on mobile
3. **Increase Touch Target Sizes** - Ensure 44px minimum for buttons
4. **Fix Container Overflow** - Ensure horizontal scrolling doesn't hide controls

---

## Implementation Plan

### Phase 1: Mobile-Responsive InlineItemRow

**File: `src/components/supply/InlineItemRow.tsx`**

Transform the single-row layout into a responsive design:

| Screen Size | Layout |
|-------------|--------|
| Mobile (less than 640px) | 2-row stacked layout |
| Tablet/Desktop | Current single-row layout |

Mobile layout structure:
- **Row 1**: Item name + favorite star (right-aligned)
- **Row 2**: Stock info (left) + quantity controls (right)

Key changes:
- Add `useIsMobile()` hook for responsive behavior
- Stack content vertically on mobile using `flex-col`
- Hide secondary badges (category, approval) on mobile to save space
- Increase button sizes to 44px for touch targets
- Add `overflow-x-hidden` to prevent horizontal scroll

### Phase 2: QuickSupplyRequest Mobile Optimization

**File: `src/components/supply/QuickSupplyRequest.tsx`**

- Reduce gap spacing on mobile
- Add explicit `overflow-x-hidden` to prevent horizontal scrolling
- Adjust padding for tighter mobile layout

### Phase 3: FavoritesStrip Touch Optimization

**File: `src/components/supply/FavoritesStrip.tsx`**

- Increase favorite item card touch targets
- Larger buttons for increment/decrement within favorites

### Phase 4: OrderSummaryFooter Mobile Polish

**File: `src/components/supply/OrderSummaryFooter.tsx`**

- Verify sticky positioning works with iPhone safe areas
- Ensure footer doesn't overlap scrollable content

---

## Technical Details

### InlineItemRow Changes

Current structure:
```text
[SKU] [Name] [Warning] | [Star] | [-] [Qty] [+]
```

Mobile structure:
```text
[Name truncated...]        [Star]
Stock: X units    [-] [Qty] [+]
```

Proposed code approach:
```typescript
const isMobile = useIsMobile();

// Conditional layout
<div className={cn(
  "p-3 rounded-lg border transition-all",
  isMobile ? "flex flex-col gap-2" : "flex items-center gap-3",
  // ... other classes
)}>
  {/* Row 1 on mobile, inline on desktop */}
  <div className={cn(
    isMobile ? "flex items-center justify-between" : "flex-1 min-w-0"
  )}>
    {/* Item name - larger touch area on mobile */}
    <div className={isMobile ? "flex-1 min-w-0" : undefined}>
      <span className="font-medium truncate block">{item.name}</span>
      {!isMobile && /* Show full metadata on desktop */}
    </div>
    
    {/* Favorite button - stays with name on mobile */}
    {isMobile && onToggleFavorite && <StarButton />}
  </div>
  
  {/* Row 2 on mobile: stock + controls */}
  <div className={cn(
    "flex items-center justify-between",
    isMobile ? "w-full" : "shrink-0"
  )}>
    {isMobile && <StockInfo />}
    {!isMobile && onToggleFavorite && <StarButton />}
    <QuantityControls size={isMobile ? "lg" : "default"} />
  </div>
</div>
```

### Button Size Updates

For mobile, increase touch targets:
```typescript
// Current
className="h-9 w-9 rounded-full"

// Mobile
className={cn(
  "rounded-full touch-manipulation",
  isMobile ? "h-11 w-11" : "h-9 w-9"
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/supply/InlineItemRow.tsx` | Mobile-responsive stacked layout |
| `src/components/supply/QuickSupplyRequest.tsx` | Overflow handling, tighter mobile padding |
| `src/components/supply/FavoritesStrip.tsx` | Larger touch targets on mobile |
| `src/components/supply/OrderSummaryFooter.tsx` | Verify safe area padding |

---

## Testing Checklist

After implementation, verify on mobile devices:
- [ ] Quantity controls visible on 320px width
- [ ] Quantity controls visible on 375px width (iPhone SE/Mini)
- [ ] Quantity controls visible on 390px width (iPhone 14)
- [ ] Add button is tappable and responds correctly
- [ ] Increment/decrement buttons work when item in cart
- [ ] Favorites strip scrolls horizontally properly
- [ ] Order footer doesn't overlap content
- [ ] Safe area padding works on notched iPhones
