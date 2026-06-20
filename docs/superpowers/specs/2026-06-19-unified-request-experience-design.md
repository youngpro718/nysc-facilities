# Court Aide Request Experience — Design

**Date:** 2026-06-19
**Status:** Approved for implementation planning
**Replaces an earlier draft of this spec dated the same day. Scope was narrowed twice — first from "all requests" to "Court Aide requests only" after the team-boundary discussion, then a second time after the user clarified the real-world use of "Make a Request" (institutional memory for a phone call, not a structured intake form). The four sub-forms collapse into one three-field form.**

## Background

Two different teams fulfill what the app today calls "requests":

| Team | What they fulfill | Where the work goes |
|---|---|---|
| **Court Aides** | Supply orders + furniture / move / delivery / setup tasks | `supply_requests`, `staff_tasks` → Work Center |
| **Facilities (DCAS / maintenance)** | Building issues — broken doors, electrical, HVAC, plumbing, lighting, pest, structural, cleaning | `issues` → Operations |

The app's surface today mostly ignores this boundary. A user has four entry points (`Order Supplies`, `Make a Request`, `Set up a Room`, `Report Issue`) that **look** like four members of one family but actually split across two completely different fulfillment teams.

The Court Aide request side carries an even bigger problem: it has four nearly-identical sub-forms (`Set up a Room` / `Bring me something` / `Move something` / `Something else`) where three of the four are just a textbox. The reason this surface exists at all is **institutional memory** — a courthouse runs on phone calls ("can you bring up a new lateral when court is down?") and those phone calls get forgotten. The form is a written version of the phone call. It needs to be as fast as picking up the phone, not slower.

This spec covers four changes to align the Court Aide request side with how the Work Center already groups the work and to make the "Make a Request" form as fast as the phone call it replaces. **It does not touch Issues.**

## Goals

