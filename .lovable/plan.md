
# Fix the toner system + real emailed PDF receipt

Today the toner flow is a hidden panel bolted onto the order cart: you can only "ask for toner" by starting a normal supply order, picking a delivery room, and then a note is glued onto the request. Toners aren't in inventory, aren't in a category, aren't in stock, aren't in Storage Room 1726, and there's no way to update a room's printer. The "receipt" is just an on-screen card — no PDF is emailed. This plan fixes all of that.

## 1. Toner becomes real inventory

- Add an **"Toner / Printer Supplies"** category to `inventory_categories`.
- Seed `inventory_items` with one row per distinct `toner_code` currently in `room_printers` (26A, TN650, etc.), each:
  - `category = Toner / Printer Supplies`
  - `storage_room = Room 1726` (linked to the actual room record)
  - `minimum_quantity`, `quantity`, `unit = cartridge` — starting stock entered by admin (default 0, editable)
- Toners now appear in the normal Inventory list, Quick Order grid, low-stock counts, transactions, audits — exactly like paper, pens, etc.
- Ordering a toner = adding the toner item to the cart like anything else. No special "room-attached note" path required.

## 2. Room ↔ Printer ↔ Toner is manageable

New admin screen **Spaces → Room → Printer** (and a top-level "Printers" tab under Admin → Supply):

- List all `room_printers` with columns: Room, Printer model, Toner code, Needs review.
- Edit a row: change printer model, change toner code, mark reviewed, or unassign.
- Add a new printer to a room, or move a printer between rooms.
- When toner code changes, the room's suggested toner in the order cart updates automatically because `RoomPrinterToners` already reads `room_printers`.
- Linking picks from the new Toner inventory items (dropdown of toner SKUs) so the room's toner code always matches a real inventory item.

## 3. Smarter order cart

The `RoomPrinterToners` panel stays, but its job becomes: **"this room uses toner X — add 1 to your cart?"** One tap adds the toner inventory item to the cart. No more free-text note; the order line is the toner itself. Manual entry becomes a fallback that files a "needs review" flag on the room, same as today.

You can also order toner without picking a room — just add the toner from Quick Order like any other item.

## 4. Emailed PDF receipt with QR to dashboard

Right now `SupplyOrderReceipt.tsx` renders a nice on-screen card with a QR code, but nothing is emailed and nothing is a PDF. Fix:

- Generate a PDF server-side in the existing `send-supply-email` Edge Function using `@react-pdf/renderer` (or pdf-lib) that mirrors the on-screen receipt: header, requester block, items table, timeline, notes, QR code.
- **QR code** encodes a signed deep link: `https://nyscfhub.com/supply/my-requests?open=<request_id>` — scanning opens the requester's dashboard focused on that request.
- Attach the PDF to the two requester emails already wired up:
  - **Receipt email** (on submit) → attached PDF `Receipt-<displayId>.pdf`
  - **Fulfilled email** (on ready/complete) → attached final PDF with fulfilled quantities and pickup timestamp
- The supply-team alert email stays as-is (link only).

## 5. What the user sees

- Order a single toner: Inventory → Toner category → "26A" → Add to cart → submit. Done. No room required.
- Room switches printers: Admin → Printers → edit the row, pick new toner. Order cart's toner suggestion updates.
- After submitting: email lands in the requester's inbox with a real PDF receipt + scannable QR.

## Technical details

- **Migration:** insert Toner category; seed inventory_items from distinct `room_printers.toner_code`; add `inventory_item_id` FK column on `room_printers` (nullable) pointing at the canonical toner SKU so future edits stay in sync.
- **UI:** new `admin/pages/admin/Printers.tsx` list + edit sheet, reusing existing shadcn table patterns; small "Edit printer" action on room detail.
- **Edge function:** extend `send-supply-email` — add PDF generation, base64 attach via Resend `attachments`. QR generated with `qrcode` npm on the server.
- **Receipt data:** already assembled in `useSupplyReceipts`; reuse the same `ReceiptData` shape server-side.
- **Order cart:** `RoomPrinterToners` swaps its "compose note" behavior for "add inventory item to cart" using the new `inventory_item_id` on `room_printers`. `tonerNote` composition + `flagRoomForPrinterAssignment` fallback stay for the manual-entry branch only.

```text
Room 1726 (storage)
   │
   ├── Inventory items (Toner category)  ── ordered like any supply
   │        ▲
   │        │ inventory_item_id
   │        │
   └── room_printers ──── linked to real toner SKU
                          ▲
                          │
                       Order cart suggestion
```

## Out of scope for this pass

- Auto-decrement of toner stock on fulfillment (already handled by the generic fulfillment path — will verify but no new work expected).
- Historical migration of past toner-note requests into inventory transactions.
