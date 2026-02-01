
# Supply Request System - Complete Audit & Improvement Plan

## Executive Summary

This plan addresses the supply request system issues identified:
1. Approval notes text is unreadable (wrong color on dark mode)
2. Chair approval workflow is unclear/missing
3. Full audit of current flow vs desired flow
4. Optimization for speed (matching issue reporting experience)

---

## Current State Analysis

### What Exists Today

| Component | Location | Purpose |
|-----------|----------|---------|
| Admin Overview | `/admin/supply-requests` | View all requests, approve/reject big ticket items |
| Supply Room | `/supply-room` | Staff dashboard for fulfilling orders |
| Order Page | `/request/supplies` | User-facing quick ordering (QuickSupplyRequest) |
| Inventory Items | Database | `requires_justification` flag exists |

### Current Database Schema

The `supply_requests` table has these approval-related columns:
- `status` (submitted, pending_approval, approved, rejected, received, picking, ready, completed)
- `approved_by`, `approval_notes`, `approved_at`
- `supervisor_id`, `approval_requested_at`

The `inventory_items` table has:
- `requires_justification` boolean (already set true for Chairs, Furniture, etc.)

### Current Flow Gaps

| Issue | Current Behavior | Expected Behavior |
|-------|------------------|-------------------|
| Chair request | Submits with justification text, but no approval queue | Should route to admin for approval before fulfillment |
| Approval visibility | Requests with restricted items just show text prefix | Should change status to `pending_approval` and appear in admin queue |
| Admin page actions | Shows approve/reject buttons for `pending` status only | Should filter/show `pending_approval` requests prominently |
| Approval notes color | `bg-green-50` (light green background) | Text invisible in dark mode - needs dark mode support |

---

## Issue 1: Approval Notes Unreadable (Dark Mode)

### Problem
Line 411 in `src/pages/admin/SupplyRequests.tsx`:
```tsx
<p className="text-sm bg-green-50 p-2 rounded">{request.approval_notes}</p>
```
The `bg-green-50` is a light background with dark text, but in dark mode the text color isn't specified, making it invisible.

### Solution
Change to dark-mode-aware classes:
```tsx
<p className="text-sm bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 p-2 rounded">
  {request.approval_notes}
</p>
```

Same fix for fulfillment notes (`bg-blue-50`).

---

## Issue 2: Chair/Big Ticket Approval Flow

### Current Behavior
When ordering a Chair (which has `requires_justification: true`):
1. User adds Chair to cart
2. Justification textarea appears in OrderSummaryFooter
3. On submit, justification is prefixed with `[APPROVAL REQUIRED]`
4. Status is set to `submitted` (not `pending_approval`)
5. No separate approval queue - goes directly to Supply Room

### Required Changes

**A. Service Layer (supplyOrdersService.ts)**
Change line 55 from:
```ts
status: 'submitted',
```
To:
```ts
status: approvalRequired ? 'pending_approval' : 'submitted',
```

**B. Admin Overview Page (SupplyRequests.tsx)**
Add a dedicated "Pending Approvals" section at the top that:
- Filters requests where `status === 'pending_approval'`
- Shows prominent approve/reject buttons
- On approve: updates status to `approved` (not `received`)
- On reject: updates status to `rejected` with reason

**C. Update Status Transitions**
Current `getAvailableActions` function (line 186-201) needs to handle `pending_approval`:
```ts
case 'pending_approval':
  return ['approve', 'reject'];
```

**D. After Approval**
When admin approves, status changes to `approved`. Supply Room staff then sees it in their queue and can proceed with normal fulfillment (received → picking → ready → completed).

---

## Issue 3: Flow Optimization (Matching Issue Reporting Speed)

### Issue Reporting Flow (2 Steps)
1. Select category + room (auto-selected if assigned)
2. Describe issue + Submit

