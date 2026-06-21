## Problem

On `/supplies?tab=order`, clicking **Deliver to → Search for a room…** in the Review-order dialog doesn't reliably open the search dropdown (or it flashes open and closes immediately). The picker works fine outside the dialog.

The cart's `DeliveryRoomPicker` is rendered inside a Radix `Dialog` with `modal=true`. Two things in `DeliveryRoomPicker.tsx` interact badly with that:

1. The trigger `Button` calls `e.stopPropagation()` in both `onClick` and `onPointerDown`. Although Radix's Slot composes handlers, stopping propagation here interferes with Radix's pointer-event sequencing for opening the popover when nested inside another modal layer.
2. The picker forces `modal={true}` on the Popover. Nesting a modal Popover inside a modal Dialog creates competing focus traps and outside-click detectors — the Dialog treats the portaled Popover content as "outside" and the click ends up closing the popover (or never settling it open).

## Fix

Edit `src/features/supply/components/supply/DeliveryRoomPicker.tsx`:

- Remove the `onClick` and `onPointerDown` `stopPropagation` calls on the trigger button. They aren't needed — clicks inside a `DialogContent` don't bubble out to close the dialog.
- Change the default for the `modal` prop from `true` to `false`, so when used inside another modal (Dialog/Sheet) the popover doesn't fight focus traps. The existing `pointer-events-auto` on `PopoverContent` already handles the body-pointer-events case.
- Keep the existing `z-[100]`, `pointer-events-auto`, and `onOpenAutoFocus` preventDefault — those are still needed.

No other files need to change. All four call sites (`OrderCart`, `OrderSummaryFooter`, `EditDeliveryLocationButton`, `RequestForm`) keep working; the ones that pass `modal` explicitly are unaffected.

## Verification

After the change, in build mode I'll drive Playwright against the running preview:
1. Open `/supplies?tab=order`, add an item, open Review order.
2. Click **Search for a room…** and screenshot — the command list should be visible.
3. Type a room number, screenshot the filtered results, click one, confirm the field populates and the dialog stays open.
