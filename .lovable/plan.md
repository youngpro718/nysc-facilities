

## Add On-Demand Receipts for Past Supply Orders

Currently, the Receipt button on completed orders only works if a receipt was pre-generated and stored in the `supply_request_receipts` table. Most orders won't have one, so clicking "Receipt" does nothing. We'll fix this by generating receipt data on-the-fly from the order itself.

### Changes

**1. Update `EnhancedSupplyTracker.tsx`**
- When the user clicks "Receipt" on a completed order, build the `ReceiptData` object directly from the request's data (items, requester info, timeline) using `createReceiptData` from `receiptUtils.ts` instead of requiring a pre-existing DB record.
- Remove the condition that hides the dialog when no DB receipts exist.
- Keep the existing DB-receipt path as a secondary source (if a formal receipt was generated, use that; otherwise, build one on the fly).

**2. Update `createReceiptData` in `src/lib/receiptUtils.ts`**
- Remove `@ts-nocheck` and add proper typing.
- Make the function work with the shape of data available in `EnhancedSupplyTracker` (the request object already has `supply_request_items` with nested `inventory_items`, `created_at`, `fulfilled_at`, etc.).
- Generate a deterministic receipt number from the request ID (e.g., `RCP-{first 8 chars of ID}`) so it's consistent across views.

**3. Show Receipt button on all non-cancelled orders (not just completed)**
- Users should be able to view a confirmation receipt for active orders too, showing what they ordered and current status.

### Files to Edit
- `src/shared/components/user/EnhancedSupplyTracker.tsx` — on-demand receipt generation, remove DB-only gate
- `src/lib/receiptUtils.ts` — fix types, make compatible with tracker data shape