### Current Supply Ordering Flow (3+ Steps)
1. Search/browse items
2. Add to cart (multiple items possible)
3. Open cart sheet
4. Fill justification (if required)
5. Set delivery location
6. Set priority
7. Submit

### Optimization Strategy

**A. One-Tap Favorites**
Already implemented via `FavoritesStrip` - users can tap once to add favorite items.

**B. Auto-Fill Delivery Location**
Already implemented - pulls from profile metadata.

**C. Skip Cart Review for Simple Orders**
Add a "Quick Submit" mode:
- If no restricted items AND cart has 1-3 items → Direct submit button visible
- Skips opening the full cart sheet

**D. Default Priority**
Already defaults to "medium" - no change needed.

**E. Reduce Justification Friction**
For items that require justification:
- Show inline justification field in the footer (currently hidden in sheet)
- Character counter and clear prompt

### Proposed Quick Flow (2-3 taps)
1. Tap favorite item (auto-adds 1 to cart)
2. Tap "Submit" (if no restricted items, auto-submits with defaults)
3. Done - confirmation toast

---

## Issue 4: Full System Audit

### Identified Gaps

| Gap | Priority | Solution |
|-----|----------|----------|
| No approval queue separation | High | Add `pending_approval` status routing |
| Dark mode color issues | High | Add dark mode variants to all colored backgrounds |
| No approval notifications | Medium | Add notification when request needs approval |
| No user notification on ready | Medium | Already have notification triggers - verify they work |
| Supply Room doesn't see "approved" separately | Medium | Add filter for approved-but-not-received |
| Confusing status names in UI | Low | Rename "pending" to "awaiting action" |

### Recommended Status Flow

```text
Standard Items:
submitted → received → picking → ready → completed

Restricted Items (requires_justification):
submitted → pending_approval → approved → received → picking → ready → completed
                            ↘ rejected (end)
```

### Components to Update

| File | Change |
|------|--------|
| `src/services/supplyOrdersService.ts` | Route restricted items to `pending_approval` |
| `src/pages/admin/SupplyRequests.tsx` | Fix approval notes colors, add pending approvals section |
| `src/components/supply/OrderSummaryFooter.tsx` | Add inline justification, quick submit mode |
| `src/components/supply/SupplyRequestTracking.tsx` | Add "Awaiting Approval" tab for requesters |
| `src/components/supply/ImprovedSupplyStaffDashboard.tsx` | Filter to show only `approved`+ statuses |

---

## Implementation Phases

### Phase 1: Critical Fixes (Immediate) ✅ COMPLETED
1. ✅ Fix approval notes color for dark mode
2. ✅ Update supplyOrdersService to route restricted items to `pending_approval`
3. ✅ Update admin page to show pending approvals prominently
4. ✅ Add approve/reject functionality that works correctly

### Phase 2: Speed Optimization ✅ COMPLETED
1. ✅ Add inline justification to footer (not hidden in sheet)
2. ✅ Add quick submit button for non-restricted orders
3. ✅ Pre-select delivery location from room assignments (not just profile metadata)

### Phase 3: Polish
1. Add user notifications when approval is needed/completed
2. Add status history display for transparency
3. Add "track my order" view for requesters

---

## Technical Details

### Database Changes Required
None - existing columns support this flow:
- `status` already supports `pending_approval`, `approved`, `rejected`
- `approved_by`, `approved_at`, `approval_notes` exist
- `requires_justification` on inventory_items exists

### Files to Modify

**Phase 1:**
- `src/pages/admin/SupplyRequests.tsx` - Dark mode colors + approval queue
- `src/services/supplyOrdersService.ts` - Status routing logic

**Phase 2:**
- `src/components/supply/OrderSummaryFooter.tsx` - Inline justification + quick submit
- `src/components/supply/QuickSupplyRequest.tsx` - Connect quick submit

**Phase 3:**
- `src/components/supply/SupplyRequestTracking.tsx` - User tracking view
- Database triggers for notifications (may already exist)
