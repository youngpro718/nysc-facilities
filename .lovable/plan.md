

# Fix: Orange Dots Showing for Rooms with Only Resolved Issues

## Problem
All 5 rooms with orange dots have issues that are **already resolved**. The orange dots persist because:
1. The issues query fetches ALL issues regardless of status
2. The sidebar counts all issues — resolved included — to determine the dot color

## Solution

### Option A (Filter in sidebar — minimal change)
In `RoomsSidebarList.tsx`, change line 92 to only count open/in-progress issues:

```typescript
const issueCount = Array.isArray(room.issues)
  ? room.issues.filter(i => i.status === 'open' || i.status === 'in_progress').length
  : 0;
```

### Option B (Filter at query level — cleaner)
In `roomQueries.ts`, add `.in('status', ['open', 'in_progress'])` to the issues fetch so resolved issues are never loaded into the room data. This is cleaner but affects every consumer of `room.issues`.

**Recommendation**: Do both. Filter at the query level so we don't load unnecessary data, and also filter in the sidebar as a safety net.

## Files to Change

| File | Change |
|------|--------|
| `roomQueries.ts` | Add status filter to issues query |
| `RoomsSidebarList.tsx` | Filter `room.issues` to only count open/in-progress |

