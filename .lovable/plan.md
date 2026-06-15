# Two fixes for the supply order flow

## 1. "Click the room picker, nothing happens"

**Cause:** `DeliveryRoomPicker` is a Radix Popover, and we're using it *inside* Radix Sheets (`OrderCart` review sheet and `OrderSummaryFooter` review sheet, plus the `EditDeliveryLocationButton` Dialog). Radix Sheet/Dialog is modal — it locks `pointer-events: none` on the body, and Popover's portal content is a sibling of the body, so taps on the popover content (or sometimes the trigger inside the sheet) get swallowed. This is the classic "popover inside a modal does nothing" bug.

**Fix in `DeliveryRoomPicker.tsx`:**
- Add an optional `modal` prop (default `true`) and pass it to `<Popover modal={...}>`. Setting `modal={true}` on the Popover itself makes Radix correctly manage focus + pointer events when nested inside another modal layer.
- Render `PopoverContent` inside a `Portal` with `onOpenAutoFocus={(e) => e.preventDefault()}` and `onCloseAutoFocus={(e) => e.preventDefault()}` so the parent Sheet doesn't yank focus back and immediately close the popover.
- Stop click propagation on the trigger Button (`onClick={(e) => e.stopPropagation()}`) so the surrounding sheet/card doesn't intercept the tap.
- Raise z-index so it always paints above the sheet: `z-[100]` (sheets are `z-50`).

No callers need to change — they keep using `<DeliveryRoomPicker value=... onChange=... />`.

## 2. "On mobile, I don't see how to submit the order"

The mobile flow (`QuickSupplyRequest` → `OrderSummaryFooter`) does show a floating cart bar after you add items, but:

- For ≤3 items with no restricted items, the button reads **"Order"** (a green gradient zap-icon button). Users don't read that as "submit my order" — it looks decorative.
- The bar sits at `bottom-0`, directly on top of the `BottomTabBar` (also `bottom-0`, `z-40`). The footer is `z-50` so it wins, but the result is a cramped stack where the submit pill visually merges with the tab bar and is easy to miss.

**Fix in `OrderSummaryFooter.tsx`:**
- Lift the floating bar above the bottom tab bar: change wrapper to `bottom-16 md:bottom-3` (the tab bar is `md:hidden`, ~64px tall) and keep `pb-safe`.
- Rename the primary CTA so it always reads as a submit action:
  - Quick path: **"Submit Order"** with the Send icon (drop the "Quick Order"/"Order" wording and Zap icon, or keep Zap but use the word "Submit").
  - Restricted path keeps **"Request Approval"**.
  - Many-items path keeps **"Review & Submit"**.
- Add a thin "Tap to submit ➜" hint label above the cart row on mobile when items > 0, so the action is unmistakable.
- Make the whole footer card slightly taller (`min-h-[68px]`) and add a subtle ring so it visually separates from the tab bar.

No state/logic changes — purely presentation + a copy change on the CTA.

## Files

- `src/features/supply/components/supply/DeliveryRoomPicker.tsx` — add `modal` prop, portal focus guards, stopPropagation on trigger, bump z-index.
- `src/features/supply/components/supply/OrderSummaryFooter.tsx` — lift above tab bar, rename CTA to "Submit Order", add hint, visual separation.

No DB changes. No changes to `OrderCart.tsx` logic — it'll inherit the picker fix automatically.
