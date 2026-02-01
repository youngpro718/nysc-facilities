
# Supply Request Flow - Court Aide Visibility Fix

## Problem Summary

A supply request was submitted but Court Aides are not seeing it in their dashboard. After investigation, I found multiple issues preventing the supply request from appearing to Court Aides.

## Issues Identified

### 1. Database Column Mismatch (Critical)
The `SupplyFulfillmentPanel` (used on Court Aide Work Center) queries for a column called `urgency` that does not exist in the database. The actual column is `priority`. This causes the query to fail silently, resulting in an empty list and the message "All caught up! No supply requests to fulfill."

**Location**: `src/components/court-aide/SupplyFulfillmentPanel.tsx` line 53-54

### 2. Wrong Status Filter in Alerts
The `AlertsBar` component counts pending supplies using statuses `['approved', 'in_progress']`, but new supply requests have status `submitted`. This means newly submitted requests are not reflected in the alert badge count.

**Location**: `src/components/court-aide/AlertsBar.tsx` line 45

### 3. Invalid Status in Start Fulfillment Mutation
The `SupplyFulfillmentPanel` updates requests to `in_progress` status, but this status is not in the valid status flow. The correct status should be `received` or `picking` based on the workflow.

**Location**: `src/components/court-aide/SupplyFulfillmentPanel.tsx` line 116

### 4. RLS Policy Issue (Potential)
Court Aides need to be in the "Supply Department" to see all supply requests. Some Court Aide users have no department assigned, which may block their access due to the RLS policy.

---

## Solution

### Phase 1: Fix Column Name Mismatch

**File**: `src/components/court-aide/SupplyFulfillmentPanel.tsx`

Change the query from:
```typescript
urgency,
```
To:
```typescript
priority,
```

And update all references from `urgency` to `priority` throughout the component.

### Phase 2: Fix Status Filters

**File**: `src/components/court-aide/AlertsBar.tsx`

Update the pending supplies query from:
```typescript
.in('status', ['approved', 'in_progress']);
```
To:
```typescript
.in('status', ['submitted', 'approved', 'received', 'picking']);
```

**File**: `src/components/court-aide/SupplyFulfillmentPanel.tsx`

Update the start fulfillment mutation from:
```typescript
status: 'in_progress',
```
To:
```typescript
status: 'received',
```

### Phase 3: Add RLS Policy Enhancement

Add an RLS policy to allow users with the `court_aide` role to view supply requests regardless of department assignment. This ensures Court Aides can always see supply requests.

**SQL Migration**:
```sql
-- Allow court_aide role to view all supply requests
DROP POLICY IF EXISTS "court_aides_view_all_requests" ON supply_requests;
CREATE POLICY "court_aides_view_all_requests"
  ON supply_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'court_aide'::user_role
    )
  );
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/court-aide/SupplyFulfillmentPanel.tsx` | Fix `urgency` to `priority`, fix status updates |
| `src/components/court-aide/AlertsBar.tsx` | Fix status filter for pending supplies |
| Database migration | Add RLS policy for court_aide role |

---

## Expected Outcome

After these changes:
1. Court Aides will see newly submitted supply requests in their Work Center dashboard
2. The alerts bar will correctly show the count of pending supply requests
3. Court Aides without department assignments will still be able to view and fulfill supply requests
4. The fulfillment workflow will use correct status values matching the database schema
