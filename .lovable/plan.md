
# Supply Request Flow Complete Fix Plan

## Problem Summary

When submitting a supply request, nothing happens because the database is rejecting the insert due to **Row Level Security (RLS) policy violations**. Additionally, the inventory deduction and history tracking mechanisms have schema mismatches.

---

## Issue Breakdown

### Issue 1: Supply Request Insert Fails (CRITICAL)

**Location**: `src/services/supplyOrdersService.ts`, line 45-56

**Problem**: The insert payload is missing `requester_id`, but the RLS policy requires `auth.uid() = requester_id`

**RLS Policy**:
```sql
-- Policy: "Users can create supply requests"
WITH CHECK (auth.uid() = requester_id)
```

**Current Code** (missing `requester_id`):
```typescript
const insertData: any = {
  title: payload.title,
  description: payload.description || '',
  justification: ...,
  priority: payload.priority,
  // Missing: requester_id: session.user.id
};
```

**Fix**: Add `requester_id: session.user.id` to the insert payload

---

### Issue 2: Status History Table Doesn't Exist

**Location**: `src/services/supplyOrdersService.ts`, lines 80-88

**Problem**: The service inserts into `supply_request_status_history` which doesn't exist. The actual table is `supply_request_fulfillment_log`.

**Fix**: Either:
- Option A: Create the missing `supply_request_status_history` table
- Option B: Update the service to use `supply_request_fulfillment_log`

**Recommendation**: Create the status history table for proper audit tracking

---

### Issue 3: Inventory Transaction Schema Mismatch

**Location**: Database function `adjust_inventory_quantity`

**Problem**: The function tries to insert columns that don't exist in `inventory_item_transactions`:

| Function Inserts | Actual Column |
|-----------------|---------------|
| `quantity_change` | `quantity` |
| `reference_id` | (doesn't exist) |
| `created_by` | `performed_by` |

**Fix**: Update the function to match the actual schema

---

### Issue 4: Court Aides Can't View Completed Tasks

**Location**: `src/components/court-aide/TaskWorkQueue.tsx`

**Problem**: Only fetches active tasks (`claimed`, `in_progress`). No tab for viewing completed work history.

**Fix**: Add a "Completed" or "History" tab to show the Court Aide's past work

---

## Implementation Plan

### Phase 1: Fix Supply Request Submission (CRITICAL)

**File**: `src/services/supplyOrdersService.ts`

1. Add `requester_id` to the insert payload:
```typescript
const insertData: any = {
  requester_id: session.user.id,  // ADD THIS
  title: payload.title,
  description: payload.description || '',
  ...
};
```

2. Remove the status history insert (since table doesn't exist) or make it optional with error handling

3. Add better error handling so users see meaningful error messages

---

### Phase 2: Create Status History Table

**Database Migration**:

```sql
CREATE TABLE IF NOT EXISTS supply_request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES supply_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE supply_request_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of their own requests
CREATE POLICY "Users can view own request history"
ON supply_request_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM supply_requests sr 
    WHERE sr.id = request_id AND sr.requester_id = auth.uid()
  )
);

-- Authenticated users can insert history
CREATE POLICY "Auth users can insert history"
ON supply_request_status_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

---

### Phase 3: Fix Inventory Adjustment Function

**Database Migration**:

```sql
CREATE OR REPLACE FUNCTION adjust_inventory_quantity(
  p_item_id UUID,
  p_quantity_change INTEGER,
  p_transaction_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  -- Get current quantity
  SELECT quantity INTO v_prev_qty 
  FROM inventory_items 
  WHERE id = p_item_id;

  v_new_qty := v_prev_qty + p_quantity_change;

  -- Update inventory
  UPDATE inventory_items
  SET quantity = v_new_qty, updated_at = NOW()
  WHERE id = p_item_id;

  -- Record transaction with correct column names
  INSERT INTO inventory_item_transactions (
    item_id,
    transaction_type,
    quantity,
    previous_quantity,
    new_quantity,
    performed_by,
    notes
  ) VALUES (
    p_item_id,
    p_transaction_type,
    ABS(p_quantity_change),
    v_prev_qty,
    v_new_qty,
    auth.uid(),
    COALESCE(p_notes, 'Inventory adjustment')
  );
END;
$$;
```

---

### Phase 4: Add Court Aide History View

**File**: `src/components/court-aide/TaskWorkQueue.tsx`

Add a third tab "Completed" that fetches tasks with status `completed` claimed by the current user:

```typescript
// Add new hook call
const { tasks: completedTasks, isLoading: completedLoading } = useStaffTasks({
  onlyMyTasks: true,
  status: 'completed',
});

// Add third tab
<TabsTrigger value="completed" className="flex items-center gap-2">
  <CheckCircle className="h-4 w-4" />
  Completed
  {completedTasks.length > 0 && (
    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
      {completedTasks.length}
    </Badge>
  )}
</TabsTrigger>
```

---

### Phase 5: Improve Error Handling

**File**: `src/hooks/useOrderCart.ts`

Ensure errors from the service are properly caught and displayed:

```typescript
catch (error: any) {
  const message = error?.message || 'Failed to submit order';
  toast({
    title: 'Submission Failed',
    description: message.includes('row-level security') 
      ? 'Permission error. Please try logging in again.'
      : message,
    variant: 'destructive',
  });
  throw error;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supplyOrdersService.ts` | Add `requester_id`, fix history insert, improve error handling |
| Database | Create `supply_request_status_history` table |
| Database | Fix `adjust_inventory_quantity` function |
| `src/components/court-aide/TaskWorkQueue.tsx` | Add "Completed" tab for history |
| `src/hooks/useOrderCart.ts` | Improve error messaging |

---

## Expected Outcome

After implementation:
1. Supply requests will submit successfully
2. Users will see proper error messages if something fails
3. Status changes will be tracked in history
4. Inventory will be deducted correctly when orders are fulfilled
5. Court Aides can view their completed work history
