## Why the order isn't visible

Rashida Taylor (`rtaylor@nycourts.gov`) submitted a supply order today at **11:38 AM ET** (`d3c5b499…`, status `pending_approval`, justification flagged "[APPROVAL REQUIRED]").

The Supply Staff Dashboard (`ImprovedSupplyStaffDashboard.tsx`) intentionally hides `pending_approval` rows — its "New" tab only shows `submitted | approved | received | picking`. So purchasing/court_aide staff never see it, and it just sits there until someone visits a separate approvals view.

The admin Supply Requests page already lists it under "All Status" / "Pending Approval", but it's not eye-catching, and there's no count/badge prompting action.

## What to change

### 1. Approve Rashida's stuck order (data fix)
Update `supply_requests.d3c5b499-96fa-49fa-ad04-85d85dae7ad9`:
- `status` → `approved`
- `approved_at` → `now()`
- `approved_by` → an admin profile id (Jack Duchatelier `272dfe36-…`)
- Insert a row into `supply_request_status_history` recording the approval.

This moves it into the standard fulfillment queue immediately.

### 2. Make `pending_approval` orders impossible to miss

**Staff dashboard (`ImprovedSupplyStaffDashboard.tsx`)**
- Add a new first tab "Needs Approval" that fetches orders with `status = 'pending_approval'`.
- Tab label shows the count as an amber badge (matches existing status color in `statusConfig`).
- When the tab is empty, hide the tab entirely so it only appears when there's work to do.
- For admin/purchasing roles, the tab includes inline **Approve** / **Reject** buttons that call the existing `approveSupplyRequest()` / `rejectSupplyRequest()` from `unifiedSupplyService`.
- For other roles (e.g. court_aide who can't approve), the tab is read-only and shows "Awaiting admin approval".

**Admin Supply Requests page (`SupplyRequests.tsx`)**
- Pin a small amber alert banner at the top of the list when at least one request is `pending_approval`: "N supply requests are waiting for approval" with a quick filter button that sets `filterStatus = 'pending_approval'`.

No schema changes, no RLS changes — `pending_approval` already has working policies and the approve/reject RPCs already exist.

### Technical details

- Files to edit:
  - `src/features/supply/components/supply/ImprovedSupplyStaffDashboard.tsx` — add tab, query, badge count, status filter branch (line ~246 filter switch + line ~374 tabs block).
  - `src/features/admin/pages/admin/SupplyRequests.tsx` — add banner above filters (~line 158).
- Data fix issued via the insert tool (UPDATE + INSERT into history).
- Reuse `approveSupplyRequest` / `rejectSupplyRequest` from `@features/supply/services/unifiedSupplyService` — no new service code.
- Invalidate `['supply-staff-orders']`, `['supply-orders']`, `['supply-requests']` after approve/reject (existing pattern).

### Out of scope
- Changing what triggers `pending_approval` in the first place (the `[APPROVAL REQUIRED]` rule) — leaving the approval gate as-is.
- Email/push notifications when orders need approval — can be a follow-up.
