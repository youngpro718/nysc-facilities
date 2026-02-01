

# Complete System Audit & Navigation Badge Fix

## Audit Findings

### Issue Identified: Navigation Badge Mismatch

The **Tasks** navigation shows a badge of **3**, but when you enter the Tasks page, there's nothing corresponding to explain that number. This happens because:

| Component | Data Source | Current Count |
|-----------|-------------|---------------|
| Tasks Badge | `supply_requests` table (pending orders) | 3 (approved requests) |
| Tasks Page | `staff_tasks` table | 0 pending, 1 claimed |

The badge is counting **supply orders** but the page shows **staff tasks** - two completely different systems that were incorrectly linked.

### Root Cause

In the navigation badge logic (`DesktopNavigationImproved.tsx`), the Tasks item was set up to show supply order counts:

```typescript
if (title === 'Tasks') {
  return supplyCounts.pendingOrders; // Counts supply_requests, not staff_tasks!
}
```

This was added during the Supply Request System redesign with the assumption that Court Aides would consider supply orders as their "tasks", but:
1. The `/tasks` page actually shows `staff_tasks` table data
2. The `/supply-room` page shows `supply_requests` table data
3. These are separate systems with different workflows

---

## Proposed Solution

### Change 1: Create a Staff Tasks Pending Count Hook

Create a new hook that counts actual staff tasks that need attention:

```typescript
// src/hooks/useStaffTasksPendingCounts.ts
export function useStaffTasksPendingCounts() {
  return useQuery({
    queryKey: ['staff-tasks-pending-counts'],
    queryFn: async () => {
      // For admins: count tasks needing approval
      const { count: pendingApproval } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      // For workers: count approved tasks available to claim
      const { count: availableToClaim } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('claimed_by', null);

      return {
        pendingApproval: pendingApproval || 0,
        availableToClaim: availableToClaim || 0,
      };
    },
  });
}
```

### Change 2: Update Navigation Badge Logic

Modify `DesktopNavigationImproved.tsx` and `BottomTabBar.tsx` to use the correct counts:

```typescript
// Desktop Navigation
const getBadgeCount = (title: string): number => {
  // Tasks: show staff tasks counts
  if (title === 'Tasks') {
    if (isAdmin) {
      return staffTaskCounts?.pendingApproval || 0;
    }
    return staffTaskCounts?.availableToClaim || 0;
  }
  
  // Supply Room: show supply order counts (for fulfillment staff)
  if (title === 'Supply Room') {
    return supplyCounts?.pendingOrders || 0;
  }
  
  // Supply Requests (Admin): show approval-needed counts
  if (title === 'Supply Requests' && isAdmin) {
    return supplyCounts?.pendingApprovals || 0;
  }
  
  return 0;
};
```

### Change 3: Clear Separation of Systems

| Nav Item | Badge Shows | Links To | Who Sees It |
|----------|-------------|----------|-------------|
| Tasks | Staff tasks pending approval (admin) or available to claim (worker) | `/tasks` | Admin, Court Aide |
| Supply Room | Supply orders to fulfill | `/supply-room` | Court Aide |
| Supply Requests | Supply orders needing admin approval | `/admin/supply-requests` | Admin |

---

## Files to Modify

1. **Create** `src/hooks/useStaffTasksPendingCounts.ts` - New hook for staff task counts
2. **Edit** `src/components/layout/components/DesktopNavigationImproved.tsx` - Fix badge logic
3. **Edit** `src/components/layout/components/BottomTabBar.tsx` - Fix badge logic

---

## Technical Details

### Current State (Broken)
- `useSupplyPendingCounts` returns: `pendingOrders = 3` (from supply_requests)
- This is applied to Tasks badge
- Tasks page shows 0 pending staff_tasks

### After Fix
- `useStaffTasksPendingCounts` returns: `pendingApproval = 0`, `availableToClaim = 0` (from staff_tasks)
- Tasks badge will show 0 (accurate)
- Supply Room badge will show 3 (supply orders to fulfill)

---

## Summary

The issue was caused by conflating two separate systems (staff tasks vs supply orders) during the recent redesign. The fix properly separates them:

- **Staff Tasks** (`/tasks`) = Work requests that need approval/claiming/completion
- **Supply Orders** (`/supply-room`) = Inventory orders to be picked and delivered

Each navigation item will show badges that match what the page actually displays.

