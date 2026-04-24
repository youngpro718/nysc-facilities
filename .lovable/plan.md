
# Mobile Key Management Redesign

Yes — your mockup is achievable. It's essentially a mobile reorganization of data we already have (keys, lockbox slots, assignments, lockboxes). No new tables needed.

## What the mockup introduces vs. today

Today's mobile Keys page is a **6-tab layout** (Lockbox / Keys / Assign / History / Passes / Manage) with stat cards at the top. Each tab is a separate dense view.

Your mockup collapses this into **one scannable list** anchored by:

1. **Header** — title + subtitle + notification bell
2. **Search bar** with barcode scan icon
3. **Status filter chips** — All / Available / Checked Out / Missing + filter funnel
4. **Key Box Overview** — horizontally scrollable lockbox cards with slot fill bars + "All Boxes" entry
5. **Key list rows** — one row per key combining: key icon (color-tinted by status), name, room, lockbox + slot, status pill, primary action button (Take/Return/Report Missing/Assign Room), chevron, and a secondary line for checked-out keys ("Checked out to John Smith · May 20, 9:15 AM")
6. **Add / Register New Key** CTA at the bottom
7. **Bottom tab bar** is your existing mobile nav — no change

## Mapping to existing data

| Mockup element | Source |
|---|---|
| Status counts (155/140/6/3) | `key_statistics_view` aggregation |
| Box A/B/C cards with slot fill | `lockboxes` + `lockbox_slots` (already in `LockboxView`) |
| Key row name + room | `key_statistics_view` + `lockbox_slots.room`/`label` |
| Box + Slot column | join `lockbox_slots` → `lockboxes.name` |
| Status pill (Available/Checked Out/Missing/Unlinked) | `lockbox_slots.status` + `getRoomLinkStatus()` (already exists in `LockboxTypes.ts`) |
| "Checked out to … · date" | latest `key_assignments` row |
| Take / Return / Report Missing / Assign Room buttons | reuse existing dialogs (`LockboxSlotDialog`, `RoomSelector`) |

## Proposed file structure

New mobile-only view, kept separate so we don't break desktop:

```
src/features/keys/components/keys/mobile/
  MobileKeyManagement.tsx          // top-level layout
  MobileKeyHeader.tsx              // title + bell
  MobileKeySearch.tsx              // search input + barcode icon
  MobileKeyStatusChips.tsx         // All/Available/Checked Out/Missing + filter
  MobileKeyBoxOverview.tsx         // horizontal-scroll lockbox cards
  MobileKeyRow.tsx                 // single rich row with status icon + action button
  MobileKeyList.tsx                // virtualized list of rows + sort header
```

`Keys.tsx` change: detect mobile (existing `useIsMobile` hook) and render `<MobileKeyManagement />` instead of the tab layout. Desktop remains untouched.

## Visual rules (matches the mockup)

- **Status colors** — reuse existing semantic tokens: green = `in_box`, amber = `checked_out`, red = `missing`, neutral = `unlinked`/`no_room`. No hardcoded hex.
- **Key icon** — circular tinted background (10–15% opacity) + filled key glyph in solid status color
- **Box overview cards** — horizontal `ScrollArea`, snap-x; selected card gets a `ring-2 ring-primary` outline; thin progress bar shows used/total slots
- **Action button** per row uses `variant="outline"` with status color border/text — matches the "Take Key", "Return Key" pills in your mockup
- **Touch targets** ≥ 44px (per project iOS standard)
- **Bottom CTA** — sticky `Add / Register New Key` button above the tab bar on mobile; opens existing `CreateKeyDialog`

## Behavior changes worth confirming

1. **One unified list vs. tabs** — In the mockup, "Keys", "Lockbox", and "Assignments" collapse into one list. History, Passes, and Manage would move into a "More" drawer or a compact secondary tab strip above the list. Acceptable?
2. **Barcode scan icon** — show the icon now, but wire to a placeholder toast unless you want me to integrate a scanner library this round.
3. **Notification bell (6)** — your mobile header already has notifications; I'll reuse that count, not introduce a new one.
4. **"Unlinked" rows** — the mockup shows a row with status "Unlinked" + "Assign Room" button. We already have `getRoomLinkStatus()`; "Assign Room" opens the existing `RoomSelector` dialog.

## Files I will edit

| File | Change |
|---|---|
| `src/features/keys/pages/Keys.tsx` | Add `useIsMobile` branch → render `<MobileKeyManagement />` on mobile |
| `src/features/keys/components/keys/mobile/*` (new, 7 files) | Build the redesigned mobile view |

## Out of scope for this pass

- Desktop redesign (current tab layout stays)
- Any DB schema changes
- Real barcode scanner integration (just the icon + stub)
- Server-side pagination — list is small enough today; can add virtualization later

Approve and I'll build it. If you want any of the "behavior changes" above resolved differently, tell me and I'll fold those into the implementation.
