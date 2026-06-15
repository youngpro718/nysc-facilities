# Supply Request: Searchable Room Picker

## Problem
Today, the delivery location on a supply order is a **free-text input** with a few chip suggestions from the user's assigned/recent rooms. There's no way to search the database for a specific room, so typos and made-up labels slip into orders, and the location can't be cleanly linked back to a real room record. The user wants this to work the way other places in the app already do — search the rooms table, pick the actual room.

## Solution
Reuse the existing search pattern from `RoomSelector` (used by Keys / Lockbox slots) inside the supply order flow, so the delivery location always resolves to a real room.

### 1. Add a reusable `DeliveryRoomPicker`
- New component: `src/features/supply/components/supply/DeliveryRoomPicker.tsx`
- Combobox (Popover + Command), searches the `rooms` table by `room_number`, `name`, floor name, and building name — same fields and pattern as `RoomSelector`.
- Shows result rows as: **Room number — Name** with a small building/floor sub-line.
- Pinned section at the top: **Your rooms** (from `useUserRoomAssignments`) and **Recent** (from `useDeliveryLocations`'s recent list), so the one-tap behavior the user already has is preserved.
- Output: writes a normalized string like `Room 1000 — Clerk's Office` to `delivery_location` (keeps the existing column as-is, no schema change).

### 2. Use it in the order cart
- `OrderCart.tsx`: replace the chip row + `<Input>` with `<DeliveryRoomPicker />`. Keep the "this isn't your home room" warning and the missing-location hard block.
- `OrderSummaryFooter.tsx`: same swap, keep prefill from primary assigned room.

### 3. Use it when staff edits a placed order
- `EditDeliveryLocationButton.tsx`: replace the dialog's plain `<Input>` with `<DeliveryRoomPicker />` so admins re-route to a real room too.

## Out of scope
- No DB migration. `supply_requests.delivery_location` stays a text column.
- No change to how requests are submitted, approved, or displayed elsewhere.
- Not touching the Keys/lockbox naming work from earlier turns.

## Files
- **New:** `src/features/supply/components/supply/DeliveryRoomPicker.tsx`
- **Edit:** `src/features/supply/components/supply/OrderCart.tsx`
- **Edit:** `src/features/supply/components/supply/OrderSummaryFooter.tsx`
- **Edit:** `src/features/supply/components/supply/EditDeliveryLocationButton.tsx`

## Validation
Open a new supply order on the preview, confirm the room field is a searchable picker, type a room number, pick it, submit, and verify the order shows the selected room. Then as admin, edit an existing order's delivery location through the same picker.
