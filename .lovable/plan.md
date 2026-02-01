
# Mobile Supply Ordering - Relocated Controls Layout

## Problem Identified

After analyzing the code, the current mobile layout for `InlineItemRow` has a structural issue where even in the "stacked" 2-row layout, the second row still has too many elements competing for horizontal space:

**Current Mobile Row 2:**
```
[SKU Badge] [Stock: X units] ← Takes variable width    [- ] [Qty] [+] ← Fixed 110px
```

On narrow screens (320-375px), if the SKU badge is wide (e.g., "FURN-001") plus stock text, the quantity controls can still be pushed off-screen or compressed.

---

## Proposed Solution: 3-Row Mobile Layout

Reorganize the mobile layout into **3 distinct rows** to ensure quantity controls have a dedicated, full-width row:

### New Mobile Layout:

| Row | Content | Alignment |
|-----|---------|-----------|
| **Row 1** | Item Name + Warning Icon | Left |
| **Row 2** | SKU Badge + Stock Info + Favorite Star | Left + Right |
| **Row 3** | Quantity Controls (full width) | Center |

Visual representation:
```
┌────────────────────────────────────┐
│ Ballpoint Pens (Box of 12)      ⚠ │  ← Row 1: Name
│ [OFF-001]  Stock: 50     ⭐       │  ← Row 2: Metadata
│        [ - ]  5  [ + ]            │  ← Row 3: Controls (centered)
└────────────────────────────────────┘
```

---

## Benefits

1. **Guaranteed Visibility**: Quantity controls get their own row, never competing for space
2. **Larger Touch Targets**: Full-width row allows for bigger, more accessible buttons
3. **Clear Visual Hierarchy**: Name → Info → Action, top to bottom
4. **Thumb-Friendly**: Controls at the bottom of the card, within easy thumb reach

---

## Technical Implementation

### File: `src/components/supply/InlineItemRow.tsx`

Key changes:
- Restructure mobile layout to use 3 rows instead of 2
- Move quantity controls to a dedicated third row on mobile
- Center the controls in the third row for better ergonomics
- Keep desktop layout unchanged (single row with inline controls)

```tsx
// Mobile layout structure
<div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
  {/* Mobile Row 1: Item Name + Warning */}
  <div className="flex items-center gap-2 sm:flex-1">
    <span className="font-medium truncate">{item.name}</span>
    {item.requires_justification && <AlertTriangle />}
  </div>
  
  {/* Mobile Row 2: SKU + Stock + Favorite Star */}
  <div className="flex items-center justify-between sm:hidden">
    <div className="flex items-center gap-2">
      <Badge>{item.sku}</Badge>
      <span>Stock: {item.quantity}</span>
    </div>
    <Button onClick={onToggleFavorite}><Star /></Button>
  </div>
  
  {/* Mobile Row 3: Quantity Controls (centered, full width) */}
  <div className="flex justify-center gap-2 pt-1 sm:hidden">
    {inCart ? (
      <div className="flex items-center gap-3">
        <Button className="h-12 w-12">-</Button>
        <span className="text-xl font-bold w-12 text-center">{qty}</span>
        <Button className="h-12 w-12">+</Button>
      </div>
    ) : (
      <Button className="h-12 px-8">+ Add to Cart</Button>
    )}
  </div>
  
  {/* Desktop: Favorite + Controls inline (unchanged) */}
  <div className="hidden sm:flex items-center gap-2">
    <Button onClick={onToggleFavorite}><Star /></Button>
    <QuantityControls />
  </div>
</div>
```

### Additional Optimizations:
- Increase button size to 48px (`h-12 w-12`) on mobile for better touch targets
- Add subtle visual separation (padding or border) above the controls row
- Use larger quantity text (`text-xl`) for better readability

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/supply/InlineItemRow.tsx` | Restructure to 3-row mobile layout with dedicated controls row |

---

## Expected Result

After this change:
- Quantity controls will always be visible on all mobile screen sizes (320px+)
- The "Add" button and +/- controls will be centered and prominent
- Touch targets will be large enough for easy mobile use
- Desktop view remains unchanged
