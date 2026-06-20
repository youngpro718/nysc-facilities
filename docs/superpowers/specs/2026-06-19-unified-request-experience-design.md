# Court Aide Request Experience — Design

**Date:** 2026-06-19
**Status:** Approved for implementation planning
**Replaces an earlier draft of this spec dated the same day; scope was narrowed from "all requests" to "Court Aide requests only" after the team-boundary discussion.**

## Background

Two different teams fulfill what the app today calls "requests":

| Team | What they fulfill | Where the work goes |
|---|---|---|
| **Court Aides** | Supply orders + bring/move/deliver/setup tasks | `supply_requests`, `staff_tasks` → Work Center |
| **Facilities (DCAS / maintenance)** | Building issues — broken doors, electrical, HVAC, plumbing, lighting, pest, structural, cleaning | `issues` → Operations |

The app's surface today mostly ignores this boundary. A user has four entry points (`Order Supplies`, `Make a Request`, `Set up a Room`, `Report Issue`) that **look** like four members of one family but actually split across two completely different fulfillment teams. The result: Court Aide work and Facilities work compete for visual space in the same nav, the same FAB, the same `/my-activity` tabs, even though they have nothing operational in common.

This spec covers three changes that align the **Court Aide request side** with how the Work Center already groups the work. **It does not touch Issues.** Facilities-side consistency is a separate (smaller) effort.

## Goals

