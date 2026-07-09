## Goal

1. Include item photos (`photo_url`) in inventory Excel export and import so images move with items between rooms.
2. On desktop, make the inventory actions Sheet (Export/Import) render above the room's inventory dialog instead of behind it.

## Changes

### 1. Photos in export/import

**`src/features/spaces/components/spaces/inventory/EnhancedInventoryImportExport.tsx`**
- Add `photo_url: true` to the default `exportFields` state so the URL is included in exported spreadsheets.
- In the export row builder, populate `photo_url` from `item.photo_url`.
- In the import loop, pass `photo_url` through into the `processedItem` handed to `onImportSuccess`.

**`src/features/spaces/components/spaces/inventory/excelUtils.ts`**
- Extend `FIELD_MAPPINGS` with a `photo_url` entry (accepting `photo_url`, `photo`, `image`, `image_url`).
- Include `photo_url` in the returned row from `parseExcelFile` (trimmed string or null).
- Add `photo_url` to `InventoryExcelRow` typing and to the sample rows in `generateTemplate` so the template documents the column.

**`src/features/spaces/components/spaces/inventory/types/inventoryTypes.ts`**
- Add optional `photo_url?: string` to `InventoryExportData`.

**`src/features/spaces/components/spaces/inventory/hooks/useInventory.ts`**
- In `bulkCreateMutation`'s `transformedItems`, pass `photo_url: item.photo_url ?? null` so imported photo URLs land in the database.

**`src/features/spaces/components/spaces/inventory/components/MobileRoomInventory.tsx`**
- Include `photo_url` in both the export mapping and the import mapping fed to `addBulkItems`, matching the desktop path.

Photos remain hosted at their existing storage URLs; the export carries the URL string and import re-attaches it to the new room's item. No re-upload or duplication of image files is performed.

### 2. Desktop actions Sheet stacking

The room inventory opens through `MobileInventoryDialog`, which on desktop renders a shadcn Dialog (via `ModalFrame` → `ModalContent`). Inside it, `MobileInventoryHeader` opens a shadcn `Sheet` for the Import/Export actions. Both the parent DialogOverlay/Content and the Sheet use the default `z-50`, so on desktop the Sheet ends up visually behind the dialog's overlay.

**`src/features/spaces/components/spaces/inventory/components/MobileInventoryHeader.tsx`**
- Raise the Sheet above the parent dialog by passing an explicit z-index to `SheetContent` (e.g. `className="... z-[60]"`). Radix renders the Sheet's overlay adjacent to its content, so the higher z-index on the content plus a matching wrapper class on the overlay (via `className` on `SheetContent` covers content; add an overlay override by using an inline style or the existing `overlayClassName` if supported — otherwise wrap `SheetContent` with a z-index utility and rely on Radix's default overlay under it).
- If the shadcn Sheet primitive in this project doesn't accept an overlay className, add a small local style block or extend `src/components/ui/sheet.tsx` to accept an `overlayClassName` prop and thread it through — scoped strictly to the Sheet component so no other stacking changes.

No behavior changes on mobile (drawer path is unaffected) and no logic changes outside the presentation of the Sheet.

## Out of scope

- Re-uploading or copying image binaries between storage buckets.
- Changes to categories, quantities, or other import fields already handled.
- Any changes to the mobile drawer flow, which already works correctly.
