
# Supply Request Refinement Plan

## Overview

This plan addresses your feedback to clean up old test data, make supply request tracking more accessible, improve fulfillment visibility, and optionally add a quick alert system for stock issues.

---

## Changes Summary

### 1. Clean Up Old Test Requests

**Action**: Delete the 5 old test supply requests from July-August 2025 that are cluttering the system.

| ID (Partial) | Title | Status | Created |
|--------------|-------|--------|---------|
| b87f1061 | furniture request | picking | Jul 17 |
| 65e816f1 | furniture request | rejected | Jul 17 |
| 20ce3263 | furniture request | picking | Jul 18 |
| 7a3db4d6 | Office supply | completed | Jul 19 |
| 00db92a8 | office supplies | picking | Aug 17 |

This will be done via a database delete operation (not a schema migration).

---

### 2. Add Supply Orders Tab to Tasks Page

**File**: `src/pages/Tasks.tsx`

Add a new "Supply Orders" tab that integrates the `SupplyRequestTracking` component directly into the Tasks page, making it the central hub for staff work.

```text
Tab Layout for Managers/Admins:
┌─────────┬─────────┬───────────┬──────────┬────────────────┐
│ Pending │ Active  │ Completed │ Rejected │ Supply Orders  │
└─────────┴─────────┴───────────┴──────────┴────────────────┘
                                                   ▲
                                           NEW TAB
```

**Benefits**:
- One place to see all work: tasks AND supply orders
- Staff can easily switch between task work and supply fulfillment
- Managers see the full picture at a glance

---

### 3. Enhance Fulfillment Visibility

**File**: `src/components/supply/SupplyRequestTracking.tsx`

Add fulfiller information display to show WHO is working on each order:

- Show assigned fulfiller name when order is accepted
- Display progress stage badges (Received → Picking → Ready → Complete)
- Show completion timestamp and fulfiller on completed orders

Current rendering only shows basic status - we will add:
```text
┌──────────────────────────────────────────────────────┐
│ 📦 Order Title                                       │
│ Requester: John Doe • IT Department                  │
│ ───────────────────────────────────────────────────  │
│ 👤 Assigned to: Jane Smith                           │ ← NEW
│ 📊 Progress: 3/5 items picked                        │ ← NEW
│ ⏱ Started: 10 minutes ago                           │ ← NEW
└──────────────────────────────────────────────────────┘
```

---

### 4. Add Admin Delete Capability

**File**: New component `src/components/supply/SupplyRequestActions.tsx`

Add ability for admins to delete old or stuck supply requests:

- Delete button visible only to admin role
- Confirmation dialog to prevent accidents
- Deletes request AND related items (cascade)

This will also require:
- Database: Add RLS DELETE policy for admins

---

### 5. Quick Stock Alert System (Optional but Recommended)

**File**: `src/components/supply/PickingInterface.tsx`

When supply staff are picking and encounter issues, give them quick alert options:

**UI Addition**:
```text
Stock Issue Buttons (per item):
┌────────────────┐ ┌────────────────┐
│ 🚫 Out of Stock│ │ ⚠️ Low Stock   │
└────────────────┘ └────────────────┘
```

**Behavior**:
- Clicking "Out of Stock" sets picked quantity to 0 and flags the item
- Clicking "Low Stock" creates a notification to admin
- Both record the issue in the status history table for audit trail

This keeps staff moving quickly without needing to open separate forms.

---

## Technical Implementation

### Database Changes

1. **Delete old test data** (SQL statement, not migration):
```sql
DELETE FROM supply_requests 
WHERE created_at < '2026-01-01' 
AND requester_id = '4fbaf107-c81b-4442-af1d-cbe965736fe3';
```

2. **Add DELETE policy for admins** (migration):
```sql
CREATE POLICY "Admins can delete supply requests"
ON supply_requests FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::user_role)
);
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Tasks.tsx` | Modify | Add "Supply Orders" tab |
| `src/components/supply/SupplyRequestTracking.tsx` | Modify | Add fulfiller visibility, delete action |
| `src/components/supply/PickingInterface.tsx` | Modify | Add stock alert buttons |
| `src/hooks/useStockAlert.ts` | Create | Hook for triggering stock issue notifications |
| Database | Migrate | Add DELETE policy for supply_requests |
| Database | Execute | Delete old test requests |

---

## User Experience Flow

### For Managers/Admins

1. Navigate to `/tasks`
2. Click "Supply Orders" tab to see all pending supply work
3. View who is assigned to each order and their progress
4. Delete old/stuck orders if needed via action menu

### For Supply Staff

1. Accept order from "New Orders"
2. Start picking - see stock levels inline
3. If stock issue: tap "Out of Stock" or "Low Stock" button
4. System auto-notifies admin and records issue
5. Complete picking and mark ready

---

## Outcome

After implementation:
- No more old test data cluttering the view
- Supply orders accessible from the Tasks page
- Clear visibility into who is fulfilling and their progress
- Staff can quickly flag stock issues without leaving the picking flow
- Full audit trail maintained in status history