1. **One Court Aide surface.** `/supplies` becomes the front door to both supply orders and court-aide tasks. Two tabs in one page: `Order Supplies` (today's catalog) and `Make a Request` (help / setup / delivery). Same nav slot, same team.
2. **One Court Aide inbox.** `/my-requests` shows every supply order and court-aide task the user has submitted, in one list. Issues stay on `/my-issues` (or a focused Operations filter), unchanged.
3. **One Court Aide status vocabulary.** Supplies and court-aide tasks share five user-facing labels. Issues keep their own labels because they go through a different team with different SLAs.

## Non-goals

- **Issues are explicitly out of scope.** No merging issues into the Court Aide inbox. No remapping issue statuses into Court Aide vocabulary. No new entry points that conflate the two teams. The Report Issue button stays where it is and behaves as it does today.
- A single intake modal that asks "what do you need?" up front. Deferred.
- Changes to the internal state machines on `supply_requests` or `staff_tasks`. Translation is a UI helper.
- Changes to Work Center, Supply Room, or any staff-facing fulfillment surface.
- Renaming or restructuring DB tables. None required.
- Touching the public-form PDF workflow.
- Sidebar consolidation of `Issues` / `Maintenance` / `Lighting` (they're all Operations tabs). Separate small spec.

---

## Piece 1 — `/supplies` becomes the Court Aide front door

### What ships today

- `/request/supplies` shows only the catalog.
- `/request/help` shows the type-picker for tasks.
- `/request/help?type=setup` is the setup form.
- Each is a separate page with its own header chrome and its own success state.

### What we ship

- The route `/supplies` replaces `/request/supplies` as the canonical entry. Legacy `/request/supplies` redirects in.
- The page has two tabs at the top: `Order Supplies` and `Make a Request`.
- `Order Supplies` tab renders today's catalog flow, unchanged — the existing cart pill, the centered review modal, the pack-equivalent line. No interaction changes.
- `Make a Request` tab renders today's four-button picker (`Set up a room` / `Bring me something` / `Move something` / `Something else`). Each button still opens its existing form, but the success state changes (Piece 2).
- Sidebar nav item renamed to **`Supplies & Requests`**, single nav slot for the Court Aide surface.
- Header buttons (today: `Order Supplies` + `Make a Request`) collapse to a single dropdown trigger labeled **`+ Court Aide`** with two items that route to `/supplies?tab=order` and `/supplies?tab=request`. The existing two buttons can stay as a transitional skin if the dropdown reads awkward — pick at implementation.

### Files touched

- New: `src/features/supply/pages/CourtAideRequests.tsx` — the tabbed page; calls into the existing catalog and request components without modifying their internals.
- `src/App.tsx` — register `/supplies`, redirect `/request/supplies` and `/request/help` to it with the right `?tab` and `?type` preserved.
- `src/components/layout/Layout.tsx` (or the sidebar component) — rename the nav item.
- `src/components/layout/Header.tsx` (or wherever the header CTAs live) — collapse to the dropdown.

### Edge cases

- A deep link to `/request/help?type=setup` still works (becomes `/supplies?tab=request&type=setup`) and lands directly on the setup form.
- The FAB on mobile keeps its existing 4 actions and routes to the same destinations — no UX change there, the visual is fine.
- Issues' "Report Issue" button does **not** appear on `/supplies`. Different team.

---

## Piece 2 — One success state (Court Aide only)

### What ships today

| Flow | After submit |
|---|---|
| Supply Order | In-place success view inside the cart modal: `Order submitted!`, `Track my orders` + `Place another order` buttons |
| Help Request | Full-page interstitial replaces the form: `Request Submitted!`, `Track in Tasks` + `Submit Another Request` + `Done` |
| Setup-a-Room | Same full-page interstitial, with a quick summary of what was submitted |
| Report Issue | Toast at corner, dialog closes |

### What we ship

Supply Order and the three task flows (help / setup / move) emit **the same toast** and close the modal / leave the page in place:

```
✓ Request #2026-06-19-014 submitted
  View → (links to /my-requests with the row anchored)
```

- Toast auto-dismisses after 6 seconds.
- The cart modal closes immediately on success. The page underneath stays on the catalog with an empty cart — the user can keep working.
- The task forms (`HelpRequestPage`, `SetupRequestForm`) navigate back to `/supplies?tab=request` and show the same toast.
- The `View →` link routes to `/my-requests?focus={request_id}`, which scrolls the row into view and highlights it for ~3 seconds.

**Report Issue is unchanged.** Its toast remains its own; its dialog closes; its destination remains the Operations page. Different team.

### Files touched

- New: `src/shared/utils/requestToast.ts` — one helper, `requestSubmittedToast({ id, type })`, used by the three Court Aide flows. (Issue forms do not import it.)
- `src/features/supply/components/supply/OrderCart.tsx` — drop the post-submit success branch; emit the toast and close the modal.
- `src/features/supply/hooks/useOrderCart.ts` — `submittedOrder` state and `resetSubmittedOrder` go away.
- `src/features/supply/pages/request/HelpRequestPage.tsx` — replace the full-page success view with `navigate('/my-requests')` + toast.
- `src/features/supply/components/request/SetupRequestForm.tsx` — same.
- `src/features/supply/components/supply/QuickOrderGrid.tsx`, `QuickSupplyRequest.tsx` — drop their consumption of `submittedOrder`.

### Edge cases

- Supply order needing approval: same toast shape, label changes to `Request #… sent for approval. View →`.
- Submit fails after client-side validation passes (e.g. RLS reject): toast turns red, no redirect, user stays on the form.
- The cart sheet closes; the catalog page underneath retains the empty cart state.

---

## Piece 3 — `/my-requests`, the Court Aide inbox

### What ships today

`/my-activity` shows three tabs (`Supplies` / `Reported` / `Requests`). `Reported` is issues. The page mixes two teams' work into one tabbed view, which the team boundary makes confusing.

### What we ship

A new route `/my-requests` that renders one chronological list of **only** Court Aide work: supply orders + court-aide tasks the user submitted.

Issues stay where they are:
- `/my-issues` continues to exist (legacy) and renders only the user's reported issues. We can rename it `/my-reports` later if useful; out of scope here.
- The dashboard can surface a small `Recent issues you reported` card with a `See all` link; not required by this spec.

`/my-activity` redirects to `/my-requests`. The `Reported` tab is no longer accessible through the unified inbox — users find their issues at `/my-issues` instead.

#### List view

- One row per record, sorted by submitted date descending.
- Row layout: `{type chip} {title} · {room or location} · {short id} — {status pill} · {relative time}`
- Type chips: `📦 Supply` · `🪑 Setup` · `🚚 Delivery` · `🙋 Help`
- For `staff_tasks` rows the chip is derived from `staff_tasks.task_type` (`setup` → `🪑 Setup`, `delivery` → `🚚 Delivery`, otherwise `🙋 Help`). Supply rows are always `📦 Supply`.
- Filter chips at the top: `All` · `Open` · `Done`. A secondary row filters by type chip.
- Empty state: short copy + a CTA opening the request modal.

#### Detail view

- Tap a row to open a side drawer (desktop) or full-screen page (mobile) with the type-specific body.
- The detail body reuses existing per-type detail components.
- Header is uniform: title, type chip, status pill, submitted-at, deliver-to / location.

#### Data sources

The list pulls from two existing queries and merges them client-side:

- `supply_requests` filtered to `requester_id = auth.uid()`
- `staff_tasks` filtered to `created_by = auth.uid()`

Each projects onto a common `MyRequestRow` shape: `{ id, type, title, location_label, status_internal, created_at }`. Merging happens in a `useMyRequests()` hook with React Query.

Pagination: show the most recent 50, plus a `View older` link. Most users have under 20 lifetime.

### Files touched

- New: `src/features/dashboard/pages/MyRequests.tsx` — list view.
- New: `src/features/dashboard/hooks/useMyRequests.ts` — merged query.
- New: `src/features/dashboard/components/MyRequestRow.tsx` — uniform row.
- New: `src/features/dashboard/components/MyRequestDetailDrawer.tsx` — uniform header + slot for type-specific body.
- `src/App.tsx` — register `/my-requests`; redirect `/my-activity`, `/my-supply-requests` to it. `/my-issues` is left in place.
- `src/components/layout/Layout.tsx` (sidebar) — `My Activity` is renamed `My Requests`.
- Legacy `MyActivity` page component is removed once its consumers are migrated.

### Edge cases

- Requests submitted on someone else's behalf (court liaison / admin): out of scope. `/my-requests` is strictly "things I personally submitted."
- Realtime updates: subscribe via the existing realtime provider to invalidate `useMyRequests` on insert / update of `supply_requests` and `staff_tasks` for `auth.uid()`. Realtime is sub-second when connected; the 5-second target in Verification is the worst-case fallback.
- Deep link with `?focus={id}`: scroll into view + 3-second highlight ring; ignored silently if id is not in the list.

---

## Piece 4 — One status vocabulary (Court Aide only)

### What ships today

`supply_requests.status` enumerates `submitted` / `pending_approval` / `approved` / `picking` / `ready` / `fulfilled` / `partial` / `cancelled`. `staff_tasks.status` is `pending` / `claimed` / `in_progress` / `done` / `rejected`. Users see raw values.

### What we ship

A pure UI translation layer. Internal columns unchanged. The requester sees one of five labels:

| User-facing label | Tone | Supply maps from | Task maps from |
|---|---|---|---|
| **Submitted** | neutral | `submitted`, `pending_approval` | `pending` |
| **Approved** | info | `approved` | — |
| **In progress** | active | `picking`, `ready` | `claimed`, `in_progress` |
| **Done** | success | `fulfilled`, `partial`, `delivered` | `done`, `completed` |
| **Declined** | warning | `rejected`, `cancelled` | `rejected` |

Notes:
- `partial` is `Done` with a small line in the detail view: `Some items were not available — see notes.` Not its own user-facing status.
- `Approved` only exists for supply orders. Tasks skip it.
- `Declined` is terminal. The detail view shows a reason if one was provided.
- **Issues do not use this helper.** They keep their own three-state labels (`Open` / `In Progress` / `Resolved`) on their own surfaces.

### Files touched

- New: `src/shared/utils/courtAideStatus.ts` — exports `formatStatusForUser(record): { label, tone }` and a TypeScript union of the five labels.
- `src/features/dashboard/components/MyRequestRow.tsx` — consumes the helper.
- `src/features/dashboard/components/MyRequestDetailDrawer.tsx` — consumes the helper.
- `src/features/dashboard/pages/Notifications.tsx` — Court Aide notification copy switches to `Your supply order #… is now: In progress` etc. via the helper. Issue notifications use their own copy as today.
- Toast copy (Piece 2) consumes the helper for the verb (`Submitted` vs `Sent for approval`).

### Edge cases

- A supply order that was approved, then declined later: helper returns `Declined`; "approved" history is visible in detail, not list.
- Unknown internal value (data drift): helper falls back to `Submitted` and logs a warning. Never renders the raw value.

---

## Verification

- Sidebar shows one `Supplies & Requests` item; the page renders two tabs and switches without a full reload.
- Both Court Aide flows (Order, Make a Request) produce the same toast shape after submit and the page does not switch to a full-page success view.
- `/my-requests` loads with at least one row of each Court Aide type for a seeded user and renders the five-label vocabulary correctly.
- Issues do **not** appear in `/my-requests`. They remain at `/my-issues` and `/operations?tab=issues`, with their own three labels.
- Legacy `/my-activity`, `/my-supply-requests`, `/request/supplies`, `/request/help` URLs redirect with their existing query params preserved.
- A `partial` supply fulfillment shows as `Done` in the row and surfaces the partial note in detail.
- Realtime: a second tab submitting on the same account causes the inbox to update within 5 seconds without a hard refresh.

## Rollout

1. **Piece 4 first** — the vocabulary helper has no UI of its own. Wire it into the existing Notifications surface and the helper sits ready for the surfaces that come next. Zero risk.
2. **Piece 3 second** — the `/my-requests` inbox. Builds on the Piece 4 helper. Establishes the URL the Piece 2 toast will link to.
3. **Piece 2 third** — the success-state alignment. Now the `View →` link has a stable destination. Touches three flows; Sonner is already in the app.
4. **Piece 1 last** — the `/supplies` tabbed front door and the sidebar / header rename. Smallest-feeling but most visible change; ship once the rest of the surface is consistent.

## Out of scope

- Anything touching the Issues / Operations surface.
- Email or push notifications for status changes.
- An export-my-requests action.
- "Reorder" affordance for previous supply orders.
- A "draft" state for incomplete requests.
- Sidebar consolidation of `Issues` / `Maintenance` / `Lighting` into one `Operations` nav item.

## Open questions

None at draft time.
