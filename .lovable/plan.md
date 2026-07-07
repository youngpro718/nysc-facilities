
## Goal

Send app emails around the supply request lifecycle, with a safety toggle so real-world supply team addresses only start receiving mail once you flip it on. Also confirm My Requests only shows the signed-in user's own requests.

## Emails to send

1. **On submission** → requester gets a **receipt** email (their order summary, items, request ID, status link).
2. **On submission** → supply team distribution list gets a **new request** alert (who, what, when, link to open in app). Gated by a test-mode toggle (see below).
3. **On ready/completed** → requester gets a **fulfilled** email ("your order is ready / has been picked up") sent when the order moves to `ready` or `completed`.

All emails come from your verified Lovable email domain and use branded React Email templates that match the app's look.

## Test-mode toggle for supply team address

New row in `system_settings` (or a small dedicated `supply_email_settings` table) with:

- `supply_team_notifications_enabled` (boolean, default **false**)
- `supply_team_recipients` (text[]) — seeded with `100C-supplyDept@nycourts.gov` and `Jduchate@nycourts.gov`

Admin UI: a small card in **Admin → Settings** (existing admin area) with:
- A toggle: "Send new-request alerts to supply team"
- Editable recipient list (add/remove addresses)
- Helper text: "Off = testing only. Requester emails always send."

While the toggle is off, the "new request" alert is skipped entirely (or optionally routed to a single admin test address you enter). Requester receipt + fulfillment emails always send regardless.

## My Requests visibility check

Audit `useMyRequests` and the `supply_requests` / `staff_tasks` / `key_requests` RLS to confirm the query filters strictly by `auth.uid()` and RLS enforces it server-side. If anything is loose, tighten it. No UI change expected.

## Technical section

**Infrastructure**
- Ensure Lovable email domain is configured (check status; prompt setup if not).
- Run `setup_email_infra` and `scaffold_transactional_email` if not already scaffolded.

**Templates** (`supabase/functions/_shared/transactional-email-templates/`)
- `supply-request-receipt.tsx` — items table, quantities, request code, submitted-at, link.
- `supply-request-fulfilled.tsx` — status (ready vs completed), pickup instructions, link.
- `supply-team-new-request.tsx` — requester name, department, items, priority, link to admin view.

**Triggers**
- In `unifiedSupplyService.submitSupplyOrder`: after successful insert, invoke `send-transactional-email` twice — receipt to requester, and (if toggle on) alert to each supply team recipient using an idempotency key like `supply-new-${requestId}-${recipient}`.
- In `markOrderReady` and `completeOrder` (and the RPC-based fulfillment path `fulfillSupplyRequest`): invoke `send-transactional-email` with the fulfilled template. Idempotency key `supply-fulfilled-${requestId}-${status}`.

**Settings storage**
- Migration: create `supply_email_settings` singleton table with the two fields above, RLS locked to admins for write, readable by service role (edge function reads it).
- Edge function reads settings with service role before sending the team alert.

**Admin UI**
- New component under admin settings page: toggle + recipient chips + save button, wired to the new table via a small service.

**My Requests audit**
- Read `useMyRequests` query and current RLS on `supply_requests` (and related); confirm `user_id = auth.uid()` filter both in query and policy. Fix if gap found.

## Out of scope
- SMS/push notifications.
- Fulfillment-team-side email (only the "new request submitted" alert goes to the team list per your answer).
- Reworking any existing supply status logic.
