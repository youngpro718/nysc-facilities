
## Goal

When a user places a supply order, selecting the delivery room should auto-surface the printers assigned to that room and the toner codes those printers use, so users pick a toner from a list instead of typing a code. Rooms with no printer mapping show a message and allow manual entry + get flagged for future assignment.

## 1. Database (migration)

New table `public.room_printers`:

- `room_id` uuid → `rooms.id` (nullable — kept null when we couldn't resolve the room number, so the record is still importable and reviewable)
- `room_number_raw` text (original "Room" value from the import, e.g. `"1000"`, `"1010 B"`)
- `department` text
- `printer_model` text
- `toner_code` text (e.g. `26A`, `TN650`) — nullable
- `needs_review` boolean (true when room_id is null, or printer_model/toner_code missing, or the row had ambiguities)
- `review_reason` text
- standard `id`, `created_at`, `updated_at`

Also:
- Trigger to auto-set `needs_review = true` when any of room_id/printer_model/toner_code is null.
- `GRANT SELECT` to `authenticated`, full CRUD to admin/facilities via RLS; `GRANT ALL` to `service_role`.
- RLS: authenticated can read; only `admin`/`facilities_manager`/`system_admin` can insert/update/delete (via `has_role`).
- Index on `room_id` and on `toner_code`.

New table `public.room_printer_flags` (optional — could be a column on rooms, but a separate table keeps it clean):

- `room_id` uuid unique → `rooms.id`
- `reason` text (defaults to "no printers linked")
- `flagged_at`, `resolved_at`
- Populated automatically when a user submits a toner order for a room that has zero `room_printers` rows.

Duplicate handling per spec: no unique constraint across (room_id, printer_model, toner_code) — duplicates are kept.

## 2. Data import (one-off, via `supabase--insert` after migration)

Parse the printer list from the request into rows. For each row:

1. Try to match `Room` to `rooms.room_number` (case-insensitive, trim). Rooms like `"1010 B"`, `"1001 A"` match exact strings; if no exact match, try stripping the letter suffix as a fallback and mark `needs_review = true`.
2. Store the original `Room` value in `room_number_raw`.
3. Missing printer_model or toner_code → import anyway with `needs_review = true` and `review_reason` describing what's missing.
4. Do not deduplicate — insert all rows verbatim.

Rows that hit the same room (e.g. Room 1000 Central Clerks with 3 different printers, or Room 1000 "Office" duplicates) all persist.

## 3. Supply order form UX

Edit `src/features/supply/components/supply/OrderCart.tsx` (the existing DeliveryRoomPicker already fires with `room_id`). Add a new `RoomPrinterToners` panel underneath the DeliveryRoomPicker, only rendered when a delivery room is selected.

Behavior:

- Query `room_printers` filtered by `room_id` via a new `useRoomPrinters(roomId)` React Query hook (`queryKey: ['room-printers', roomId]`, stale 5 min).
- **No printers found:** show a muted card:
  > "No printers have been linked to this room."
  > Plus a small "Enter toner manually" input and a note: "This room will be flagged for future printer assignment." On order submit, upsert a `room_printer_flags` row for that room.
- **One toner across all printers:** auto-check that toner and show `HP … → 26A` with a checkmark.
- **Multiple distinct toners:** list each toner once with the printer(s) that use it, as checkboxes:
  ```text
  ☐ 37A  — HP Color LaserJet Enterprise M608
  ☐ 26A  — HP LaserJet Pro M402dne
  ```
- Selected toner codes are appended to the cart submission as new cart entries (matched against the `inventory_items` catalog by `sku`/`name` containing the toner code; if no catalog match, the toner code goes into the request's notes so supply staff still see it).

Rows with `needs_review = true` get a small amber "Needs review" chip next to the printer line, but are still selectable.

## 4. Admin surface (light-touch)

Extend the existing inventory/admin area with a simple "Printers by Room" table (read-only list + edit/delete) so admins can correct flagged rows. Keep it minimal — a single page under `/admin` reusing existing table components. No separate CRUD dialog work beyond inline edit for `toner_code`, `printer_model`, `room_id`.

## Technical notes

- Migration file structure follows project rules: CREATE TABLE → GRANT (authenticated read + service_role all) → ENABLE RLS → CREATE POLICY.
- No changes to `rooms`, `inventory_items`, or `supply_requests` schemas.
- Import runs via `supabase--insert` (data change, not schema).
- Frontend edits are limited to: new hook `useRoomPrinters.ts`, new component `RoomPrinterToners.tsx`, and an insertion in `OrderCart.tsx`. Cart submission logic is only touched to append toner selections + write the flag row when no printers exist.

## Open question before build

Should the toner selections in the order **create actual cart line items** by matching against your `inventory_items` catalog (so they flow through normal fulfillment/stock deduction), or should they just be recorded as notes on the request so supply staff pull the right toner manually? The catalog-match path is cleaner but assumes toner codes like `26A`/`TN650` appear in `inventory_items.sku` or `name` — if they don't, we'd need a mapping. I'll default to **catalog-match by SKU/name with a notes fallback** unless you say otherwise.
