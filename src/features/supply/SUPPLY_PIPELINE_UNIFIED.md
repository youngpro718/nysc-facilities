# Supply Pipeline Unification - Phase 6

## Overview
The supply pipeline has been unified into a single service with consistent status transitions and validation.

## Unified Service Location
`src/features/supply/services/unifiedSupplyService.ts`

## Status Flow
```
submitted → received → picking → ready → completed
    ↓           ↓          ↓        ↓
pending_approval → approved → received → ...
    ↓
rejected

Any status can transition to: cancelled
```

## Key Functions

### Submission & Approval
- `submitSupplyOrder()` - Submit new order (auto-detects approval requirement)
- `approveSupplyRequest()` - Approve pending request (admin/supervisor)
- `rejectSupplyRequest()` - Reject request (admin/supervisor)

### Fulfillment Workflow
- `acceptOrder()` - Accept and assign to staff (status: received)
- `startPicking()` - Begin picking items (status: picking)
- `markOrderReady()` - Mark ready + deduct inventory (status: ready). Thin wrapper over the atomic `fulfill_supply_request(uuid, jsonb, text)` RPC (db/migrations/096_fix_supply_fulfillment.sql) — the RPC does the status-gate check, item updates, inventory deduction, and transaction logging in one SECURITY DEFINER transaction, replacing the old multi-step update-then-deduct flow that could silently no-op under RLS and double-deduct inventory on retry. Currently unused in the UI; the three live fulfillment paths (`PartialFulfillmentDialog`, `ImprovedSupplyStaffDashboard` Quick Ready, `SupplyFulfillmentPanel`) call the RPC directly.
- `completeOrder()` - Staff marks as picked up (status: completed)
- `confirmPickup()` - User confirms pickup (status: completed)
- `staffCompletePickup()` - Staff completes on behalf of user

### Atomic Operations
- `fulfillSupplyRequest()` - Atomic RPC for header + items fulfillment

### Management
- `cancelSupplyRequest()` - Cancel request (requester or admin)
- `archiveSupplyRequest()` - Soft delete (requester only)
- `deleteSupplyRequest()` - Hard delete (admin only)

### Query Functions
- `getSupplyRequests()` - Fetch requests with full hydration
- `getInventoryItems()` - Fetch inventory catalog
- `getFulfillmentLog()` - Fetch fulfillment history

## Catalog Listings vs Room Stock (migration 103)

A product stocked in several storage rooms is ONE catalog listing backed by
several `inventory_items` rows. The listing row has `catalog_item_id = NULL`;
each other room's row points at it via `catalog_item_id` (single-level,
enforced by trigger `trg_inventory_catalog_link`). The `inventory_catalog`
view shows only active listing rows and derives `stock_status` from the whole
group, so people ordering see the product once while stock stays tracked per
room. At fulfillment, each `p_items` element passed to
`fulfill_supply_request(uuid, jsonb, text)` may carry `source_item_id` — the
room row the stock was physically pulled from (validated server-side to be in
the same group; defaults to the ordered row). `PartialFulfillmentDialog`
exposes this as a "Pull from" room picker; admins link/unlink rooms via the
"Catalog listing" field in the inventory item create/edit dialogs.

## Status Validation
All status transitions are validated using `STATUS_TRANSITIONS` from constants.
Invalid transitions throw errors before attempting database updates.

## Migration Status

### ✅ Migrated Components
- `useSupplyRequests` hook
- `useOrderCart` hook
- `useInventoryItems` hook
- `ImprovedSupplyStaffDashboard`
- `SupplyRequestActions`
- `PendingSupplyApprovals`
- `EnhancedSupplyTracker`
- Admin `SupplyRequests` page

### ⚠️ Deprecated Services (DO NOT USE)
- `supplyService.ts` - Use `unifiedSupplyService.ts` instead
- `supplyOrdersService.ts` - Use `unifiedSupplyService.ts` instead
- `supplyRequestService.ts` - Merged into `unifiedSupplyService.ts`

### Legacy Compatibility
The unified service includes deprecated functions for backward compatibility:
- `updateSupplyRequestStatus()` - Use specific workflow functions instead
- `updateSupplyRequestItems()` - Use `markOrderReady()` or `fulfillSupplyRequest()` instead

## Benefits
1. **Single source of truth** for all supply operations
2. **Status validation** prevents invalid transitions
3. **Consistent error handling** across all operations
4. **Clear workflow** with dedicated functions for each stage
5. **Type safety** with proper TypeScript interfaces
6. **Atomic operations** using database RPCs where needed

## Next Steps
1. Remove deprecated service files after verification
2. Add comprehensive tests for status transitions
3. Monitor production for any edge cases
4. Update documentation for supply staff workflows
