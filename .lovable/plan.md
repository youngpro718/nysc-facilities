

# Comprehensive Fix Plan

## Executive Summary

This plan fixes critical bugs, eliminates confusion, and tightens security across the supply request workflow. I'm being blunt: some things are broken, some are redundant, and some are security risks.

---

## CRITICAL FIXES (Must Do)

### 1. Court Aide Cannot See Supply Orders Tab

**Problem**: In `Tasks.tsx`, Court Aides get a completely different tab set (lines 264-362) that does NOT include the "Supply Orders" tab. Only managers/admins see it. This is backwards - Court Aides are the fulfillers.

**File**: `src/pages/Tasks.tsx`

**Fix**: Add "Supply Orders" tab to the Court Aide tab set (currently lines 264-362):

```text
Current Court Aide tabs:
┌──────────┬───────────┬────────────┬───────────┐
│ My Tasks │ Available │ All Active │ Completed │
└──────────┴───────────┴────────────┴───────────┘

Fixed Court Aide tabs:
┌──────────┬───────────┬────────────┬───────────┬────────────────┐
│ My Tasks │ Available │ All Active │ Completed │ Supply Orders  │ ← ADD
└──────────┴───────────┴────────────┴───────────┴────────────────┘
```

---

### 2. Delete Old Test Data

**Problem**: 5 test supply requests from July-August 2025 are still in the database.

**Action**: Run this SQL in Supabase SQL Editor (not a migration - one-time cleanup):

```sql
-- First delete child records to avoid FK violations
DELETE FROM supply_request_items 
WHERE request_id IN (
  SELECT id FROM supply_requests WHERE created_at < '2026-01-01'
);

DELETE FROM supply_request_status_history 
WHERE request_id IN (
  SELECT id FROM supply_requests WHERE created_at < '2026-01-01'
);

-- Now delete parent records
DELETE FROM supply_requests WHERE created_at < '2026-01-01';
```

---

## CONSOLIDATION (Reduce Confusion)

### 3. Two Supply Fulfillment Locations - Clarify Purpose

**Current State**:
- `/supply-room` → Full supply staff dashboard with inventory management
- `/tasks?tab=supply-orders` → Quick view of orders embedded in Tasks

**Problem**: Court Aides see both a "Supply Room" button AND an "All Tasks" button, but can't see Supply Orders in Tasks.

**Decision**: Both stay, but with clear purposes:

| Location | Purpose | Who Uses |
|----------|---------|----------|
| `/tasks?tab=supply-orders` | Quick overview + picking workflow | Everyone (view), Court Aides (fulfill) |
| `/supply-room` | Full supply management + inventory | Court Aides who need to manage stock |

**Fix**: Ensure Court Aides can access Supply Orders from Tasks (see Fix #1).

---

### 4. Status Mismatch Between Components

**Problem**: `SupplyFulfillmentPanel.tsx` (Court Aide Work Center) uses different status values than `SupplyRequestTracking.tsx`:

- `SupplyFulfillmentPanel` looks for: `approved`, `in_progress`, `ready`
- `SupplyRequestTracking` looks for: `submitted`, `received`, `picking`, `ready`

**Impact**: Orders may appear in one place but not the other.

**File**: `src/components/court-aide/SupplyFulfillmentPanel.tsx`

**Fix**: Align status filters to match the actual workflow:
```typescript
// Line 69 - Change from:
.in('status', ['approved', 'in_progress', 'ready'])

// To:
.in('status', ['submitted', 'received', 'picking', 'ready'])
```

---

## SECURITY FIXES

### 5. RLS Policies Using USING(true)

**Problem**: The linter found 17+ RLS policies that allow ANY authenticated user to INSERT/UPDATE/DELETE. This is dangerous.

**Examples of risky policies** (need audit):
- Tables with `USING (true)` for INSERT allow anyone to create records
- Tables with `USING (true)` for UPDATE allow anyone to modify any record

**Action**: After this plan, run a dedicated security audit to:
1. Identify all `USING (true)` policies
2. Restrict each to appropriate roles using `public.has_role()`

This is not included in this plan as it requires a separate security-focused review.

---

### 6. Function Search Path Vulnerability

**Problem**: Database functions without `search_path` set can be exploited.

**Action**: Document for future migration - all new functions should include:
```sql
SET search_path = public
```

---

## CODE QUALITY

### 7. Remove Debug Console Logs from Supply Components

**Problem**: 76 console.log statements in supply components:
- `SupplyRequestTracking.tsx`: 2 logs
- `QuickOrderGrid.tsx`: 5 logs  
- `SimpleFulfillmentDialog.tsx`: 5 logs
- Others: Various

**Files to clean**:
| File | Logs to Remove |
|------|----------------|
| `src/components/supply/ReceiveCompleteDialog.tsx` | 4 |
| `src/components/supply/QuickOrderGrid.tsx` | 5 |
| `src/components/supply/SupplyRequestTracking.tsx` | 2 |
| `src/components/supply/SimpleFulfillmentDialog.tsx` | 5 |
| `src/components/supply/EnhancedSupplyRoomDashboard.tsx` | 1 |
| `src/components/supply/InventoryManagement.tsx` | 1 |
| `src/components/supply/FulfillmentSuccessScreen.tsx` | 1 |

**Fix**: Replace with proper logging via existing `logger` utility or remove entirely.

---

## IMPLEMENTATION ORDER

### Phase 1: Critical (Do Now)
1. Fix Court Aide Supply Orders tab visibility in `Tasks.tsx`
2. Align status values in `SupplyFulfillmentPanel.tsx`
3. Manual SQL cleanup of old test data

### Phase 2: Quality (Same Session)
4. Remove console.log statements from supply components

### Phase 3: Security (Separate Review)
5. Audit and fix all `USING (true)` RLS policies
6. Audit functions missing `search_path`

---

## What Stays (Good Decisions)

These are working correctly and should NOT be changed:

1. **Dashboard separation** - Admin, CMC, Court Aide, Standard users each see role-appropriate dashboards
2. **Supply order flow** - submitted → received → picking → ready → completed
3. **Fulfiller visibility** - Shows who is assigned and picking progress
4. **Stock alert buttons** - Out of Stock / Low Stock quick actions
5. **Court Aide Work Center** - Purpose-built dashboard with Supply Fulfillment Panel

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/pages/Tasks.tsx` | Modify | Add Supply Orders tab for Court Aides |
| `src/components/court-aide/SupplyFulfillmentPanel.tsx` | Modify | Fix status filter alignment |
| `src/components/supply/ReceiveCompleteDialog.tsx` | Modify | Remove console.logs |
| `src/components/supply/QuickOrderGrid.tsx` | Modify | Remove console.logs |
| `src/components/supply/SupplyRequestTracking.tsx` | Modify | Remove console.logs |
| `src/components/supply/SimpleFulfillmentDialog.tsx` | Modify | Remove console.logs |
| `src/components/supply/EnhancedSupplyRoomDashboard.tsx` | Modify | Remove console.logs |
| `src/components/supply/InventoryManagement.tsx` | Modify | Remove console.logs |
| `src/components/supply/FulfillmentSuccessScreen.tsx` | Modify | Remove console.logs |
| Database (Manual) | SQL | Delete old test requests |

---

## Expected Outcomes

After implementation:
- Court Aides can see and fulfill supply orders from the Tasks page
- No status mismatches between different views
- Old test data removed from production
- Cleaner console output without debug noise
- Clear path forward for security hardening