1. **One Court Aide surface.** `/supplies` becomes the front door to both supply orders and court-aide tasks. Two tabs in one page: `Order Supplies` (today's catalog) and `Make a Request` (one simple form).
2. **One simple request form** — three fields: Where, What, When. No type picker, no counters, no multi-step wizard. The court aide reads the description and figures out the work.
3. **One Court Aide inbox.** `/my-requests` shows every supply order and court-aide task the user submitted, in one list. Issues stay where they are.
4. **One Court Aide status vocabulary.** Supplies and requests share user-facing labels; issues keep their own.

## Non-goals

- **Issues are explicitly out of scope.** No merging issues into the Court Aide inbox. No remapping issue statuses. No new entry points that conflate the two teams. The Report Issue button stays where it is and behaves as it does today.
- Changes to the internal state machines on `supply_requests` or `staff_tasks`. Translation is a UI helper.
- Changes to Work Center, Supply Room, or any staff-facing fulfillment surface.
- Renaming or restructuring DB tables. None required.
- Touching the public-form PDF workflow.
- Sidebar consolidation of `Issues` / `Maintenance` / `Lighting`. Separate small spec.

---

## Piece 1 — `/supplies` becomes the Court Aide front door

### What ships today

- `/request/supplies` shows only the catalog.
- `/request/help` shows a four-button type picker (`Set up a Room` / `Bring me something` / `Move something` / `Something else`).
- Each button opens its own form, three of which are a single textarea and the fourth is a counters-based wizard.
- Each is a separate page with its own header chrome and its own success state.

### What we ship

- The route `/supplies` replaces `/request/supplies` as the canonical entry. Legacy `/request/supplies` redirects in.
- The page has two tabs at the top: `Order Supplies` and `Make a Request`.
- `Order Supplies` tab renders today's catalog flow, unchanged.
- `Make a Request` tab renders one new form (see Piece 2).
- Sidebar nav item renamed to **`Supplies & Requests`**, a single nav slot for the Court Aide surface.
- Header buttons (today: `Order Supplies` + `Make a Request`) collapse to a single dropdown trigger labeled **`+ Court Aide`** with two items that route to `/supplies?tab=order` and `/supplies?tab=request`. The existing two buttons can stay as a transitional skin if the dropdown reads awkward — pick at implementation.

### Files touched

- New: `src/features/supply/pages/CourtAideRequests.tsx` — the tabbed page.
- New: `src/features/supply/components/request/RequestForm.tsx` — the one form on the Request tab.
- `src/App.tsx` — register `/supplies`; redirect `/request/supplies` and `/request/help` to it with the right `?tab` preserved.
- `src/components/layout/Layout.tsx` (or the sidebar component) — rename the nav item.
- The header CTA component — collapse to the dropdown.

### Files deleted (replaced by `RequestForm`)

- `src/features/supply/pages/request/HelpRequestPage.tsx` — replaced by the Request tab.
- `src/features/supply/components/request/SetupRequestForm.tsx` — replaced (the structured counters go away).
- Any helper component that exists only to drive the four-button picker page.

### Edge cases

- A deep link to `/request/help?type=setup` redirects to `/supplies?tab=request` and lands on the same form (the `?type` no longer means anything because there's only one form).
- The FAB on mobile keeps its existing 4 actions and routes to the same destinations: `Order Supplies` lands on the supplies tab; the other three all land on the Request tab (they no longer fork into different forms).
- Issues' `Report Issue` button does **not** appear on `/supplies`. Different team.

---

## Piece 2 — One Request form: Where / What / When

### What ships today

Four buttons, four sub-forms:

| Type | What you fill in |
|---|---|
| Set up a room | Tables count, chairs count, desks count, "something else?" textbox, room, day, time, arrangement notes |
| Bring me something | One textbox |
| Move something | One textbox |
| Something else | One textbox |

Three of four are the same form (a textbox). Setup's counters are training wheels — court aides reading "set up 1602 for 50 people, U-shape, by 9am" know how many tables and chairs to bring.

After submit: full-page interstitial replaces the form with three buttons (`Track in Tasks` / `Submit Another Request` / `Done`).

### What we ship

One form on the Request tab. Three fields:

```
─────────────────────────────────────────────────────
 Where *      [ Room 1602 (search…)              ▾ ]

 What *       [                                     ]
              [   describe what you need            ]
              [                                     ]

 When can it happen? (optional)
              ( ) Anytime
              ( ) When court is down
              ( ) By a specific time   [date/time ▾]

─────────────────────────────────────────────────────
                                       [ Submit ]
```

- **Where** — required room picker. Same `<RoomPicker>` used by the supply cart's `Deliver to`.
- **What** — required textarea. Placeholder: `e.g., Lateral file cabinet on the east wall is busted — replace with another lateral.` Minimum length: 10 characters (server-side check).
- **When can it happen?** — optional. Three radio options:
  - `Anytime` (default).
  - `When court is down` — no date picker; signals timing flexibility.
  - `By a specific time` — toggles a date + time picker inline.
- **Submit** — disabled until Where and What are valid. On click, the form posts to `staff_tasks` with:
  - `created_by = auth.uid()`
  - `room_id = where.id`
  - `description = what`
  - `task_type = 'request'` (one type for all of them — no more setup/move/delivery split)
  - `timing_preference = 'anytime' | 'when_court_is_down' | 'specific_time'`
  - `requested_for_at = ISO timestamp when specific_time, otherwise NULL`
- Success: Piece 3 toast.

### Why no type picker

Three of the four old types were the same form. A "chambers rearrange" is "set up" AND "move." A "bring this file to Family Court" is "delivery" but the description carries it. Forcing the user to choose adds a click without telling the court aide anything useful. The description does the work.

The court aide's queue still groups by recency / status / room, just without the synthetic type label. Internal categorisation, if anyone needs it, can be derived from keywords later — not asked of the user.

### Files touched

- New: `src/features/supply/components/request/RequestForm.tsx` — the form.
- New: a small migration adding two columns to `staff_tasks`:
  - `timing_preference text check (timing_preference in ('anytime','when_court_is_down','specific_time'))`
  - `requested_for_at timestamptz`
- The existing `task_type` column stays but for new rows we always write `'request'`. Historical rows keep their values; the inbox row maps both to `🙋 Request`.

### Edge cases

- Submitting with `By a specific time` selected but no date picked: the radio acts like `Anytime` if the date stays empty — or the form blocks submit. Pick the latter for clarity (matches the `Where` pattern: required-when-picked).
- An inter-court delivery: `Where` is the destination room (e.g., Family Court 60 Centre Room 401). The origin is in the description.
- A submission with no `When` selected at all: defaults to `Anytime`.

---

## Piece 3 — One success state (Court Aide only)

### What ships today

| Flow | After submit |
|---|---|
| Supply Order | In-place success view inside the cart modal: `Order submitted!`, `Track my orders` + `Place another order` buttons |
| Help Request | Full-page interstitial replaces the form: `Request Submitted!`, `Track in Tasks` + `Submit Another Request` + `Done` |
| Setup-a-Room | Same interstitial, with a summary of what was submitted |
| Report Issue | Toast at corner, dialog closes |

### What we ship

Supply Order and the new Request form emit **the same toast** and leave the page in place:

```
✓ Request #2026-06-19-014 submitted
  View → (links to /my-requests with the row anchored)
```

- Toast auto-dismisses after 6 seconds.
- The cart modal closes immediately on success. The page underneath stays on the catalog with an empty cart.
- The Request form clears its fields and stays on `/supplies?tab=request`. No interstitial, no `Submit Another` button — submitting another is just typing in the empty form.
- The `View →` link routes to `/my-requests?focus={id}` and highlights the row for ~3 seconds.

**Report Issue is unchanged.** Different team.

### Files touched

- New: `src/shared/utils/requestToast.ts` — one helper, `requestSubmittedToast({ id, type })`, used by the supply cart and the Request form.
- `src/features/supply/components/supply/OrderCart.tsx` — drop the post-submit success branch; emit the toast and close the modal.
- `src/features/supply/hooks/useOrderCart.ts` — `submittedOrder` state and `resetSubmittedOrder` go away.
- `src/features/supply/components/request/RequestForm.tsx` — calls the toast helper on success, clears its fields.
- `src/features/supply/components/supply/QuickOrderGrid.tsx`, `QuickSupplyRequest.tsx` — drop their consumption of `submittedOrder`.

### Edge cases

- Supply order needing approval: label changes to `Request #… sent for approval. View →`.
- Submit fails after client-side validation passes (e.g. RLS reject): toast turns red, no redirect, user stays on the form with their input intact.

---

## Piece 4 — `/my-requests`, the Court Aide inbox

### What ships today

`/my-activity` shows three tabs (`Supplies` / `Reported` / `Requests`). `Reported` is issues. The page mixes two teams' work into one tabbed view, which the team boundary makes confusing.

### What we ship

A new route `/my-requests` that renders one chronological list of **only** Court Aide work: supply orders + court-aide tasks the user submitted.

Issues stay where they are:
- `/my-issues` continues to exist and renders only the user's reported issues.
- The dashboard can surface a small `Recent issues you reported` card with a `See all` link; not required by this spec.

`/my-activity` redirects to `/my-requests`. The `Reported` tab is no longer accessible through the unified inbox — users find their issues at `/my-issues`.

#### List view

- One row per record, sorted by submitted date descending.
- Row layout: `{type chip} {title} · {room or location} · {short id} — {status pill} · {relative time}`
- Type chips: `📦 Supply` for supply orders, `🙋 Request` for court-aide tasks. (No further sub-categorisation now that the form collapses the four types.)
- Filter chips at the top: `All` · `Open` · `Done`. Optional secondary row filters by type chip.
- For requests, the row title is the first ~60 characters of the description, truncated with ellipsis. If `When` was a specific time, that appears as a small line under the row (`Wanted by Thu Jun 25, 9:00 AM`); `When court is down` shows as a small label; `Anytime` shows nothing.

#### Detail view

- Tap a row to open a side drawer (desktop) or full-screen page (mobile) with the type-specific body.
- The detail body reuses existing per-type detail components for supply; requests get a simple body that renders `Where`, `What`, `When`, submitted-at, status timeline.
- Header is uniform: title, type chip, status pill, submitted-at, where / location.

#### Data sources

- `supply_requests` filtered to `requester_id = auth.uid()`
- `staff_tasks` filtered to `created_by = auth.uid()`

Each projects onto a common `MyRequestRow` shape. Merging happens in a `useMyRequests()` hook with React Query. Pagination: show the most recent 50, plus a `View older` link.

### Files touched

- New: `src/features/dashboard/pages/MyRequests.tsx` — list view.
- New: `src/features/dashboard/hooks/useMyRequests.ts` — merged query.
- New: `src/features/dashboard/components/MyRequestRow.tsx` — uniform row.
- New: `src/features/dashboard/components/MyRequestDetailDrawer.tsx` — uniform header + slot for type-specific body.
- New: `src/features/dashboard/components/RequestDetailBody.tsx` — body for `🙋 Request` rows (where / what / when / timeline).
- `src/App.tsx` — register `/my-requests`; redirect `/my-activity`, `/my-supply-requests`. `/my-issues` stays.
- The sidebar component — `My Activity` renamed `My Requests`.
- Legacy `MyActivity` page component is removed once consumers are migrated.

### Edge cases

- Requests submitted on someone else's behalf: out of scope.
- Realtime updates: subscribe via the existing realtime provider to invalidate `useMyRequests` on insert / update of `supply_requests` and `staff_tasks` for `auth.uid()`. Realtime is sub-second when connected; the 5-second target in Verification is the worst-case fallback.
- Deep link with `?focus={id}`: scroll into view + 3-second highlight ring; ignored silently if id is not in the list.

---

## Piece 5 — One status vocabulary (Court Aide only)

### What ships today

`supply_requests.status` enumerates `submitted` / `pending_approval` / `approved` / `picking` / `ready` / `fulfilled` / `partial` / `cancelled`. `staff_tasks.status` is `pending` / `claimed` / `in_progress` / `done` / `rejected`. Users see raw values.

### What we ship

A pure UI translation layer. Internal columns unchanged. The requester sees one of these labels:

**Supply order labels** (five):

| User-facing label | Tone | Supply maps from |
|---|---|---|
| **Submitted** | neutral | `submitted`, `pending_approval` |
| **Approved** | info | `approved` |
| **In progress** | active | `picking`, `ready` |
| **Done** | success | `fulfilled`, `partial`, `delivered` |
| **Declined** | warning | `rejected`, `cancelled` |

**Request labels** (four — no `Approved` because requests don't need approval):

| User-facing label | Tone | Task maps from |
|---|---|---|
| **Submitted** | neutral | `pending` |
| **In progress** | active | `claimed`, `in_progress` |
| **Done** | success | `done`, `completed` |
| **Declined** | warning | `rejected` |

Notes:
- `partial` is `Done` with a small line in the detail view: `Some items were not available — see notes.` Not its own user-facing status.
- `Declined` is terminal; detail view shows a reason if provided.
- **Issues do not use this helper.** They keep their own three-state labels (`Open` / `In Progress` / `Resolved`).

### Files touched

- New: `src/shared/utils/courtAideStatus.ts` — exports `formatStatusForUser(record): { label, tone }`.
- `src/features/dashboard/components/MyRequestRow.tsx` — consumes the helper.
- `src/features/dashboard/components/MyRequestDetailDrawer.tsx` — consumes the helper.
- `src/features/dashboard/pages/Notifications.tsx` — Court Aide notification copy switches via the helper. Issue notifications use their own copy as today.
- Toast copy (Piece 3) consumes the helper for the verb (`Submitted` vs `Sent for approval`).

### Edge cases

- Unknown internal value (data drift): helper falls back to `Submitted` and logs a warning. Never renders the raw value.

---

## Verification

- Sidebar shows one `Supplies & Requests` item; the page renders two tabs and switches without a full reload.
- `Make a Request` tab renders a single form with three fields and no type-picker page in front of it.
- Submitting a request with all three timing options round-trips correctly (the row in `/my-requests` shows the right `When` line).
- Both Court Aide flows (Order, Request) produce the same toast shape after submit; no flow shows a full-page success view.
- `/my-requests` loads with at least one supply and one request for a seeded user and renders the right status labels for each.
- Issues do **not** appear in `/my-requests`. They remain at `/my-issues` and `/operations?tab=issues`, with their own three labels.
- Legacy `/my-activity`, `/my-supply-requests`, `/request/supplies`, `/request/help` URLs redirect with their existing query params preserved.
- A `partial` supply fulfillment shows as `Done` in the row and surfaces the partial note in detail.
- Realtime: a second tab submitting on the same account causes the inbox to update within 5 seconds without a hard refresh.

## Rollout

1. **Piece 5 first** — the vocabulary helper has no UI of its own. Wire it into the existing Notifications surface and the helper sits ready for the surfaces that come next. Zero risk.
2. **Piece 4 second** — the `/my-requests` inbox. Builds on Piece 5. Establishes the URL the Piece 3 toast will link to.
3. **Piece 3 third** — the success-state alignment. The `View →` link now has a stable destination.
4. **Piece 2 fourth** — the new Request form. Replaces the four-button picker and the three textbox sub-forms with one form. Includes the small `staff_tasks` migration.
5. **Piece 1 last** — the `/supplies` tabbed front door, the sidebar rename, the header CTA collapse. Smallest-feeling but most visible change; ship once the rest of the surface is consistent.

## Out of scope

- Anything touching the Issues / Operations surface.
- Email or push notifications for status changes.
- An export-my-requests action.
- "Reorder" affordance for previous supply orders.
- A "draft" state for incomplete requests.
- Sidebar consolidation of `Issues` / `Maintenance` / `Lighting` into one `Operations` nav item.

## Open questions

None at draft time.
