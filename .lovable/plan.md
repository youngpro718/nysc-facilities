## Court Aide QA & Fulfillment Fix

Focused on the Court Aide role only. Fixes the "Start" bug you hit, wires the Work Center → Supply Room fulfillment handoff end-to-end, and cleans up the small clutter/dead-button items across the five pages a court aide actually sees.

### What's wrong today

- **Start button (Work Center → Supply Fulfillment):** clicking Start only flips the DB status to `picking` and shows a toast. No navigation, no dialog. That's why "nothing happens."
- **Supply Room dialog isn't deep-linkable:** the pick/pack dialog (`PartialFulfillmentDialog`) opens from local state only. There's no URL for a specific request, so the Work Center can't hand off to it.
- **Ready orders dead-end** in the Work Center — static "Awaiting pickup" badge with no way to confirm pickup from there.
- **Inventory tab uses `window.location.href`** — full page reload, loses state.
- **`TodaySchedule`** duplicates task data with zero actions.
- **Court aide sidebar** missing Profile link that other roles have.

### What I'll build

**1. Fix Start → open fulfillment (the core bug)**

- Make Supply Room support a `?request=<id>` query param that auto-opens `PartialFulfillmentDialog` for that request on mount (also switches to the correct tab).
- Change `SupplyFulfillmentPanel` "Start" to: run the existing `startFulfillment` mutation, then `navigate('/supply-room?request=' + id)`.
- Same for `Mark Ready` follow-through: on `ready` rows in the panel, replace the static badge with a "Confirm pickup →" button that deep-links to `/supply-room?request=<id>` so the aide can complete the order without hunting.

**2. Work Center panel polish**

- `SupplyFulfillmentPanel`: tighten card layout, add a small "Open in Supply Room" link on every row (icon-only on mobile), keep Start/Mark Ready inline.
- `TodaySchedule`: add "Open task" action per row that opens the same task card actions used in `TaskWorkQueue` (or removes the panel if it stays read-only — I'll keep it and add the action).
- `WorkCenterStats`: verify the "Supplies Fulfilled" count matches Supply Room's own count (align both on `fulfilled_at` non-null + today).

**3. Nav / routing cleanup for court aide**

- Add Profile entry to court aide nav (parity with other roles).
- Remove the aide's URL access to `/supplies` (the requester ordering page) or redirect it to `/work-center` — it's not their tool.
- Replace `window.location.href = '/inventory'` in `ImprovedSupplyStaffDashboard` with `useNavigate`.

**4. Pass over the 5 aide pages for clutter**

Quick visual + interaction pass on: Work Center, Tasks, Supply Room, Inventory, Term Sheet. Only touch what's actually broken or visually noisy — spacing, duplicate headers, dead buttons, mobile touch targets. No redesigns; if a page looks fine, leave it.

### Out of scope

- Non-court-aide roles and pages.
- Database schema changes (all mutations already exist).
- Redesigns of pages that are working cleanly.

### Verification

- Playwright: sign in as court aide, click Start on a submitted supply request, confirm it lands on Supply Room with the fulfillment dialog open for that request, complete the order, return to Work Center and confirm counts update.
- Spot-check each of the 5 aide routes for console errors and dead buttons.

### Technical notes

- Files touched (expected): `SupplyFulfillmentPanel.tsx`, `ImprovedSupplyStaffDashboard.tsx`, `SupplyRoom.tsx` (query param handling), `TodaySchedule.tsx`, `WorkCenterStats.tsx`, `navigation.tsx`, `App.tsx` (redirect `/supplies` for aides), possibly `roleBasedRouting.ts`.
- No new tables, no edge function changes, no new dependencies.
