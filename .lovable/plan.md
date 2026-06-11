## What I found

**Why so many orders get stuck waiting for approval:** the approval rule is correct in principle — only items flagged `requires_justification` in `inventory_items` trigger it — but the flag is overused. Today batteries (AA/AAA/9V/C/D), desk blotters, wrist pads, and other everyday consumables are all marked restricted. So routine restock orders silently land in `pending_approval`, exactly what happened to Rashida.

**Why placing an order is annoying:**
- The cart submit button buries delivery location and priority behind a secondary "Add Details" screen, so most orders go in without a delivery room and staff have to chase the requester.
- Delivery location is a free-text box every time — no memory of the user's room, no pick-list of rooms they're already assigned to.
- "Restricted" items look identical to normal items in the catalog. The first time a user finds out their order needs approval is *after* they've submitted it.
- The confirmation screen doesn't tell you which items triggered approval or how long it usually takes.
- No "reorder my last order" shortcut.

## What I'll build

### 1. Dial back the approval gate (data + safety net)
- **Data fix:** clear `requires_justification` on truly routine consumables (batteries, blotters, wrist pads, basic office consumables). Keep it ON only for furniture (table, desk, chairs) and other genuinely high-cost / controlled items. I'll show the full proposed list as a migration so you can edit before it runs.
- **Add a quantity guard** in `submitSupplyOrder`: any single line >= 25 units, OR a total order >= 50 units, also routes to `pending_approval` even when no item is flagged. This catches the "someone ordered 200 pens" case without forcing approval on everyone.
- **Auto-notify admins** when an order does land in `pending_approval`: insert into `admin_notifications` (table already exists) so it shows up in the bell/dropdown.

### 2. Redesign the order form (UX overhaul)
**Restricted-item visibility (no surprises)**
- Amber "Needs approval" pill on every restricted item in `CompactItemList` and `ItemDetailPanel`.
- Cart shows an inline notice when at least one cart item is restricted: "This order will be sent for approval because of X, Y, Z. Usually approved in <1 business day."

**Streamlined checkout (one screen, not two)**
- Replace the two-step "Add Details (Optional) → Submit" with a single checkout view inside the cart sheet:
  - **Delivery location** as a Combobox: pre-filled with the user's primary assigned room from `occupant_room_assignments`, plus a recent-locations dropdown (pull from their last 5 supply requests), plus free-text fallback. No more empty delivery locations.
  - **Priority** as 3 segmented pill buttons (Normal / High / Urgent) instead of a select — one tap.
  - **Reason** optional, with quick-pick chips (Restocking / New person / Special project / Replacement) plus a free-text field.
  - **Needed by** optional date.
- Sticky bottom "Submit Order" button is always visible; cart line items scroll above it.

**Faster repeat orders**
- New "Reorder" button on the order confirmation screen and on each row in "My Supply Requests" — pre-fills the cart with the same items and quantities.
- On the empty-cart state, surface a "Reorder your last request" CTA showing the previous order's item names + a one-tap add-all button.

**Mobile polish**
- Replace the small floating cart pill with a full-width sticky bottom bar (`Review N items →`) when cart > 0 — much more obvious touch target on mobile.
- 44px minimum touch targets on all stepper buttons (already there, verifying).

**Confirmation screen upgrade**
- Show the actual items + quantities, delivery location, and a clear next-step line: "We'll notify you when it's ready for pickup" or "An admin will review this order — typical wait <1 business day".
- Direct "Reorder", "Track this order", "Order something else" CTAs.

### 3. Out of scope (call out so it's explicit)
- Room setup / delivery requests — you scoped to supply orders only. I'll leave that flow for a follow-up.
- Email/SMS notifications for approvals — admin in-app notification is enough for now.
- Removing approval entirely — you chose to keep it for restricted items.

### Technical details
- Files: `src/features/supply/services/unifiedSupplyService.ts` (qty guard + admin_notifications insert), `src/features/supply/hooks/useOrderCart.ts` (pass new payload fields), `src/features/supply/components/supply/OrderCart.tsx` + `OrderSummaryFooter.tsx` (checkout redesign), `CompactItemList.tsx` + `ItemDetailPanel.tsx` (restricted badge), `OrderConfirmation.tsx` (richer summary + reorder), `MySupplyRequests.tsx` (reorder button), new `DeliveryLocationCombobox.tsx`, new `useRecentDeliveryLocations.ts` hook.
- Data migration: `UPDATE inventory_items SET requires_justification = false WHERE name IN (...)`. I'll list the exact item names in the migration body before running it.
- No schema changes, no new tables.

### What I'll verify before declaring done
- Place a test order with only routine items → goes straight to `submitted` and shows up on the staff dashboard immediately.
- Place a test order with a chair (restricted) → goes to `pending_approval`, appears in the new "Needs Approval" tab, and an admin notification is created.
- Place a test order of 60 pens → goes to `pending_approval` via the qty guard.
- Reorder a past request → cart is repopulated correctly.
