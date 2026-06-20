# Unified Request Experience — Design

**Date:** 2026-06-19
**Status:** Approved for implementation planning

## Background

The app today has four request flows (Supply Order, Help Request, Setup-a-Room, Report Issue) that share intent but disagree on conventions: each has its own form shell, its own validation feel, its own success state, its own destination after submit, and its own status vocabulary. The result is that a user submitting more than one type of request has to learn four interaction patterns and check three different pages to see what happened.

This spec covers three changes that, together, make the four flows feel like one app without rebuilding any of them. It does **not** cover the longer-term single front door modal (Approach 4 in the parent brainstorm), which is deferred until these three prove the unified pattern.

## Goals

1. **A user who submits one request type recognises the other three** — same submit, same toast, same place to find the result, same vocabulary describing what's happening.
2. **One inbox** — a single page where the user sees every request they have ever submitted, regardless of type.
3. **One status vocabulary** — the requester sees the same four (occasionally five) labels regardless of the internal state machine.

## Non-goals

- A unified intake modal with type-picking step. Deferred.
- Changes to the internal state machines on `supply_requests`, `issues`, `staff_tasks`. The translation is in a UI helper.
- Changes to admin / supply-staff / court-aide surfaces. They keep their existing detailed labels (`picking`, `ready`, `partial`, etc.).
- Renaming or restructuring DB tables. None required.
- Touching the public-form PDF workflow.

---

## Piece 1 — One success state

### What ships today

| Flow | After submit |
|---|---|
| Supply Order | In-place modal success: green check, `Order submitted!`, `Track my orders` + `Place another order` buttons |
| Help Request | Full-page interstitial replaces the form: `Request Submitted!`, `Track in Tasks` + `Submit Another Request` + `Done` |
| Setup-a-Room | Same full-page interstitial as Help, with a quick summary of what was submitted |
| Report Issue | Toast at corner, dialog closes |

### What we ship

Every successful submit produces **the same artefact**: a Sonner toast with this shape:

```
✓ Request #2026-06-19-014 submitted
  View → (links to /my-requests with the row anchored)
```

- Toast auto-dismisses after 6 seconds.
- The modal / dialog / cart sheet closes immediately on success — no celebration screen.
- The page underneath stays where the user was (the catalog, the dashboard, the operations table), so they can keep working.
- The `View →` link routes to `/my-requests?focus={request_id}` which scrolls the row into view and highlights it for ~3 seconds.

### Files touched

- `src/features/supply/components/supply/OrderCart.tsx` — drop the post-submit success branch and the `Place another order` / `Track my orders` buttons; emit the toast and close the modal.
- `src/features/supply/hooks/useOrderCart.ts` — `submittedOrder` state and `resetSubmittedOrder` go away.
- `src/features/supply/pages/request/HelpRequestPage.tsx` (and the setup variant) — replace the full-page success view with `navigate('/my-requests')` + toast.
- `src/features/supply/components/supply/QuickOrderGrid.tsx`, `QuickSupplyRequest.tsx` — drop their consumption of `submittedOrder`.
- `src/features/issues/components/issues/wizard/SimpleReportWizard.tsx`, `src/features/operations/components/maintenance/ReportIssueDialog.tsx`, `src/features/issues/components/issues/admin/AdminQuickReportDialog.tsx` — toast text aligned to the standard format.
- New: `src/shared/utils/requestToast.ts` — one helper, `requestSubmittedToast({ id, type })`, used by all four flows.

### Edge cases

- Supply order needing approval: same toast, different verb. `Request #… sent for approval. View →`. Still routes to `/my-requests` (it shows as `Submitted` until approved — see Piece 3).
- Submit fails after client-side validation passes (e.g. RLS reject): toast turns red, no redirect, user stays on the form.
- The cart sheet closes; the catalog page underneath retains the empty cart state.

---

## Piece 2 — `/my-requests`, the single inbox

### What ships today

`/my-activity` exists with three tabs (`Supplies` / `Reported` / `Requests`). Each tab is a separate query, shown as a separate list. Help / setup tasks land in `/tasks`. Issues land in `/operations?tab=issues`. The user has no single place to answer "what have I asked facilities for, and what state is each in?"

### What we ship

A new route `/my-requests` that renders one chronological list of every request the signed-in user has submitted, regardless of type. The page replaces `/my-activity` (legacy route redirects in).

#### List view

- One row per record, sorted by submitted date descending.
- Row layout: `{type chip} {title} · {room or location} · {short id} — {status pill} · {relative time}`
- Type chip examples: `📦 Supply` · `🛠️ Issue` · `🪑 Setup` · `🚚 Delivery` · `🙋 Help` · `❓ Other`
- For `staff_tasks` rows, the type chip is derived from `staff_tasks.task_type` (`setup` → `🪑 Setup`, `delivery` → `🚚 Delivery`, `help` → `🙋 Help`, otherwise `❓ Other`). Supply and Issue derive trivially from their source table.
- Filter chips at the top: `All` · `Open` · `Done`. Type filter is optional via a secondary row of chips matching the type chips.
- Empty state: short copy + a CTA to the request modal.

#### Detail view

- Tap a row to open a side drawer (desktop) or a full-screen page (mobile) with the type-specific body.
- The detail body **reuses the existing detail components** per type (supply order detail, issue detail, etc.). No new detail UIs in this spec.
- Header is uniform: title, type chip, status pill, submitted-at, deliver-to / location.

#### Data sources

The list pulls from three existing queries and merges them client-side:

