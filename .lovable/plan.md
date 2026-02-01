
# Supply Request System - Complete Redesign Plan

## Problem Analysis

After a thorough audit of the current implementation, I identified these critical issues:

### Issue 1: Approval Routing is Broken
The code in `supplyOrdersService.ts` correctly checks for `requires_justification` items and sets status to `pending_approval`, but the **database shows all requests are still `submitted`** - not `pending_approval`. This means either:
- Requests with chairs/restricted items aren't being routed correctly
- The justification is being prefixed with `[APPROVAL REQUIRED]` but status isn't changing

Looking at the data: All 3 current requests have `[APPROVAL REQUIRED]` in justification but status is `submitted` - **the routing logic isn't working.**

### Issue 2: Admin Page Shows Wrong Requests
The Admin "Pending Approvals" section at `/admin/supply-requests` filters for `status === 'pending_approval'`, but since requests aren't being routed correctly, nothing shows up there.

### Issue 3: Supply Staff Dashboard Query is Wrong
The Supply Room staff dashboard (`ImprovedSupplyStaffDashboard.tsx`) queries for:
```javascript
.in('status', ['pending', 'approved', 'ready'])
```
But the actual statuses being used are `submitted`, `pending_approval`, `approved`, etc. - **it's missing `submitted` status entirely!**

### Issue 4: Navigation Confusion
- Admin sees `/admin/supply-requests` but there's no clear "Approve" workflow
- Supply Staff should go to `/supply-room` but the page doesn't show submitted orders
- The Supply Room tab in Court Aide navigation exists but leads to a broken experience

---

## Root Cause Summary

| Problem | Root Cause | Impact |
|---------|------------|--------|
| Chair requests not going to approval | Status routing code exists but may not be called correctly | Admin never sees requests needing approval |
| Supply Room shows "No New Orders" | Query filters for wrong statuses | Staff can't see/fulfill any orders |
| Admin can't approve/reject | No requests in `pending_approval` status | Approval workflow is dead |
| Pages hard to find | Navigation exists but leads to broken pages | Users give up |

---

## Solution: Complete Redesign

### Phase 1: Fix the Data Flow (Critical)

**1. Fix Supply Staff Dashboard Query**
Change the status filter from `['pending', 'approved', 'ready']` to `['submitted', 'received', 'picking', 'ready']` - the actual statuses being used.

**2. Fix Admin Page to Show Requests Needing Approval**
Instead of filtering for `pending_approval` status (which doesn't exist), filter for requests where:
- `justification` contains `[APPROVAL REQUIRED]`
- OR status is `pending_approval` (for future-proofing)

**3. Add Inline Approval Actions on Admin Page**
Make approve/reject buttons visible and working for any request that needs approval, regardless of its current status field.

### Phase 2: Clarify Role Separation

**Admin Role (at `/admin/supply-requests`):**
- See ALL requests as an overview
- Approve/Reject big-ticket items (chairs, furniture, etc.)
- View reports and analytics
- Should NOT fulfill orders

**Supply Staff Role (at `/supply-room`):**
- See only orders ready to fulfill (approved or standard items)
- Accept → Pick → Mark Ready → Complete
- Should NOT see approval-pending items

### Phase 3: Simplify the Status Flow

Current confusion comes from too many similar statuses. Simplify to:

```text
User submits
    ↓
┌─ Has restricted items? ─┐
│                         │
Yes                       No
↓                         ↓
NEEDS_APPROVAL      → SUBMITTED
    ↓                     ↓
Admin approves?     Supply Room
    ↓                     ↓
APPROVED ──────────→ RECEIVED
                          ↓
                      PICKING
                          ↓
                      READY
                          ↓
                      COMPLETED
```

### Phase 4: Improve Discoverability

**For Admins:**
- Add "Pending Approvals" badge count to sidebar navigation
- Make the approval workflow prominent on admin dashboard

**For Supply Staff:**
- Add clear "Supply Room" link in Court Aide Work Center
- Show order count badge in navigation
- Add "You have X orders to fulfill" alert

---

## Technical Changes Required

### File 1: `src/components/supply/ImprovedSupplyStaffDashboard.tsx`

**Current (broken):**
```javascript
.in('status', ['pending', 'approved', 'ready'])
```

**Fix:**
```javascript
.in('status', ['submitted', 'approved', 'received', 'picking', 'ready'])
```

### File 2: `src/pages/admin/SupplyRequests.tsx`

**Changes:**
- Instead of filtering only `pending_approval`, also check for `[APPROVAL REQUIRED]` in justification
- Add prominent approve/reject buttons that work correctly
- Separate "Needs Your Approval" vs "All Requests" sections

### File 3: `src/services/supplyOrdersService.ts`

**Verify the approval routing works:**
- The code looks correct, but we need to ensure it's being called
- Add logging to debug if needed

### File 4: Navigation Updates

- Add badge count to Supply Room link showing pending orders
- Add badge count to Supply Requests link showing items needing approval

---

## Summary of Changes

| File | Change Type | Purpose |
|------|-------------|---------|
| `ImprovedSupplyStaffDashboard.tsx` | Fix query | Show submitted orders to staff |
| `SupplyRequests.tsx` (Admin) | Fix filter + UI | Show requests needing approval |
| `supplyOrdersService.ts` | Debug/verify | Ensure routing works |
| `navigation.tsx` | Add badges | Improve discoverability |
| `SimpleOrderCard.tsx` | Add status clarity | Show if order needs approval |

---

## Expected Outcome

After these changes:

1. **Admins** will see a prominent "Pending Approvals" section with requests containing chairs/restricted items, with working Approve/Reject buttons

2. **Supply Staff** will see all submitted orders in their queue and can fulfill them immediately (except those awaiting admin approval)

3. **Users** will be able to track their orders through the complete lifecycle with clear status updates

4. **Navigation** will show badge counts so staff know when they have work to do
