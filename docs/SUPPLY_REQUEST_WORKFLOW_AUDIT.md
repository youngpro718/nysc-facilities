# Supply Request Workflow Audit

## Current State Analysis

### User Roles & Permissions (from `useRolePermissions.ts`)

| Role | supply_requests | supply_orders | inventory | Can Order? | Can Fulfill? |
|------|-----------------|---------------|-----------|------------|--------------|
| admin | admin | admin | admin | ✅ | ✅ |
| facilities_manager | write | null | write | ✅ | ❌ |
| cmc | write | null | null | ✅ | ❌ |
| court_aide | admin | admin | admin | ✅ | ✅ |
| purchasing_staff | admin | admin | admin | ✅ | ✅ |
| standard | write | null | null | ✅ | ❌ |

### Current Status Flow
```
submitted → received → processing → ready → picked_up → completed
                                         → cancelled (at any point)
```

### Issues Identified

1. **Approval Workflow Confusion**
   - Current admin page has "approve/reject" workflow
   - This is for BIG TICKET items only, not regular supplies
   - Regular supplies should flow directly: submitted → received → processing → ready

2. **Inventory Deduction Timing**
   - Currently: Inventory deducted when "marking order ready" (in `supplyOrdersService.ts`)
   - This is CORRECT - deduct when items are physically pulled from shelves

3. **Role Confusion**
   - `court_aide` and `purchasing_staff` have same permissions
   - These are the SUPPLY ROOM STAFF who fulfill orders
   - Admin should NOT be fulfilling orders, just viewing/reporting

4. **Missing Features**
   - No notification to user when order is ready
   - No delivery option (mailbox delivery)
   - No "big ticket" flag for items requiring approval

---

## Proposed Workflow

### For ALL Users (Standard Flow - No Approval Needed)
```
User submits request
       ↓
Supply Room receives notification
       ↓
Supply Staff marks as "Received"
       ↓
Supply Staff gathers items (Processing)
       ↓
Supply Staff marks as "Ready" → Inventory DEDUCTED here
       ↓
User notified "Ready for Pickup" OR "Delivered to Mailbox"
       ↓
User picks up OR Supply Staff delivers
       ↓
Completed
```

### For Big Ticket Items (Approval Required)
```
User submits request (item flagged as "requires_approval")
       ↓
Admin/Manager notified for approval
       ↓
Admin approves OR rejects with reason
       ↓
If approved → Same flow as above
If rejected → User notified, request closed
```

---

## Required Changes

### 1. Database Changes
- [ ] Add `requires_approval` boolean to `inventory_items` table
- [ ] Add `approval_threshold` decimal to `inventory_items` (auto-require approval above $X)
- [ ] Add `delivery_method` enum to `supply_requests` ('pickup', 'mailbox', 'delivery')
- [ ] Add `delivery_location` text to `supply_requests`

### 2. Permission Changes
- [ ] Admin: View all, approve big ticket, view reports (NO fulfillment)
- [ ] Supply Staff (court_aide, purchasing_staff): Receive, process, fulfill, deliver
- [ ] All Users: Submit requests, track status, receive notifications

### 3. UI Changes

#### Supply Request Form (All Users)
- [ ] Show current stock levels
- [ ] Flag items that require approval
- [ ] Add delivery preference (pickup vs mailbox)
- [ ] Add delivery location if mailbox selected

#### Supply Room Dashboard (Supply Staff Only)
- [ ] Queue of new orders to receive
- [ ] Processing queue with pick list
- [ ] Ready queue with pickup/delivery status
- [ ] Quick actions: Receive → Process → Ready → Complete

#### Admin View (Admin/Manager Only)
- [ ] Pending approvals for big ticket items
- [ ] Supply request history and reports
- [ ] Inventory levels and trends
- [ ] NO fulfillment actions

### 4. Notification Changes
- [ ] Notify supply staff when new request submitted
- [ ] Notify user when request received
- [ ] Notify user when ready for pickup
- [ ] Notify user if delivered to mailbox

---

## Implementation Priority

### Phase 1: Simplify Current Flow (Immediate)
1. Remove approval requirement for standard items
2. Ensure inventory deduction happens at "Ready" status
3. Add user notifications for status changes

### Phase 2: Supply Staff Dashboard (This Week)
1. Create dedicated supply staff workflow
2. Add pick list generation
3. Add delivery tracking

### Phase 3: Big Ticket Approval (Next Week)
1. Add requires_approval flag to items
2. Create admin approval queue
3. Add approval notifications

### Phase 4: Delivery Options (Future)
1. Add mailbox delivery option
2. Add delivery tracking
3. Add delivery confirmation

---

## Files to Modify

### Core Services
- `src/services/supplyOrdersService.ts` - Update status flow
- `src/lib/supabase.ts` - Update supply request functions

### Pages
- `src/pages/SupplyRoom.tsx` - Supply staff dashboard
- `src/pages/admin/SupplyRequests.tsx` - Admin view (approvals only)
- `src/pages/forms/SupplyRequestFormPage.tsx` - User form

### Components
- `src/components/supply/ImprovedSupplyStaffDashboard.tsx` - Staff workflow
- `src/components/supply/SimpleFulfillmentDialog.tsx` - Fulfillment actions
- `src/components/user/EnhancedSupplyTracker.tsx` - User tracking

### Hooks
- `src/hooks/useRolePermissions.ts` - Permission updates
- `src/hooks/useSupplyRequests.ts` - Query updates
