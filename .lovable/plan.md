## Goals
Fix the two reported mobile bugs on the Rooms page (can't scroll, swipe-edit button misaligned), then sweep adjacent mobile surfaces for the same patterns and verify mobile-relevant security/UX hygiene.

## Confirmed root causes

**1. Rooms page won't scroll on mobile**
`src/features/spaces/components/spaces/views/RoomsPage.tsx` line 177 wraps everything in:
```
<div className="flex flex-col gap-4 h-[calc(100svh-260px)] min-h-[520px] overflow-hidden">
```
That fixed height + `overflow-hidden` caps the mobile view. On mobile the inner `RoomsContent` is a plain vertical list with no internal scroller, so rows past the viewport are clipped and unreachable. (Same pattern that broke the Issues page.)

**2. Swipe-reveal Edit/Delete buttons misaligned**
In `MobileRoomCard.tsx` the action strip uses both `opacity` and `scale` motion transforms (`actionsScale` goes 0.6 → 1). The scale is applied to the whole absolutely-positioned strip, so the buttons visually shrink toward the strip's transform-origin and no longer line up with the right edge of the swiped card — the Edit button appears offset/floating. Other contributors: the strip uses `inset-y-0 right-0` with `items-stretch` but the Edit button is an `EditSpaceDialog` wrapper whose trigger isn't guaranteed to stretch to full height.

## Fix plan

### A. Rooms page scroll (mobile)
- Remove the fixed-height wrapper on mobile. Keep desktop master/detail height (it needs it for the ResizablePanelGroup), but on mobile let the page grow naturally.
- Approach: split the container — `flex flex-col gap-4` always, then apply `md:h-[calc(100svh-260px)] md:min-h-[520px] md:overflow-hidden` only at `md:` and up. The mobile `RoomsContent` list will then scroll inside the page's normal scroll container.
- Verify the parent `Spaces.tsx` / Layout already provides page-level scrolling on mobile (it does — main has `mobile-main-padding`).

### B. Swipe action alignment
- Drop the `scale` transform on the action strip; keep `opacity` only. Scaling a position-absolute strip causes the visible misalignment.
- Make both buttons full-height explicitly (`h-full`) and ensure the `EditSpaceDialog` child button stretches (wrap trigger in a `h-full flex` or pass `asChild` properly).
- Tighten `actionWidth` math: 2 × 70px = 140 ✓ (already correct).
- Add `will-change-transform` and `touch-action: pan-y` on the draggable card so vertical page scroll isn't hijacked by the horizontal drag gesture.

### C. Mobile deep-dive sweep (read-only audit + small fixes where found)
Check the same "fixed height + overflow-hidden" anti-pattern and swipe/transform issues on:
- Keys, Inventory, Supply, Tasks, Term Sheet, Operations (already fixed), Dashboard
- `MobileRoomDrawer`, `RoomQuickEditSheet`, `QuickSpaceBottomSheet` — confirm they scroll inside the sheet and respect safe-area
- `BottomTabBar` + FABs — confirm they don't cover content (mobile-main-padding already handles, verify each page applies it)
- Touch targets ≥44px on swipe buttons, filter chips, FAB
- Inputs ≥16px font-size to prevent iOS zoom (already enforced globally, spot-check)

Fix any clear regressions found during the sweep; list anything larger as follow-ups instead of expanding scope here.

### D. Security spot-check (mobile-relevant)
- Confirm no role/permission checks are gated only on `useIsMobile` or client storage.
- Confirm `RoomQuickEditSheet` / `EditSpaceDialog` mutations still go through the same RLS-protected endpoints on mobile (no mobile-only bypass).
- Confirm the swipe Delete action goes through `delete_room_cascade` RPC (per project memory) and not a raw delete.
- No new RLS work expected; report findings if anything is off.

## Verification
- Reload Rooms on mobile viewport (440×672): scroll the full list, swipe a row left, confirm Edit + Delete sit flush against the right edge and tap targets land correctly.
- Repeat on a long room list to confirm last row is reachable.
- Tap Edit → confirm `EditSpaceDialog` opens; tap Delete → confirm confirm dialog and cascade.
- Quick pass on Keys / Inventory / Tasks mobile lists for scrollability.

## Out of scope
- Redesigning the mobile Rooms card layout
- Adding new mobile features (filters, sorting UI changes)
- Server-side schema changes