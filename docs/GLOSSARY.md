# Glossary

Canonical vocabulary for the NYSC Facilities Hub. When writing UI copy, toast
messages, emails, or docs, use these words. When reviewing a PR, flag deviations.

The goal is that every term maps to exactly one concept, and every concept has
exactly one word. Where two words exist for the same thing, one wins.

---

## Spaces

### Room

A manageable area in a courthouse — offices, courtrooms, hallways, storage
closets. The canonical user-facing word and the DB table name.

- **Use:** "Rooms", "All Rooms", "Create Room", "Room 305"
- **Do not use:** "Space" or "Spaces" as a user-facing term. The sidebar,
  page titles, and toasts all say "Rooms".

> DB note: `rooms` is the authoritative table. Historical code may reference a
> `unified_spaces` view — that's internal only; no user ever sees the word
> "space" in the UI.

---

## Work & problem tracking

Three distinct concepts, three distinct words. Do not mix them.

### Issue

An internal facility problem reported by a user in the app — a broken light,
a leaky ceiling, a stuck door. Tracked in the `issues` table; lives in the
"Issues" module.

- **Use:** "Report an Issue", "My Issues", "Issue #1204", "Issue status"
- **Do not use:** "Maintenance Request", "Work Order", "Problem Report",
  "Ticket" (when referring to something originating inside the app).

### Ticket

An **external** tracking number attached to an Issue once it's been handed
off to a vendor, DCAS, or another outside party. Stored on
`issues.external_ticket_id`. Shown as a field on an Issue, never as its own
top-level concept.

- **Use:** "External ticket number: DCAS-12345", "Add ticket number"
- **Do not use:** "Ticket" to mean an in-app item. In-app items are Issues.

### Request

Reserved **only** for supply requests (see below). Do not use "Request" for
maintenance, issues, access, keys, or anything else. If you're tempted to say
"maintenance request", say "Issue". If you're tempted to say "access request",
say "Access…" with a more specific verb (e.g., "Request Key", "Issue
Elevator Pass").

---

## Supply workflow

### Supply Request

An item or items a user asks for from the supply closet. One word end-to-end,
regardless of lifecycle stage.

- **Use:** "Supply Request", "My Supply Requests", "Incoming Supply Requests",
  "Submit a Supply Request"
- **Do not use:** "Order", "Supply Order", "Fulfillment" as a noun that
  describes the thing being worked on. The thing is always a Supply Request;
  only the verbs change.

### Lifecycle verbs

A Supply Request moves through these states. Use these exact verbs in UI
buttons and status labels.

| Stage        | UI verb / label | Meaning                                           |
| ------------ | --------------- | ------------------------------------------------- |
| submitted    | Submitted       | User has filed the request; awaiting approval     |
| approved     | Approved        | Admin/aide has approved it; awaiting fulfillment  |
| rejected     | Rejected        | Admin/aide denied it; terminal                    |
| fulfilled    | Fulfilled       | Court Aide has delivered the items; terminal      |

- **Action buttons:** "Approve", "Reject", "Fulfill", "Mark Fulfilled"
- **Do not mix:** "Complete" (use "Fulfill"), "Process" (too vague),
  "Deliver" (say "Fulfill" — delivery is the how, not the state change).

---

## Quick reference — don't / do

| Don't say                  | Do say                          |
| -------------------------- | ------------------------------- |
| Space, Spaces              | Room, Rooms                     |
| Maintenance Request        | Issue                           |
| Work Order                 | Issue                           |
| Problem Report             | Issue                           |
| Ticket (internal)          | Issue                           |
| Supply Order               | Supply Request                  |
| Fulfillment (as a noun)    | Supply Request                  |
| Complete (for supplies)    | Fulfill                         |
| Process (for supplies)     | Fulfill / Approve (be specific) |