- `supply_requests` filtered to `requester_id = auth.uid()`
- `issues` filtered to `reported_by = auth.uid()`
- `staff_tasks` filtered to `created_by = auth.uid()` (this captures Help / Setup / Delivery)

Each query is a typed projection onto a common `MyRequestRow` shape: `{ id, type, title, location_label, status_internal, created_at }`. Merging happens in a `useMyRequests()` hook with React Query — three queries, one combined result. Pagination is "show last 50, plus a 'View older' link" — most users won't have more than 20.

### Files touched

- New: `src/features/dashboard/pages/MyRequests.tsx` — list view.
- New: `src/features/dashboard/hooks/useMyRequests.ts` — merged query.
- New: `src/features/dashboard/components/MyRequestRow.tsx` — uniform row.
- New: `src/features/dashboard/components/MyRequestDetailDrawer.tsx` — uniform header + slot for type-specific body.
- `src/App.tsx` — add `/my-requests` route; redirect `/my-activity` and `/my-supply-requests` and `/my-issues` to it.
- `src/components/layout/Layout.tsx` (or wherever the nav lives) — sidebar item renamed to `My Requests`.
- The legacy `/my-activity` page component is removed once its consumers are migrated.

### Edge cases

- A request the user submitted on someone else's behalf (court liaison / admin): out of scope. `/my-requests` is strictly "things I submitted". Liaisons keep their existing fulfillment surfaces.
- Realtime updates: subscribe via the existing realtime provider to invalidate `useMyRequests` on insert / update of any of the three source tables for `auth.uid()`. Realtime is sub-second when connected; the 5-second target in Verification is the worst-case fallback.
- Deep link with `?focus={id}`: scroll-into-view + 3-second highlight ring; ignored silently if the id is not in the list (e.g. requester is staring at the inbox from a different account).

---

## Piece 3 — One status vocabulary

### What ships today

Each request type has its own internal state machine and renders its own labels to the user. `supply_requests.status` enumerates `submitted` / `pending_approval` / `approved` / `picking` / `ready` / `fulfilled` / `partial`. `issues.status` is `open` / `in_progress` / `resolved`. `staff_tasks.status` is some variant of `pending` / `claimed` / `in_progress` / `done`. The user sees all of these raw.

### What we ship

A pure UI translation layer. The internal columns stay as they are. The requester only ever sees one of four labels (occasionally five):

| User-facing label | Tone | Maps from (supply) | Maps from (issue) | Maps from (task) |
|---|---|---|---|---|
| **Submitted** | neutral | `submitted`, `pending_approval` | `open` | `pending` |
| **Approved** | info | `approved` | — | — |
| **In progress** | active | `picking`, `ready` | `in_progress`, `assigned` | `claimed`, `in_progress` |
| **Done** | success | `fulfilled`, `partial`, `delivered` | `resolved` | `done`, `completed` |
| **Declined** | warning | `rejected`, `cancelled` | `closed_invalid` | `rejected` |

Notes:

- `partial` is `Done` with a small line in the detail view: `Some items were not available — see notes.` It is not its own user-facing status.
- `Approved` only exists for supply orders. Other types skip it.
- `Declined` is terminal. The detail view should show a reason if one was provided.

### Files touched

- New: `src/shared/utils/userFacingStatus.ts` — exports `formatStatusForUser(record): { label, tone }` and a TypeScript union of the five labels.
- `src/features/dashboard/components/MyRequestRow.tsx` — consumes the helper.
- `src/features/dashboard/components/MyRequestDetailDrawer.tsx` — consumes the helper.
- `src/features/dashboard/pages/Notifications.tsx` — notification copy switches to `Your supply order #… is now: In progress` etc. via the helper.
- Toast copy (Piece 1) consumes the helper for the submit verb.

### Edge cases

- An issue moved from `resolved` back to `in_progress`: helper just reflects the current value; we don't track the transition.
- A supply order that was approved, then declined later: helper returns `Declined`; the row's "approved" history is visible in the detail view, not the list.
- Unknown internal value (data drift): helper falls back to `Submitted` and logs a warning. Never renders the raw value.

---

## Verification

- Each of the four submit flows produces the identical toast shape (visual diff before / after).
- `/my-requests` loads with at least one row of every type for a seeded user and renders the four-label vocabulary.
- Legacy `/my-activity`, `/my-supply-requests`, `/my-issues` URLs redirect with their existing query params preserved.
- A `partial` supply fulfillment shows as `Done` in the row and surfaces the partial note in detail.
- Submitting a supply order then closing the modal lands the user on the catalog with an empty cart and a visible toast.
- Realtime: a second tab submitting on the same account causes the inbox to update within 5 seconds without a hard refresh.

## Rollout

1. Ship Piece 3 first — it has no UI surface of its own and no risk; the helper exists and is wired into the existing surfaces. This puts the vocabulary in the user's eyes immediately.
2. Ship Piece 1 second — change the four success states. Sonner is already in the app; no new dependency.
3. Ship Piece 2 last — the inbox depends on the helper and on the toast linking to a stable URL. Delivering it without 1 and 3 leaves dead ends.

## Out of scope

- Email-channel notifications for status changes.
- Mobile push notifications.
- An export-my-requests action.
- Letting the user re-submit a previous request as a new one ("Reorder").
- A "draft" state for incomplete requests.

## Open questions

None at draft time. If implementation reveals a fifth user-facing label is unavoidable, raise it at the planning stage rather than expanding silently here.
