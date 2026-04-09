

## Add Generic Images for Inventory Items

When an inventory item has no uploaded photo, the system will display a relevant generic image based on the item's name. This makes the inventory visually richer without requiring manual photo uploads.

### Approach

1. **Create a utility function** (`getGenericItemImage`) that maps common inventory keywords to free stock images from Unsplash (static URLs, no API key needed). For example:
   - "paper" / "printer" → office supplies image
   - "soap" / "sanitizer" / "cleaning" → cleaning supplies image  
   - "bulb" / "light" / "lamp" → lighting image
   - "chair" / "desk" / "furniture" → furniture image
   - "pen" / "marker" / "stapler" → stationery image
   - Default fallback → generic storage/supplies image

2. **Update display components** to show the generic image when `photo_url` is empty:
   - `InventoryTable.tsx` — add an image column to the table
   - `InventoryItemsPanel.tsx` — show generic image when `photo_url` is missing
   - `MobileInventoryGrid.tsx` — show generic image when `photo_url` is missing
   - `SupplyItemCard.tsx` / `InlineItemRow.tsx` — show generic image as fallback

3. **Image sizing**: Small thumbnails (40×40 in tables, 64×64 in cards) with `object-cover` and rounded corners, consistent with existing photo styling.

### Files to Create/Edit

- **New**: `src/utils/inventoryImages.ts` — keyword-to-image mapping utility
- **Edit**: `src/features/spaces/components/spaces/inventory/components/InventoryTable.tsx` — add image column
- **Edit**: `src/features/inventory/components/inventory/InventoryItemsPanel.tsx` — fallback image
- **Edit**: `src/features/spaces/components/spaces/inventory/components/MobileInventoryGrid.tsx` — fallback image
- **Edit**: `src/features/supply/components/supply/SupplyItemCard.tsx` — fallback image
- **Edit**: `src/features/supply/components/supply/InlineItemRow.tsx` — fallback image

