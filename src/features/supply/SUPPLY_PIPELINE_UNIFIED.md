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
- `markOrderReady()` - Mark ready + deduct inventory (status: ready)
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
